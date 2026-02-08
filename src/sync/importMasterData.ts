import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { AccountStatus, AccountType, Frequency } from '../models/types';
import { rupeesToPaise } from '../utils/money';

type MasterDataV1 = {
  schemaVersion: 1;
  society: { code: string; name: string };
  agents?: Array<{ code: string; name: string; phone?: string | null; pin?: string; pinHash?: string }>;
  accounts?: Array<{
    accountNo: string;
    clientName: string;
    accountType: AccountType | string;
    frequency: Frequency | string;
    installmentPaise?: number;
    installmentRupees?: number;
    installmentAmount?: number;
    balancePaise?: number;
    balanceRupees?: number;
    balance?: number;
    lastTxnAt?: string | null;
    lastTxnDate?: string | null;
    lastTrDate?: string | null;
    openedAt?: string | null;
    openingDate?: string | null;
    closesAt?: string | null;
    closingDate?: string | null;
    status?: AccountStatus | string;
  }>;
};

function assertMasterDataV1(raw: any): MasterDataV1 {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid JSON: expected object');
  if (raw.schemaVersion !== 1) throw new Error('Unsupported schemaVersion (expected 1)');
  if (!raw.society?.code || !raw.society?.name) throw new Error('Missing society.code or society.name');
  return raw as MasterDataV1;
}

function normalizeAccountType(input: string): AccountType {
  const v = input.trim().toUpperCase();
  if (v === 'PIGMY' || v === 'PIGMI' || v === 'DAILY') return 'PIGMY';
  if (v === 'LOAN') return 'LOAN';
  return 'SAVINGS';
}

function normalizeFrequency(input: string): Frequency {
  const v = input.trim().toUpperCase();
  if (v === 'DAILY' || v === 'D') return 'DAILY';
  if (v === 'WEEKLY' || v === 'W') return 'WEEKLY';
  return 'MONTHLY';
}

function normalizeStatus(input: string | undefined): AccountStatus {
  const v = (input ?? 'ACTIVE').trim().toUpperCase();
  return v === 'CLOSED' ? 'CLOSED' : 'ACTIVE';
}

function toPaiseFromAny(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.max(0, Math.round(n));
  }
  return 0;
}

function toRupeesNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

async function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

export async function importMasterData(db: SQLiteDatabase, rawJson: any): Promise<{
  societyCode: string;
  societyName: string;
  agentsUpserted: number;
  accountsUpserted: number;
}> {
  const data = assertMasterDataV1(rawJson);
  const societyCode = String(data.society.code).trim().toUpperCase();
  const societyName = String(data.society.name).trim();

  let societyId: string;

  await db.withTransactionAsync(async () => {
    const existingSociety = await db.getFirstAsync<any>('SELECT * FROM societies WHERE code = ?;', societyCode);
    if (existingSociety) {
      societyId = existingSociety.id;
      await db.runAsync('UPDATE societies SET name = ? WHERE id = ?;', societyName, societyId);
    } else {
      societyId = Crypto.randomUUID();
      await db.runAsync(
        'INSERT INTO societies (id, code, name) VALUES (?, ?, ?);',
        societyId,
        societyCode,
        societyName
      );
    }

    if (Array.isArray(data.agents)) {
      for (const a of data.agents) {
        const code = String(a.code).trim().toUpperCase();
        const name = String(a.name ?? '').trim();
        if (!code || !name) continue;
        const phone = a.phone ? String(a.phone).trim() : null;

        const row = await db.getFirstAsync<any>(
          'SELECT id, pin_hash FROM agents WHERE society_id = ? AND code = ?;',
          societyId,
          code
        );

        let pinHash: string | null = null;
        if (a.pinHash) pinHash = String(a.pinHash);
        else if (a.pin) pinHash = await sha256(`${societyId}:${String(a.pin)}`);

        if (row) {
          await db.runAsync(
            `UPDATE agents
             SET name = ?, phone = ?, is_active = 1
             ${pinHash ? ', pin_hash = ?' : ''}
             WHERE id = ?;`,
            ...(pinHash ? [name, phone, pinHash, row.id] : [name, phone, row.id])
          );
        } else {
          if (!pinHash) pinHash = await sha256(`${societyId}:0000`);
          await db.runAsync(
            'INSERT INTO agents (id, society_id, code, name, phone, pin_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, 1);',
            Crypto.randomUUID(),
            societyId,
            code,
            name,
            phone,
            pinHash
          );
        }
      }
    }

    if (Array.isArray(data.accounts)) {
      for (const a of data.accounts) {
        const accountNo = String(a.accountNo ?? '').trim();
        const clientName = String(a.clientName ?? '').trim();
        if (!accountNo || !clientName) continue;

        const accountType = normalizeAccountType(String(a.accountType ?? 'SAVINGS'));
        const frequency = normalizeFrequency(String(a.frequency ?? 'MONTHLY'));
        const status = normalizeStatus(String(a.status ?? 'ACTIVE'));

        const installmentPaise =
          a.installmentPaise !== undefined
            ? toPaiseFromAny(a.installmentPaise)
            : rupeesToPaise(toRupeesNumber(a.installmentRupees ?? a.installmentAmount ?? 0));

        const balancePaise =
          a.balancePaise !== undefined ? toPaiseFromAny(a.balancePaise) : rupeesToPaise(toRupeesNumber(a.balance ?? a.balanceRupees ?? 0));

        const lastTxnAt = a.lastTxnAt ?? a.lastTxnDate ?? a.lastTrDate ?? null;
        const openedAt = a.openedAt ?? a.openingDate ?? null;
        const closesAt = a.closesAt ?? a.closingDate ?? null;

        const existing = await db.getFirstAsync<any>(
          'SELECT id FROM accounts WHERE society_id = ? AND account_no = ?;',
          societyId,
          accountNo
        );

        if (existing) {
          await db.runAsync(
            `UPDATE accounts
             SET client_name = ?, account_type = ?, frequency = ?,
                 installment_paise = ?, balance_paise = ?, last_txn_at = ?,
                 opened_at = ?, closes_at = ?, status = ?
             WHERE id = ?;`,
            clientName,
            accountType,
            frequency,
            installmentPaise,
            balancePaise,
            lastTxnAt,
            openedAt,
            closesAt,
            status,
            existing.id
          );
        } else {
          await db.runAsync(
            `INSERT INTO accounts (
                id, society_id, account_no, client_name, account_type, frequency,
                installment_paise, balance_paise, last_txn_at, opened_at, closes_at, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            Crypto.randomUUID(),
            societyId,
            accountNo,
            clientName,
            accountType,
            frequency,
            installmentPaise,
            balancePaise,
            lastTxnAt,
            openedAt,
            closesAt,
            status
          );
        }
      }
    }
  });

  const agentsUpserted = Array.isArray(data.agents) ? data.agents.length : 0;
  const accountsUpserted = Array.isArray(data.accounts) ? data.accounts.length : 0;
  return { societyCode, societyName, agentsUpserted, accountsUpserted };
}

