import * as Crypto from 'expo-crypto';

import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Account,
  AccountLot,
  AccountStatus,
  AccountType,
  ActiveLot,
  Agent,
  AgentProfile,
  CollectionEntry,
  CollectionStatus,
  ExportCollectionRow,
  ExportRecord,
  Frequency,
  Society,
} from '../models/types';
import { nowISO, toISODate } from '../utils/dates';
import { lotKeyFromParts } from '../utils/lots';

function mapAgent(row: any): Agent {
  return {
    id: row.id,
    societyId: row.society_id,
    code: row.code,
    name: row.name,
    phone: row.phone ?? null,
    isActive: Boolean(row.is_active),
  };
}

function mapSociety(row: any): Society {
  return { id: row.id, code: row.code, name: row.name };
}

function mapAccount(row: any): Account {
  return {
    id: row.id,
    societyId: row.society_id,
    agentId: row.agent_id,
    accountNo: row.account_no,
    lotKey: row.account_lot_key,
    clientName: row.client_name,
    accountType: row.account_type as AccountType,
    frequency: row.frequency as Frequency,
    accountHead: row.account_head ?? null,
    accountHeadCode: row.account_head_code ?? null,
    installmentPaise: row.installment_paise,
    balancePaise: row.balance_paise,
    lastTxnAt: row.last_txn_at ?? null,
    openedAt: row.opened_at ?? null,
    closesAt: row.closes_at ?? null,
    status: row.status as AccountStatus,
  };
}

function mapCollection(row: any): CollectionEntry {
  return {
    id: row.id,
    societyId: row.society_id,
    agentId: row.agent_id,
    accountId: row.account_id,
    accountNo: row.account_no,
    collectedPaise: row.collected_paise,
    collectedAt: row.collected_at,
    collectionDate: row.collection_date,
    status: row.status as CollectionStatus,
    exportedAt: row.exported_at ?? null,
    remarks: row.remarks ?? null,
  };
}

function mapExport(row: any): ExportRecord {
  return {
    id: row.id,
    societyId: row.society_id,
    agentId: row.agent_id,
    exportedAt: row.exported_at,
    fileUri: row.file_uri ?? null,
    collectionsCount: row.collections_count ?? 0,
  };
}

function mapExportCollection(row: any): ExportCollectionRow {
  return {
    id: row.id,
    societyId: row.society_id,
    agentId: row.agent_id,
    accountId: row.account_id,
    accountNo: row.account_no,
    collectedPaise: row.collected_paise,
    collectedAt: row.collected_at,
    collectionDate: row.collection_date,
    status: row.status as CollectionStatus,
    exportedAt: row.exported_at ?? null,
    remarks: row.remarks ?? null,
    clientName: row.client_name,
    accountHead: row.account_head ?? null,
    accountHeadCode: row.account_head_code ?? null,
    accountType: row.account_type as AccountType,
    frequency: row.frequency as Frequency,
  };
}

const REG_SOCIETY_KEY = 'registration.society_name';
const REG_AGENT_KEY = 'registration.agent_name';
const ACTIVE_LOT_KEY_SUFFIX = 'key';
const ACTIVE_LOT_HEAD_SUFFIX = 'head';
const ACTIVE_LOT_CODE_SUFFIX = 'code';
const ACTIVE_LOT_TYPE_SUFFIX = 'type';
const ACTIVE_LOT_FREQ_SUFFIX = 'freq';

const activeLotKey = (societyId: string, suffix: string) => `active.lot.${societyId}.${suffix}`;
const normalizeLotCode = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};


async function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

export async function authenticateAgent(
  db: SQLiteDatabase,
  societyCode: string,
  agentCode: string,
  pin: string
): Promise<{ society: Society; agent: Agent } | null> {
  const societyRow = await db.getFirstAsync<any>('SELECT * FROM societies WHERE code = ?;', societyCode);
  if (!societyRow) return null;

  const agentRow = await db.getFirstAsync<any>(
    'SELECT * FROM agents WHERE society_id = ? AND code = ? AND is_active = 1;',
    societyRow.id,
    agentCode
  );
  if (!agentRow) return null;

  const expectedHash = agentRow.pin_hash as string;
  const inputHash = await sha256(`${societyRow.id}:${pin}`);
  if (inputHash !== expectedHash) return null;

  return { society: mapSociety(societyRow), agent: mapAgent(agentRow) };
}


