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

type StoredSociety = {
  id: string;
  code: string;
  name: string;
};

type StoredAgent = {
  id: string;
  society_id: string;
  code: string;
  name: string;
  phone: string | null;
  pin_hash: string;
  is_active: number;
};

type StoredAccount = {
  id: string;
  society_id: string;
  agent_id: string;
  account_no: string;
  account_lot_key: string;
  client_name: string;
  account_type: string;
  frequency: string;
  account_head: string | null;
  account_head_code: string | null;
  installment_paise: number;
  balance_paise: number;
  last_txn_at: string | null;
  opened_at: string | null;
  closes_at: string | null;
  status: string;
};

type InMemoryState = {
  societies: StoredSociety[];
  agents: StoredAgent[];
  accounts: StoredAccount[];
};

function createImportDb() {
  const state: InMemoryState = {
    societies: [],
    agents: [],
    accounts: [],
  };

  const db = {
    getFirstAsync: async (sql: string, ...params: unknown[]) => {
      if (sql.includes('SELECT * FROM societies WHERE code = ?;')) {
        const [code] = params as [string];
        return state.societies.find((s) => s.code === code) ?? null;
      }

      if (sql.includes('SELECT id FROM agents WHERE society_id = ? AND code = ?;')) {
        const [societyId, code] = params as [string, string];
        const row = state.agents.find((a) => a.society_id === societyId && a.code === code);
        return row ? { id: row.id } : null;
      }

      if (sql.includes('SELECT id FROM accounts')) {
        const [societyId, agentId, accountNo, lotKey] = params as [string, string, string, string];
        const row = state.accounts.find(
          (a) =>
            a.society_id === societyId &&
            a.agent_id === agentId &&
            a.account_no === accountNo &&
            a.account_lot_key === lotKey
        );
        return row ? { id: row.id } : null;
      }

      throw new Error(`Unexpected getFirstAsync SQL in test: ${sql}`);
    },
    runAsync: async (sql: string, ...params: unknown[]) => {
      if (sql.includes('UPDATE societies SET name = ? WHERE id = ?;')) {
        const [name, id] = params as [string, string];
        const row = state.societies.find((s) => s.id === id);
        if (row) row.name = name;
        return {};
      }

      if (sql.includes('INSERT INTO societies (id, code, name) VALUES (?, ?, ?);')) {
        const [id, code, name] = params as [string, string, string];
        state.societies.push({ id, code, name });
        return {};
      }

      if (sql.includes('UPDATE agents SET name = ?, pin_hash = ?, is_active = 1 WHERE id = ?;')) {
        const [name, pinHash, id] = params as [string, string, string];
        const row = state.agents.find((a) => a.id === id);
        if (row) {
          row.name = name;
          row.pin_hash = pinHash;
          row.is_active = 1;
        }
        return {};
      }

      if (sql.includes('INSERT INTO agents (id, society_id, code, name, phone, pin_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, 1);')) {
        const [id, societyId, code, name, phone, pinHash] = params as [
          string,
          string,
          string,
          string,
          string | null,
          string
        ];
        state.agents.push({
          id,
          society_id: societyId,
          code,
          name,
          phone,
          pin_hash: pinHash,
          is_active: 1,
        });
        return {};
      }

      if (sql.includes('UPDATE accounts')) {
        const [clientName, lotKey, accountType, frequency, accountHead, accountHeadCode, installmentPaise, balancePaise, lastTxnAt, id] =
          params as [string, string, string, string, string | null, string | null, number, number, string | null, string];
        const row = state.accounts.find((a) => a.id === id);
        if (row) {
          row.client_name = clientName;
          row.account_lot_key = lotKey;
          row.account_type = accountType;
          row.frequency = frequency;
          row.account_head = accountHead;
          row.account_head_code = accountHeadCode;
          row.installment_paise = installmentPaise;
          row.balance_paise = balancePaise;
          row.last_txn_at = lastTxnAt;
        }
        return {};
      }

      if (sql.includes('INSERT INTO accounts')) {
        const [
          id,
          societyId,
          agentId,
          accountNo,
          lotKey,
          clientName,
          accountType,
          frequency,
          accountHead,
          accountHeadCode,
          installmentPaise,
          balancePaise,
          lastTxnAt,
          openedAt,
          closesAt,
        ] = params as [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string | null,
          string | null,
          number,
          number,
          string | null,
          string | null,
          string | null,
        ];

        state.accounts.push({
          id,
          society_id: societyId,
          agent_id: agentId,
          account_no: accountNo,
          account_lot_key: lotKey,
          client_name: clientName,
          account_type: accountType,
          frequency,
          account_head: accountHead,
          account_head_code: accountHeadCode,
          installment_paise: installmentPaise,
          balance_paise: balancePaise,
          last_txn_at: lastTxnAt,
          opened_at: openedAt,
          closes_at: closesAt,
          status: 'ACTIVE',
        });
        return {};
      }

      throw new Error(`Unexpected runAsync SQL in test: ${sql}`);
    },
    withTransactionAsync: async (fn: () => Promise<void>) => {
      await fn();
    },
  };

  return { db, state };
}

