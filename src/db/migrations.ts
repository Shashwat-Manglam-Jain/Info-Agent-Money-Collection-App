export const DB_VERSION = 3;

export const PERFORMANCE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_accounts_society_agent_accountno ON accounts(society_id, agent_id, account_no);
CREATE INDEX IF NOT EXISTS idx_accounts_society_agent_clientname ON accounts(society_id, agent_id, client_name);
CREATE INDEX IF NOT EXISTS idx_accounts_society_agent_lot ON accounts(society_id, agent_id, account_lot_key);
CREATE INDEX IF NOT EXISTS idx_collections_agent_date ON collections(agent_id, collection_date);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_society_agent_date ON collections(society_id, agent_id, collection_date);
CREATE INDEX IF NOT EXISTS idx_collections_society_agent_status ON collections(society_id, agent_id, status);
CREATE INDEX IF NOT EXISTS idx_exports_agent_time ON exports(agent_id, exported_at);
CREATE INDEX IF NOT EXISTS idx_exports_society_agent_time ON exports(society_id, agent_id, exported_at);
`;

export const MIGRATION_001 = `
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS societies;
DROP TABLE IF EXISTS exports;
DROP TABLE IF EXISTS account_open_requests;
DROP TABLE IF EXISTS app_meta;

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS societies (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY NOT NULL,
  society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  pin_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (society_id, code)
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  account_no TEXT NOT NULL,
  account_lot_key TEXT NOT NULL,
  client_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  account_head TEXT,
  account_head_code TEXT,
  installment_paise INTEGER NOT NULL DEFAULT 0,
  balance_paise INTEGER NOT NULL DEFAULT 0,
  last_txn_at TEXT,
  opened_at TEXT,
  closes_at TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  UNIQUE (society_id, agent_id, account_no, account_lot_key)
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY NOT NULL,
  society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  account_no TEXT NOT NULL,
  collected_paise INTEGER NOT NULL,
  collected_at TEXT NOT NULL,
  collection_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  exported_at TEXT,
  remarks TEXT,
  latitude REAL,
  longitude REAL,
  UNIQUE (agent_id, account_id, collection_date)
);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY NOT NULL,
  society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  exported_at TEXT NOT NULL,
  file_uri TEXT,
  collections_count INTEGER NOT NULL
);
${PERFORMANCE_INDEXES_SQL}

PRAGMA foreign_keys = ON;
`;