export async function getSocietyById(db: SQLiteDatabase, societyId: string): Promise<Society | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM societies WHERE id = ?;', societyId);
  return row ? mapSociety(row) : null;
}

export async function getSocietyByCode(db: SQLiteDatabase, code: string): Promise<Society | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM societies WHERE code = ?;', code);
  return row ? mapSociety(row) : null;
}

export async function getAgentById(db: SQLiteDatabase, agentId: string): Promise<Agent | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM agents WHERE id = ?;', agentId);
  return row ? mapAgent(row) : null;
}

export async function getAgentBySocietyAndCode(
  db: SQLiteDatabase,
  societyId: string,
  agentCode: string
): Promise<Agent | null> {
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM agents WHERE society_id = ? AND code = ?;',
    societyId,
    agentCode
  );
  return row ? mapAgent(row) : null;
}

export async function listAgentProfiles(db: SQLiteDatabase): Promise<AgentProfile[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT a.*, s.code as society_code, s.name as society_name
     FROM agents a
     JOIN societies s ON s.id = a.society_id
     WHERE a.is_active = 1
     ORDER BY s.name COLLATE NOCASE, a.code COLLATE NOCASE;`
  );
  return rows.map((row) => ({
    society: { id: row.society_id, code: row.society_code, name: row.society_name },
    agent: mapAgent(row),
  }));
}

export async function getRegistration(db: SQLiteDatabase): Promise<{ societyName: string; agentName: string } | null> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM app_meta WHERE key IN (?, ?);',
    REG_SOCIETY_KEY,
    REG_AGENT_KEY
  );
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const societyName = map.get(REG_SOCIETY_KEY);
  const agentName = map.get(REG_AGENT_KEY);
  if (!societyName || !agentName) return null;
  return { societyName, agentName };
}

export async function saveRegistration(
  db: SQLiteDatabase,
  params: { societyName: string; agentName: string }
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);', REG_SOCIETY_KEY, params.societyName);
    await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);', REG_AGENT_KEY, params.agentName);
  });
}

export async function getActiveLot(db: SQLiteDatabase, societyId: string): Promise<ActiveLot | null> {
  const keys = [
    activeLotKey(societyId, ACTIVE_LOT_KEY_SUFFIX),
    activeLotKey(societyId, ACTIVE_LOT_HEAD_SUFFIX),
    activeLotKey(societyId, ACTIVE_LOT_CODE_SUFFIX),
    activeLotKey(societyId, ACTIVE_LOT_TYPE_SUFFIX),
    activeLotKey(societyId, ACTIVE_LOT_FREQ_SUFFIX),
  ];
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM app_meta WHERE key IN (?, ?, ?, ?, ?);',
    ...keys
  );
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const key = map.get(keys[0]);
  const accountType = map.get(keys[3]) as AccountType | undefined;
  const frequency = map.get(keys[4]) as Frequency | undefined;
  if (!key || !accountType || !frequency) return null;
  return {
    key,
    accountHead: map.get(keys[1]) ?? null,
    accountHeadCode: map.get(keys[2]) ?? null,
    accountType,
    frequency,
  };
}

export async function saveActiveLot(db: SQLiteDatabase, societyId: string, lot: ActiveLot | null): Promise<void> {
  if (!lot) {
    const keys = [
      activeLotKey(societyId, ACTIVE_LOT_KEY_SUFFIX),
      activeLotKey(societyId, ACTIVE_LOT_HEAD_SUFFIX),
      activeLotKey(societyId, ACTIVE_LOT_CODE_SUFFIX),
      activeLotKey(societyId, ACTIVE_LOT_TYPE_SUFFIX),
      activeLotKey(societyId, ACTIVE_LOT_FREQ_SUFFIX),
    ];
    await db.runAsync(
      'DELETE FROM app_meta WHERE key IN (?, ?, ?, ?, ?);',
      ...keys
    );
    return;
  }
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);',
      activeLotKey(societyId, ACTIVE_LOT_KEY_SUFFIX),
      lot.key
    );
    await db.runAsync(
      'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);',
      activeLotKey(societyId, ACTIVE_LOT_HEAD_SUFFIX),
      lot.accountHead ?? ''
    );
    await db.runAsync(
      'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);',
      activeLotKey(societyId, ACTIVE_LOT_CODE_SUFFIX),
      lot.accountHeadCode ?? ''
    );
    await db.runAsync(
      'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);',
      activeLotKey(societyId, ACTIVE_LOT_TYPE_SUFFIX),
      lot.accountType
    );
    await db.runAsync(
      'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);',
      activeLotKey(societyId, ACTIVE_LOT_FREQ_SUFFIX),
      lot.frequency
    );
  });
}

export async function getAccountById(params: {
  db: SQLiteDatabase;
  accountId: string;
  societyId: string;
  agentId: string;
}): Promise<Account | null> {
  const row = await params.db.getFirstAsync<any>(
    `SELECT * FROM accounts
     WHERE id = ? AND society_id = ? AND agent_id = ?;`,
    params.accountId,
    params.societyId,
    params.agentId
  );
  return row ? mapAccount(row) : null;
}

export async function searchAccountsByLastDigits(
  db: SQLiteDatabase,
  societyId: string,
  agentId: string,
  digits: string
): Promise<Account[]> {
  const q = digits.trim();
  if (!q) return [];

  const rows = await db.getAllAsync<any>(
    `SELECT * FROM accounts
     WHERE society_id = ?
       AND agent_id = ?
       AND status = 'ACTIVE'
       AND account_no LIKE '%' || ?
     ORDER BY account_no ASC
     LIMIT 50;`,
    societyId,
    agentId,
    q
  );
  return rows.map(mapAccount);
}

export async function listAccounts(
  db: SQLiteDatabase,
  societyId: string,
  agentId: string,
  limit: number = 2000
): Promise<Account[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM accounts
     WHERE society_id = ?
       AND agent_id = ?
     ORDER BY client_name ASC
     LIMIT ?;`,
    societyId,
    agentId,
    limit
  );
  return rows.map(mapAccount);
}

