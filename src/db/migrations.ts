export const DB_VERSION = 1;

export const MIGRATION_001 = `
PRAGMA foreign_keys = ON;

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
  account_no TEXT NOT NULL,
  client_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  installment_paise INTEGER NOT NULL DEFAULT 0,
  balance_paise INTEGER NOT NULL DEFAULT 0,
  last_txn_at TEXT,
  opened_at TEXT,
  closes_at TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  UNIQUE (society_id, account_no)
);
CREATE INDEX IF NOT EXISTS idx_accounts_society_accountno ON accounts(society_id, account_no);
CREATE INDEX IF NOT EXISTS idx_accounts_society_clientname ON accounts(society_id, client_name);

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
CREATE INDEX IF NOT EXISTS idx_collections_agent_date ON collections(agent_id, collection_date);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);

CREATE TABLE IF NOT EXISTS account_open_requests (
  id TEXT PRIMARY KEY NOT NULL,
  society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  account_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  installment_paise INTEGER NOT NULL DEFAULT 0,
  requested_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_openreq_agent_status ON account_open_requests(agent_id, status);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY NOT NULL,
  society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  exported_at TEXT NOT NULL,
  file_uri TEXT,
  collections_count INTEGER NOT NULL,
  open_requests_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_exports_agent_time ON exports(agent_id, exported_at);
`;

