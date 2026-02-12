import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: async () => 'mock-hash',
}));

import { clearClientDataByLots } from '../src/db/repo';

type RunCall = { sql: string; params: unknown[] };
type SQLiteDatabase = {
  runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>;
  withTransactionAsync: (fn: () => Promise<void>) => Promise<void>;
};

function createDb() {
  const calls: RunCall[] = [];
  const db = {
    runAsync: async (sql: string, ...params: unknown[]) => {
      calls.push({ sql, params });
      return {};
    },
    withTransactionAsync: async (fn: () => Promise<void>) => {
      await fn();
    },
  } as unknown as SQLiteDatabase;

  return { db, calls };
}

describe('clearClientDataByLots', () => {
  it('clears only the specified lot when head code is present', async () => {
    const { db, calls } = createDb();
    await clearClientDataByLots(db as any, 'soc-1', 'agent-1', [
      { accountHeadCode: '007', accountType: 'PIGMY', frequency: 'DAILY' },
    ]);

    expect(calls).toHaveLength(2);
    expect(calls[0].sql).toContain('DELETE FROM collections');
    expect(calls[0].sql).toContain('account_head_code = ?');
    expect(calls[0].params).toEqual(['soc-1', 'agent-1', 'soc-1', 'agent-1', 'PIGMY', 'DAILY', '007']);
    expect(calls[1].sql).toContain('DELETE FROM accounts');
    expect(calls[1].params).toEqual(['soc-1', 'agent-1', 'PIGMY', 'DAILY', '007']);
  });

  it('does not remove other lots when head code is missing', async () => {
    const { db, calls } = createDb();
    await clearClientDataByLots(db as any, 'soc-1', 'agent-1', [
      { accountHeadCode: null, accountType: 'LOAN', frequency: 'MONTHLY' },
    ]);

    expect(calls).toHaveLength(2);
    expect(calls[0].sql).toContain('account_head_code IS NULL');
    expect(calls[0].sql).toContain("account_head_code = ''");
    expect(calls[0].params).toEqual(['soc-1', 'agent-1', 'soc-1', 'agent-1', 'LOAN', 'MONTHLY']);
    expect(calls[1].sql).toContain('DELETE FROM accounts');
    expect(calls[1].params).toEqual(['soc-1', 'agent-1', 'LOAN', 'MONTHLY']);
  });

  it('clears multiple lots in one transaction', async () => {
    const { db, calls } = createDb();
    await clearClientDataByLots(db as any, 'soc-1', 'agent-1', [
      { accountHeadCode: '007', accountType: 'PIGMY', frequency: 'DAILY' },
      { accountHeadCode: '034', accountType: 'PIGMY', frequency: 'MONTHLY' },
    ]);

    expect(calls).toHaveLength(4);
  });

  it('no-ops when no lots provided', async () => {
    const { db, calls } = createDb();
    await clearClientDataByLots(db as any, 'soc-1', 'agent-1', []);
    expect(calls).toHaveLength(0);
  });
});