export async function listAccountLots(db: SQLiteDatabase, societyId: string, agentId: string): Promise<AccountLot[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT account_head, account_head_code, account_type, frequency, COUNT(*) as count
     FROM accounts
     WHERE society_id = ? AND agent_id = ?
     GROUP BY account_head, account_head_code, account_type, frequency
     ORDER BY count DESC;`,
    societyId,
    agentId
  );
  return rows.map((row: any) => {
    const accountType = row.account_type as AccountType;
    const frequency = row.frequency as Frequency;
    const accountHeadCode = row.account_head_code ?? null;
    const accountHead = row.account_head ?? null;
    return {
      key: lotKeyFromParts(accountHeadCode, accountType, frequency),
      accountHead,
      accountHeadCode,
      accountType,
      frequency,
      count: row.count ?? 0,
    } as AccountLot;
  });
}

export async function getAccountCount(db: SQLiteDatabase, societyId: string, agentId: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM accounts WHERE society_id = ? AND agent_id = ?;`,
    societyId,
    agentId
  );
  return row?.count ?? 0;
}

export async function getAccountCountByLot(
  db: SQLiteDatabase,
  societyId: string,
  agentId: string,
  lot: ActiveLot
): Promise<number> {
  const headCode = normalizeLotCode(lot.accountHeadCode);
  if (headCode) {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM accounts
       WHERE society_id = ? AND agent_id = ? AND account_head_code = ?
         AND account_type = ? AND frequency = ?;`,
      societyId,
      agentId,
      headCode,
      lot.accountType,
      lot.frequency
    );
    return row?.count ?? 0;
  }
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM accounts
     WHERE society_id = ? AND agent_id = ? AND (account_head_code IS NULL OR account_head_code = '')
       AND account_type = ? AND frequency = ?;`,
    societyId,
    agentId,
    lot.accountType,
    lot.frequency
  );
  return row?.count ?? 0;
}

