import * as Crypto from 'expo-crypto';

import type { SQLiteDatabase } from 'expo-sqlite';

import type { Account, AccountStatus, AccountType, Agent, CollectionEntry, CollectionStatus, Frequency, Society } from '../models/types';
import { nowISO, toISODate } from '../utils/dates';

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
    accountNo: row.account_no,
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

export async function getAgentById(db: SQLiteDatabase, agentId: string): Promise<Agent | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM agents WHERE id = ?;', agentId);
  return row ? mapAgent(row) : null;
}

export async function getAccountById(db: SQLiteDatabase, accountId: string): Promise<Account | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM accounts WHERE id = ?;', accountId);
  return row ? mapAccount(row) : null;
}

export async function searchAccountsByLastDigits(
  db: SQLiteDatabase,
  societyId: string,
  digits: string
): Promise<Account[]> {
  const q = digits.trim();
  if (!q) return [];

  const rows = await db.getAllAsync<any>(
    `SELECT * FROM accounts
     WHERE society_id = ?
       AND status = 'ACTIVE'
       AND account_no LIKE '%' || ?
     ORDER BY account_no ASC
     LIMIT 50;`,
    societyId,
    q
  );
  return rows.map(mapAccount);
}

export async function listAccounts(
  db: SQLiteDatabase,
  societyId: string,
  limit: number = 2000
): Promise<Account[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM accounts
     WHERE society_id = ?
     ORDER BY client_name ASC
     LIMIT ?;`,
    societyId,
    limit
  );
  return rows.map(mapAccount);
}

export async function getAccountCount(db: SQLiteDatabase, societyId: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM accounts WHERE society_id = ?;`,
    societyId
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
     WHERE agent_id = ? AND account_id = ? AND collection_date = ?;`,
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
  agentId: string;
  collectionDate: string;
}): Promise<CollectionEntry[]> {
  const rows = await params.db.getAllAsync<any>(
    `SELECT * FROM collections
     WHERE agent_id = ? AND collection_date = ?
     ORDER BY collected_at DESC;`,
    params.agentId,
    params.collectionDate
  );
  return rows.map(mapCollection);
}

export async function getCollectionForAccountDate(params: {
  db: SQLiteDatabase;
  agentId: string;
  accountId: string;
  collectionDate: string;
}): Promise<CollectionEntry | null> {
  const row = await params.db.getFirstAsync<any>(
    `SELECT * FROM collections
     WHERE agent_id = ? AND account_id = ? AND collection_date = ?;`,
    params.agentId,
    params.accountId,
    params.collectionDate
  );
  return row ? mapCollection(row) : null;
}

export async function getCollectionTotalsForDate(params: {
  db: SQLiteDatabase;
  agentId: string;
  collectionDate: string;
}): Promise<{ count: number; totalPaise: number }> {
  const row = await params.db.getFirstAsync<{ count: number; totalPaise: number }>(
    `SELECT COUNT(*) as count, COALESCE(SUM(collected_paise), 0) as totalPaise
     FROM collections
     WHERE agent_id = ? AND collection_date = ?;`,
    params.agentId,
    params.collectionDate
  );
  return { count: row?.count ?? 0, totalPaise: row?.totalPaise ?? 0 };
}

export async function getPendingExportCounts(params: {
  db: SQLiteDatabase;
  agentId: string;
}): Promise<{ collections: number }> {
  const c = await params.db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM collections WHERE agent_id = ? AND status = 'PENDING';`,
    params.agentId
  );
  return { collections: c?.count ?? 0 };
}

export async function listPendingCollections(params: {
  db: SQLiteDatabase;
  agentId: string;
}): Promise<CollectionEntry[]> {
  const rows = await params.db.getAllAsync<any>(
    `SELECT * FROM collections
     WHERE agent_id = ? AND status = 'PENDING'
     ORDER BY collected_at ASC;`,
    params.agentId
  );
  return rows.map(mapCollection);
}

export async function markExported(params: {
  db: SQLiteDatabase;
  agentId: string;
  exportedAt: string;
  fileUri: string | null;
  collectionsIds: string[];
}): Promise<void> {
  await params.db.withTransactionAsync(async () => {
    for (const id of params.collectionsIds) {
      await params.db.runAsync(
        `UPDATE collections SET status = 'EXPORTED', exported_at = ? WHERE id = ?;`,
        params.exportedAt,
        id
      );
    }
    await params.db.runAsync(
      `INSERT INTO exports (id, society_id, agent_id, exported_at, file_uri, collections_count)
       VALUES (?, (SELECT society_id FROM agents WHERE id = ?), ?, ?, ?, ?);`,
      Crypto.randomUUID(),
      params.agentId,
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
