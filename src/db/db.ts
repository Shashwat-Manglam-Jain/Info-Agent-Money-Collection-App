import * as SQLite from 'expo-sqlite';

import { DB_VERSION, MIGRATION_001, PERFORMANCE_INDEXES_SQL } from './migrations';

const DB_NAME = 'info-agent-money-collection.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

async function getUserVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  return row?.user_version ?? 0;
}

async function ensurePerformanceIndexes(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(PERFORMANCE_INDEXES_SQL);
}

export async function initDb(): Promise<void> {
  const db = await getDb();

  const version = await getUserVersion(db);
  if (version >= DB_VERSION) {
    await ensurePerformanceIndexes(db);
    return;
  }

  await db.withTransactionAsync(async () => {
    if (version < DB_VERSION) {
      await db.execAsync(MIGRATION_001);
    }
    await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
  });
  await ensurePerformanceIndexes(db);
}