export async function upsertCollectionForToday(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
  account: Account;
  amountPaise: number;
  remarks?: string | null;
}): Promise<CollectionEntry> {
  const { db, societyId, agentId, account, amountPaise, remarks } = params;
  const collectedAt = nowISO();
  const collectionDate = toISODate(new Date());

  const existing = await db.getFirstAsync<any>(
    `SELECT * FROM collections
     WHERE society_id = ? AND agent_id = ? AND account_id = ? AND collection_date = ?;`,
    societyId,
    agentId,
    account.id,
    collectionDate
  );

  if (existing) {
    await db.runAsync(
      `UPDATE collections
       SET collected_paise = ?, collected_at = ?, remarks = ?
       WHERE id = ?;`,
      amountPaise,
      collectedAt,
      remarks ?? null,
      existing.id
    );
    const updated = await db.getFirstAsync<any>('SELECT * FROM collections WHERE id = ?;', existing.id);
    return mapCollection(updated);
  }

  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO collections (
        id, society_id, agent_id, account_id, account_no,
        collected_paise, collected_at, collection_date, status, exported_at, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, ?);`,
    id,
    societyId,
    agentId,
    account.id,
    account.accountNo,
    amountPaise,
    collectedAt,
    collectionDate,
    remarks ?? null
  );
  const row = await db.getFirstAsync<any>('SELECT * FROM collections WHERE id = ?;', id);
  return mapCollection(row);
}

export async function listCollectionsForDate(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
  collectionDate: string;
}): Promise<CollectionEntry[]> {
  const rows = await params.db.getAllAsync<any>(
    `SELECT * FROM collections
     WHERE society_id = ? AND agent_id = ? AND collection_date = ?
     ORDER BY collected_at DESC;`,
    params.societyId,
    params.agentId,
    params.collectionDate
  );
  return rows.map(mapCollection);
}

export async function listCollectionsForDateByLot(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
  collectionDate: string;
  lot: ActiveLot;
}): Promise<CollectionEntry[]> {
  const headCode = normalizeLotCode(params.lot.accountHeadCode);
  if (headCode) {
    const rows = await params.db.getAllAsync<any>(
      `SELECT c.*
       FROM collections c
       JOIN accounts a ON a.id = c.account_id
       WHERE c.society_id = ? AND c.agent_id = ? AND c.collection_date = ? AND a.account_head_code = ?
         AND a.account_type = ? AND a.frequency = ?
       ORDER BY c.collected_at DESC;`,
      params.societyId,
      params.agentId,
      params.collectionDate,
      headCode,
      params.lot.accountType,
      params.lot.frequency
    );
    return rows.map(mapCollection);
  }
  const rows = await params.db.getAllAsync<any>(
    `SELECT c.*
     FROM collections c
     JOIN accounts a ON a.id = c.account_id
     WHERE c.society_id = ? AND c.agent_id = ? AND c.collection_date = ?
       AND (a.account_head_code IS NULL OR a.account_head_code = '')
       AND a.account_type = ? AND a.frequency = ?
     ORDER BY c.collected_at DESC;`,
    params.societyId,
    params.agentId,
    params.collectionDate,
    params.lot.accountType,
    params.lot.frequency
  );
  return rows.map(mapCollection);
}

export async function listCollectionDates(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
}): Promise<string[]> {
  const rows = await params.db.getAllAsync<{ collection_date: string }>(
    `SELECT DISTINCT collection_date
     FROM collections
     WHERE society_id = ? AND agent_id = ?
     ORDER BY collection_date DESC;`,
    params.societyId,
    params.agentId
  );
  return rows.map((r) => r.collection_date);
}

export async function getCollectionForAccountDate(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
  accountId: string;
  collectionDate: string;
}): Promise<CollectionEntry | null> {
  const row = await params.db.getFirstAsync<any>(
    `SELECT * FROM collections
     WHERE society_id = ? AND agent_id = ? AND account_id = ? AND collection_date = ?;`,
    params.societyId,
    params.agentId,
    params.accountId,
    params.collectionDate
  );
  return row ? mapCollection(row) : null;
}

export async function getCollectionTotalsForDate(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
  collectionDate: string;
}): Promise<{ count: number; totalPaise: number }> {
  const row = await params.db.getFirstAsync<{ count: number; totalPaise: number }>(
    `SELECT COUNT(*) as count, COALESCE(SUM(collected_paise), 0) as totalPaise
     FROM collections
     WHERE society_id = ? AND agent_id = ? AND collection_date = ?;`,
    params.societyId,
    params.agentId,
    params.collectionDate
  );
  return { count: row?.count ?? 0, totalPaise: row?.totalPaise ?? 0 };
}

export async function getCollectionTotalsForDateByLot(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
  collectionDate: string;
  lot: ActiveLot;
}): Promise<{ count: number; totalPaise: number }> {
  const headCode = normalizeLotCode(params.lot.accountHeadCode);
  if (headCode) {
    const row = await params.db.getFirstAsync<{ count: number; totalPaise: number }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(c.collected_paise), 0) as totalPaise
       FROM collections c
       JOIN accounts a ON a.id = c.account_id
       WHERE c.society_id = ? AND c.agent_id = ? AND c.collection_date = ? AND a.account_head_code = ?
         AND a.account_type = ? AND a.frequency = ?;`,
      params.societyId,
      params.agentId,
      params.collectionDate,
      headCode,
      params.lot.accountType,
      params.lot.frequency
    );
    return { count: row?.count ?? 0, totalPaise: row?.totalPaise ?? 0 };
  }
  const row = await params.db.getFirstAsync<{ count: number; totalPaise: number }>(
    `SELECT COUNT(*) as count, COALESCE(SUM(c.collected_paise), 0) as totalPaise
     FROM collections c
     JOIN accounts a ON a.id = c.account_id
     WHERE c.society_id = ? AND c.agent_id = ? AND c.collection_date = ?
       AND (a.account_head_code IS NULL OR a.account_head_code = '')
       AND a.account_type = ? AND a.frequency = ?;`,
    params.societyId,
    params.agentId,
    params.collectionDate,
    params.lot.accountType,
    params.lot.frequency
  );
  return { count: row?.count ?? 0, totalPaise: row?.totalPaise ?? 0 };
}

