import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: async () => 'mock-hash',
  randomUUID: (() => {
    let id = 0;
    return () => `uuid-${++id}`;
  })(),
}));

import { importParsedReport } from '../src/sync/importAgentReport';
import type { ParsedReport } from '../src/sync/parseAgentReport';

type RunCall = { sql: string; params: unknown[] };
type GetFirstCall = { sql: string; params: unknown[] };
type SQLiteDatabase = {
  getFirstAsync: (sql: string, ...params: unknown[]) => Promise<any>;
  runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>;
  withTransactionAsync: (fn: () => Promise<void>) => Promise<void>;
};

function createDb() {
  const runCalls: RunCall[] = [];
  const getFirstCalls: GetFirstCall[] = [];
  const db = {
    getFirstAsync: async (sql: string, ...params: unknown[]) => {
      getFirstCalls.push({ sql, params });
      if (sql.includes('SELECT * FROM societies WHERE code = ?;')) {
        return { id: 'soc-1', code: 'SOCIETY1', name: 'Society One' };
      }
      if (sql.includes('SELECT id FROM agents WHERE society_id = ? AND code = ?;')) {
        return { id: 'agent-1' };
      }
      if (sql.includes('SELECT id FROM accounts')) {
        return null;
      }
      return null;
    },
    runAsync: async (sql: string, ...params: unknown[]) => {
      runCalls.push({ sql, params });
      return {};
    },
    withTransactionAsync: async (fn: () => Promise<void>) => {
      await fn();
    },
  } as unknown as SQLiteDatabase;

  return { db, runCalls, getFirstCalls };
}

function makeReport(): ParsedReport {
  return {
    societyName: 'Society One',
    societyCode: 'SOCIETY1',
    agentName: 'Agent A',
    agentCode: '001',
    reportDateISO: '2026-02-12',
    accounts: [
      {
        accountNo: '00700001',
        clientName: 'CLIENT ONE',
        balanceRupees: 1200,
        installmentRupees: 100,
        accountType: 'PIGMY',
        frequency: 'DAILY',
        accountHead: 'DAILY PIGMY ACCOUNT',
        accountHeadCode: '007',
      },
    ],
  };
}

describe('importParsedReport', () => {
  it('upserts accounts scoped by society + agent + lot key', async () => {
    const { db, runCalls, getFirstCalls } = createDb();
    await importParsedReport(db as any, makeReport(), { replaceExisting: false });

    const accountLookup = getFirstCalls.find((c) => c.sql.includes('SELECT id FROM accounts'));
    expect(accountLookup?.params).toEqual(['soc-1', 'agent-1', '00700001', '007_PIGMY_DAILY']);

    const accountInsert = runCalls.find((c) => c.sql.includes('INSERT INTO accounts'));
    expect(accountInsert?.sql).toContain('agent_id');
    expect(accountInsert?.sql).toContain('account_lot_key');
    expect(accountInsert?.params).toContain('agent-1');
    expect(accountInsert?.params).toContain('007_PIGMY_DAILY');
  });

  it('replace mode clears only the same society/agent lot data', async () => {
    const { db, runCalls } = createDb();
    await importParsedReport(db as any, makeReport());

    const deleteExports = runCalls.find((c) => c.sql.includes('DELETE FROM exports'));
    expect(deleteExports?.params).toEqual(['soc-1', 'agent-1']);

    const deleteCollections = runCalls.find((c) => c.sql.includes('DELETE FROM collections'));
    expect(deleteCollections?.sql).toContain('society_id = ? AND agent_id = ?');
    expect(deleteCollections?.params?.slice(0, 2)).toEqual(['soc-1', 'agent-1']);

    const deleteAccounts = runCalls.find((c) => c.sql.includes('DELETE FROM accounts'));
    expect(deleteAccounts?.sql).toContain('account_lot_key = ?');
    expect(deleteAccounts?.params?.slice(0, 2)).toEqual(['soc-1', 'agent-1']);
  });
});