function makeReport(params: {
  societyName: string;
  societyCode: string;
  agentName: string;
  agentCode: string;
  accountNo: string;
  clientName: string;
  accountHead: string;
  accountHeadCode: string | null;
  accountType: 'PIGMY' | 'LOAN' | 'SAVINGS';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  installmentRupees: number;
  balanceRupees: number;
}): ParsedReport {
  return {
    societyName: params.societyName,
    societyCode: params.societyCode,
    agentName: params.agentName,
    agentCode: params.agentCode,
    reportDateISO: '2026-02-12',
    accounts: [
      {
        accountNo: params.accountNo,
        clientName: params.clientName,
        accountHead: params.accountHead,
        accountHeadCode: params.accountHeadCode,
        accountType: params.accountType,
        frequency: params.frequency,
        installmentRupees: params.installmentRupees,
        balanceRupees: params.balanceRupees,
      },
    ],
  };
}

describe('import isolation scenarios', () => {
  it('stores same society/same agent accounts separately by account type (lot) with different clients', async () => {
    const { db, state } = createImportDb();

    const pigmy = makeReport({
      societyName: 'Society One',
      societyCode: 'SOC001',
      agentName: 'Agent Common',
      agentCode: '001',
      accountNo: '000123',
      clientName: 'PIGMY CLIENT',
      accountHead: 'DAILY PIGMY ACCOUNT',
      accountHeadCode: '007',
      accountType: 'PIGMY',
      frequency: 'DAILY',
      installmentRupees: 100,
      balanceRupees: 1200,
    });

    const loan = makeReport({
      societyName: 'Society One',
      societyCode: 'SOC001',
      agentName: 'Agent Common',
      agentCode: '001',
      accountNo: '000123',
      clientName: 'LOAN CLIENT',
      accountHead: 'LOAN ACCOUNT',
      accountHeadCode: '021',
      accountType: 'LOAN',
      frequency: 'MONTHLY',
      installmentRupees: 500,
      balanceRupees: 10000,
    });

    await importParsedReport(db as any, pigmy, { replaceExisting: false });
    await importParsedReport(db as any, loan, { replaceExisting: false });

    expect(state.societies).toHaveLength(1);
    expect(state.agents).toHaveLength(1);
    expect(state.accounts).toHaveLength(2);

    const pigmyAccount = state.accounts.find((a) => a.account_lot_key === '007_PIGMY_DAILY');
    const loanAccount = state.accounts.find((a) => a.account_lot_key === '021_LOAN_MONTHLY');

    expect(pigmyAccount?.client_name).toBe('PIGMY CLIENT');
    expect(loanAccount?.client_name).toBe('LOAN CLIENT');
  });

  it('updates within the same lot instead of duplicating rows', async () => {
    const { db, state } = createImportDb();

    const first = makeReport({
      societyName: 'Society One',
      societyCode: 'SOC001',
      agentName: 'Agent Common',
      agentCode: '001',
      accountNo: '700001',
      clientName: 'CLIENT OLD',
      accountHead: 'DAILY PIGMY ACCOUNT',
      accountHeadCode: '007',
      accountType: 'PIGMY',
      frequency: 'DAILY',
      installmentRupees: 50,
      balanceRupees: 500,
    });

    const second = makeReport({
      societyName: 'Society One',
      societyCode: 'SOC001',
      agentName: 'Agent Common',
      agentCode: '001',
      accountNo: '700001',
      clientName: 'CLIENT NEW',
      accountHead: 'DAILY PIGMY ACCOUNT',
      accountHeadCode: '007',
      accountType: 'PIGMY',
      frequency: 'DAILY',
      installmentRupees: 75,
      balanceRupees: 800,
    });

    await importParsedReport(db as any, first, { replaceExisting: false });
    await importParsedReport(db as any, second, { replaceExisting: false });

    expect(state.accounts).toHaveLength(1);
    expect(state.accounts[0].client_name).toBe('CLIENT NEW');
    expect(state.accounts[0].installment_paise).toBe(7500);
    expect(state.accounts[0].balance_paise).toBe(80000);
  });

  it('keeps same agent code isolated across different societies', async () => {
    const { db, state } = createImportDb();

    const societyOneReport = makeReport({
      societyName: 'Society One',
      societyCode: 'SOC001',
      agentName: 'Agent Common',
      agentCode: '001',
      accountNo: '900001',
      clientName: 'SOCIETY ONE CLIENT',
      accountHead: 'DAILY PIGMY ACCOUNT',
      accountHeadCode: '007',
      accountType: 'PIGMY',
      frequency: 'DAILY',
      installmentRupees: 100,
      balanceRupees: 1000,
    });

    const societyTwoReport = makeReport({
      societyName: 'Society Two',
      societyCode: 'SOC002',
      agentName: 'Agent Common',
      agentCode: '001',
      accountNo: '900001',
      clientName: 'SOCIETY TWO CLIENT',
      accountHead: 'DAILY PIGMY ACCOUNT',
      accountHeadCode: '007',
      accountType: 'PIGMY',
      frequency: 'DAILY',
      installmentRupees: 120,
      balanceRupees: 2000,
    });

    await importParsedReport(db as any, societyOneReport, { replaceExisting: false });
    await importParsedReport(db as any, societyTwoReport, { replaceExisting: false });

    expect(state.societies).toHaveLength(2);
    expect(state.agents).toHaveLength(2);
    expect(state.accounts).toHaveLength(2);

    const societyOne = state.societies.find((s) => s.code === 'SOC001');
    const societyTwo = state.societies.find((s) => s.code === 'SOC002');
    expect(societyOne).toBeTruthy();
    expect(societyTwo).toBeTruthy();

    const societyOneAgent = state.agents.find((a) => a.society_id === societyOne?.id && a.code === '001');
    const societyTwoAgent = state.agents.find((a) => a.society_id === societyTwo?.id && a.code === '001');
    expect(societyOneAgent).toBeTruthy();
    expect(societyTwoAgent).toBeTruthy();

    const societyOneAccount = state.accounts.find(
      (a) => a.society_id === societyOne?.id && a.agent_id === societyOneAgent?.id && a.account_no === '900001'
    );
    const societyTwoAccount = state.accounts.find(
      (a) => a.society_id === societyTwo?.id && a.agent_id === societyTwoAgent?.id && a.account_no === '900001'
    );

    expect(societyOneAccount?.client_name).toBe('SOCIETY ONE CLIENT');
    expect(societyTwoAccount?.client_name).toBe('SOCIETY TWO CLIENT');
  });
});