export async function getPendingExportCounts(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
}): Promise<{ collections: number; daily: number; monthly: number; loan: number }> {
  const c = await params.db.getFirstAsync<{ count: number; daily: number; monthly: number; loan: number }>(
    `SELECT
       COUNT(*) as count,
       COALESCE(SUM(CASE WHEN a.account_type = 'LOAN' THEN 1 ELSE 0 END), 0) as loan,
       COALESCE(SUM(CASE WHEN a.account_type <> 'LOAN' AND a.frequency = 'DAILY' THEN 1 ELSE 0 END), 0) as daily,
       COALESCE(SUM(CASE WHEN a.account_type <> 'LOAN' AND a.frequency = 'MONTHLY' THEN 1 ELSE 0 END), 0) as monthly
     FROM collections c
     JOIN accounts a ON a.id = c.account_id
     WHERE c.society_id = ? AND c.agent_id = ? AND c.status = 'PENDING';`,
    params.societyId,
    params.agentId
  );
  return {
    collections: c?.count ?? 0,
    daily: c?.daily ?? 0,
    monthly: c?.monthly ?? 0,
    loan: c?.loan ?? 0,
  };
}

export async function listExportsForDate(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
  dateISO: string;
}): Promise<ExportRecord[]> {
  const rows = await params.db.getAllAsync<any>(
    `SELECT * FROM exports
     WHERE society_id = ?
       AND agent_id = ?
       AND substr(exported_at, 1, 10) = ?
     ORDER BY exported_at DESC;`,
    params.societyId,
    params.agentId,
    params.dateISO
  );
  return rows.map(mapExport);
}

