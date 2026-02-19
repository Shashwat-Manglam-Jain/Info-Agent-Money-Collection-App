import { describe, expect, it, vi } from "vitest";

vi.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA256" },
  digestStringAsync: async (_algo: string, input: string) => `hash:${input}`,
  randomUUID: (() => {
    let id = 0;
    return () => `uuid-${++id}`;
  })(),
}));

import {
  getImportIdentityLock,
  hasImportedFileHash,
  markImportedFileHash,
  saveImportIdentityLock,
} from "../src/db/repo";

type MetaRow = { key: string; value: string };

function createMetaDb(initial: MetaRow[] = []) {
  const appMeta = new Map(initial.map((row) => [row.key, row.value]));

  const db = {
    getAllAsync: async (_sql: string, ...params: unknown[]) => {
      const keys = params as string[];
      return keys
        .filter((key) => appMeta.has(key))
        .map((key) => ({ key, value: appMeta.get(key) as string }));
    },
    getFirstAsync: async (_sql: string, ...params: unknown[]) => {
      const [key] = params as [string];
      const value = appMeta.get(key);
      if (!value) return null;
      return { value };
    },
    runAsync: async (_sql: string, ...params: unknown[]) => {
      const [key, value] = params as [string, string];
      appMeta.set(key, value);
      return {};
    },
    withTransactionAsync: async (fn: () => Promise<void>) => {
      await fn();
    },
  };

  return { db: db as any, appMeta };
}

describe("import identity and file-hash repo helpers", () => {
  it("returns null when import identity lock is not saved", async () => {
    const { db } = createMetaDb();
    const lock = await getImportIdentityLock(db);
    expect(lock).toBeNull();
  });

  it("saves and loads normalized import identity lock", async () => {
    const { db } = createMetaDb();

    await saveImportIdentityLock(db, {
      societyCode: " soc001 ",
      agentCode: " ag01 ",
    });

    const lock = await getImportIdentityLock(db);
    expect(lock).toEqual({ societyCode: "SOC001", agentCode: "AG01" });
  });

  it("returns null when only one lock field exists", async () => {
    const { db } = createMetaDb([
      { key: "import.lock.society_code", value: "SOC001" },
    ]);

    const lock = await getImportIdentityLock(db);
    expect(lock).toBeNull();
  });

  it("marks and detects imported file hash for normalized identity", async () => {
    const { db } = createMetaDb();

    await markImportedFileHash(db, {
      societyCode: "soc001",
      agentCode: "ag01",
      fileHash: "abc123",
    });

    const exists = await hasImportedFileHash(db, {
      societyCode: " SOC001 ",
      agentCode: " AG01 ",
      fileHash: "abc123",
    });

    expect(exists).toBe(true);
  });

  it("does not mark or detect blank file hash", async () => {
    const { db, appMeta } = createMetaDb();
    const beforeSize = appMeta.size;

    await markImportedFileHash(db, {
      societyCode: "SOC001",
      agentCode: "AG01",
      fileHash: "   ",
    });

    const exists = await hasImportedFileHash(db, {
      societyCode: "SOC001",
      agentCode: "AG01",
      fileHash: "   ",
    });

    expect(appMeta.size).toBe(beforeSize);
    expect(exists).toBe(false);
  });
});
