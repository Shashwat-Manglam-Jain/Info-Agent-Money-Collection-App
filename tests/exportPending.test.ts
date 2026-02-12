import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { ExportCollectionRow } from '../src/models/types';

const mockState = vi.hoisted(() => ({
  pendingCollections: [] as ExportCollectionRow[],
  markCalls: [] as Array<any>,
  writes: [] as Array<{ uri: string; content: string; encoding: string | undefined }>,
  shareCalls: [] as Array<{ uri: string; options: any }>,
  sharingAvailable: true,
}));

vi.mock('../src/db/repo', () => ({
  listPendingCollections: async () => mockState.pendingCollections,
  markExported: async (params: any) => {
    mockState.markCalls.push(params);
  },
}));

vi.mock('../src/utils/dates', () => ({
  nowISO: () => '2026-02-12T10:11:12.345Z',
}));

vi.mock('expo-file-system', () => {
  class Directory {
    uri: string;
    constructor(_base: string, name: string) {
      this.uri = `file:///document/${name}`;
    }
    create() {}
    list() {
      return [];
    }
  }

  class File {
    uri: string;
    constructor(dir: { uri: string }, name: string) {
      this.uri = `${dir.uri}/${name}`;
    }
    create() {}
    write(content: string, opts?: { encoding?: string }) {
      mockState.writes.push({ uri: this.uri, content, encoding: opts?.encoding });
    }
  }

  return {
    Directory,
    File,
    Paths: { document: 'file:///document' },
  };
});

vi.mock('expo-sharing', () => ({
  isAvailableAsync: async () => mockState.sharingAvailable,
  shareAsync: async (uri: string, options: any) => {
    mockState.shareCalls.push({ uri, options });
  },
}));

vi.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: (rows: any) => rows,
    book_new: () => ({}),
    book_append_sheet: () => undefined,
  },
  write: () => 'BASE64_EXPORT',
}));

import { exportPendingAndShare } from '../src/sync/exportPending';

function collectionRow(overrides: Partial<ExportCollectionRow>): ExportCollectionRow {
  return {
    id: overrides.id ?? 'c-1',
    societyId: overrides.societyId ?? 'soc-1',
    agentId: overrides.agentId ?? 'agent-1',
    accountId: overrides.accountId ?? 'acc-1',
    accountNo: overrides.accountNo ?? '00700001',
    collectedPaise: overrides.collectedPaise ?? 10000,
    collectedAt: overrides.collectedAt ?? '2026-02-12T09:00:00.000Z',
    collectionDate: overrides.collectionDate ?? '2026-02-12',
    status: overrides.status ?? 'PENDING',
    exportedAt: overrides.exportedAt ?? null,
    remarks: overrides.remarks ?? null,
    clientName: overrides.clientName ?? 'CLIENT',
    accountHead: overrides.accountHead ?? 'DAILY PIGMY ACCOUNT',
    accountHeadCode: overrides.accountHeadCode ?? '007',
    accountType: overrides.accountType ?? 'PIGMY',
    frequency: overrides.frequency ?? 'DAILY',
  };
}

describe('exportPendingAndShare', () => {
  const db = {} as any;
  const society = { id: 'soc-1', code: 'SOC001', name: 'Society One' } as const;
  const agent = { id: 'agent-1', societyId: 'soc-1', code: '001', name: 'Agent One', phone: null, isActive: true } as const;

  beforeEach(() => {
    mockState.pendingCollections = [];
    mockState.markCalls.length = 0;
    mockState.writes.length = 0;
    mockState.shareCalls.length = 0;
    mockState.sharingAvailable = true;
  });

  it('returns null when there are no pending collections', async () => {
    const result = await exportPendingAndShare({ db, society: society as any, agent: agent as any, format: 'txt' });
    expect(result).toBeNull();
    expect(mockState.markCalls).toHaveLength(0);
    expect(mockState.writes).toHaveLength(0);
  });

  it('exports separate files per lot and marks each lot as exported with society+agent scope', async () => {
    mockState.pendingCollections = [
      collectionRow({
        id: 'c-1',
        accountNo: '00700001',
        clientName: 'PIGMY CLIENT',
        accountHead: 'DAILY PIGMY ACCOUNT',
        accountHeadCode: '007',
        accountType: 'PIGMY',
        frequency: 'DAILY',
      }),
      collectionRow({
        id: 'c-2',
        accountNo: '02100001',
        clientName: 'LOAN CLIENT',
        accountHead: 'LOAN ACCOUNT',
        accountHeadCode: '021',
        accountType: 'LOAN',
        frequency: 'MONTHLY',
      }),
    ];

    const result = await exportPendingAndShare({ db, society: society as any, agent: agent as any, format: 'txt' });

    expect(result).not.toBeNull();
    expect(result?.files).toHaveLength(2);
    expect(result?.shared).toBe(false);

    expect(mockState.writes).toHaveLength(2);
    expect(mockState.writes[0].uri).toContain('IAMC_SOC001_001_007_PIGMY_DAILY_20260212_101112Z.txt');
    expect(mockState.writes[1].uri).toContain('IAMC_SOC001_001_021_LOAN_MONTHLY_20260212_101112Z.txt');

    expect(mockState.markCalls).toHaveLength(2);
    for (const call of mockState.markCalls) {
      expect(call.societyId).toBe('soc-1');
      expect(call.agentId).toBe('agent-1');
      expect(call.exportedAt).toBe('2026-02-12T10:11:12.345Z');
      expect(Array.isArray(call.collectionsIds)).toBe(true);
      expect(call.collectionsIds.length).toBe(1);
    }
  });

  it('shares file automatically when only one lot is exported and sharing is available', async () => {
    mockState.pendingCollections = [
      collectionRow({
        id: 'c-1',
        accountNo: '00700001',
        clientName: 'PIGMY CLIENT',
        accountHeadCode: '007',
        accountType: 'PIGMY',
        frequency: 'DAILY',
      }),
    ];

    const result = await exportPendingAndShare({ db, society: society as any, agent: agent as any, format: 'txt' });

    expect(result).not.toBeNull();
    expect(result?.files).toHaveLength(1);
    expect(result?.shared).toBe(true);
    expect(mockState.shareCalls).toHaveLength(1);
    expect(mockState.shareCalls[0].uri).toContain('IAMC_SOC001_001_007_PIGMY_DAILY_20260212_101112Z.txt');
  });
});