export async function listPendingCollections(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
}): Promise<ExportCollectionRow[]> {
  const rows = await params.db.getAllAsync<any>(
    `SELECT c.*, a.client_name, a.account_head, a.account_head_code, a.account_type, a.frequency
     FROM collections c
     JOIN accounts a ON a.id = c.account_id
     WHERE c.society_id = ? AND c.agent_id = ? AND c.status = 'PENDING'
     ORDER BY c.collected_at ASC;`,
    params.societyId,
    params.agentId
  );
  return rows.map(mapExportCollection);
}

export async function markExported(params: {
  db: SQLiteDatabase;
  societyId: string;
  agentId: string;
  exportedAt: string;
  fileUri: string | null;
  collectionsIds: string[];
}): Promise<void> {
  await params.db.withTransactionAsync(async () => {
    for (const id of params.collectionsIds) {
      await params.db.runAsync(
        `UPDATE collections
         SET status = 'EXPORTED', exported_at = ?
         WHERE id = ? AND society_id = ? AND agent_id = ?;`,
        params.exportedAt,
        id,
        params.societyId,
        params.agentId
      );
    }
    await params.db.runAsync(
      `INSERT INTO exports (id, society_id, agent_id, exported_at, file_uri, collections_count)
       VALUES (?, ?, ?, ?, ?, ?);`,
      Crypto.randomUUID(),
      params.societyId,
      params.agentId,
      params.exportedAt,
      params.fileUri,
      params.collectionsIds.length
    );
  });
}

export async function clearAllData(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM collections;');
    await db.runAsync('DELETE FROM exports;');
    await db.runAsync('DELETE FROM accounts;');
    await db.runAsync('DELETE FROM agents;');
    await db.runAsync('DELETE FROM societies;');
    await db.runAsync('DELETE FROM app_meta;');
  });
}

export async function clearClientData(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM collections;');
    await db.runAsync('DELETE FROM accounts;');
  });
}

export async function clearClientDataByLots(
  db: SQLiteDatabase,
  societyId: string,
  agentId: string,
  lots: Array<{ accountHeadCode: string | null; accountType: AccountType; frequency: Frequency }>
): Promise<void> {
  if (lots.length === 0) return;
  const uniqueLots = new Map<string, { accountHeadCode: string | null; accountType: AccountType; frequency: Frequency }>();
  for (const lot of lots) {
    const code = normalizeLotCode(lot.accountHeadCode);
    const key = `${code ?? ''}|${lot.accountType}|${lot.frequency}`;
    if (!uniqueLots.has(key)) {
      uniqueLots.set(key, { ...lot, accountHeadCode: code });
    }
  }

  await db.withTransactionAsync(async () => {
    for (const lot of uniqueLots.values()) {
      const code = normalizeLotCode(lot.accountHeadCode);
      if (code) {
        await db.runAsync(
          `DELETE FROM collections
           WHERE society_id = ? AND agent_id = ?
             AND account_id IN (
             SELECT id FROM accounts
             WHERE society_id = ? AND agent_id = ? AND account_type = ? AND frequency = ? AND account_head_code = ?
           );`,
          societyId,
          agentId,
          societyId,
          agentId,
          lot.accountType,
          lot.frequency,
          code
        );
        await db.runAsync(
          `DELETE FROM accounts
           WHERE society_id = ? AND agent_id = ? AND account_type = ? AND frequency = ? AND account_head_code = ?;`,
          societyId,
          agentId,
          lot.accountType,
          lot.frequency,
          code
        );
      } else {
        await db.runAsync(
          `DELETE FROM collections
           WHERE society_id = ? AND agent_id = ?
             AND account_id IN (
             SELECT id FROM accounts
             WHERE society_id = ? AND agent_id = ? AND account_type = ? AND frequency = ?
               AND (account_head_code IS NULL OR account_head_code = '')
           );`,
          societyId,
          agentId,
          societyId,
          agentId,
          lot.accountType,
          lot.frequency
        );
        await db.runAsync(
          `DELETE FROM accounts
           WHERE society_id = ? AND agent_id = ? AND account_type = ? AND frequency = ?
             AND (account_head_code IS NULL OR account_head_code = '');`,
          societyId,
          agentId,
          lot.accountType,
          lot.frequency
        );
      }
    }
  });
}
