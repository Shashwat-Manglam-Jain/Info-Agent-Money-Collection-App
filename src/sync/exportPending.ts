import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as XLSX from 'xlsx';

import type { AccountType, ExportCollectionRow, Frequency, Agent, Society } from '../models/types';
import { nowISO } from '../utils/dates';
import { paiseToRupees } from '../utils/money';
import { listPendingCollections, markExported } from '../db/repo';
import { lotKeyFromParts } from '../utils/lots';

export type ExportFormat = 'xlsx' | 'txt';

export type ExportFileResult = {
  fileUri: string;
  collections: number;
  lotCode: string;
  lotName: string;
  lot: {
    accountHeadCode: string | null;
    accountType: AccountType;
    frequency: Frequency;
  };
  lotKey: string;
};

function compactNowForFilename(iso: string): string {
  // 2026-02-08T18:51:12.345Z -> 20260208_185112Z
  const safe = iso.replace(/[:.]/g, '').replace('T', '_');
  return safe.slice(0, 15) + 'Z';
}

function sanitizeSegment(value: string): string {
  const cleaned = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return cleaned || 'LOT';
}

function lotInfoFromCollection(c: ExportCollectionRow): {
  lotCode: string;
  lotName: string;
  lotFileCode: string;
  accountHeadCode: string | null;
  accountType: AccountType;
  frequency: Frequency;
} {
  const lotCode = c.accountHeadCode ?? c.accountType;
  const lotName = c.accountHead ?? c.accountType;
  const lotFileCode = c.accountHeadCode
    ? `${c.accountHeadCode}_${c.accountType}_${c.frequency}`
    : `${c.accountType}_${c.frequency}`;
  return {
    lotCode,
    lotName,
    lotFileCode,
    accountHeadCode: c.accountHeadCode ?? null,
    accountType: c.accountType,
    frequency: c.frequency,
  };
}

function buildHeaderRows(params: { society: Society; agent: Agent; exportedAt: string; lotLabel: string }): string[][] {
  return [
    [`Society: ${params.society.name}`],
    [`Agent: ${params.agent.code} - ${params.agent.name}`],
    [`Exported At: ${params.exportedAt}`],
    [`Lot: ${params.lotLabel}`],
    [],
  ];
}

function buildDataRows(collections: ExportCollectionRow[]): Array<Array<string | number>> {
  const rows: Array<Array<string | number>> = [];
  rows.push([
    'Account No',
    'Client Name',
    'Account Head',
    'Head Code',
    'Account Type',
    'Frequency',
    'Collected Amount',
    'Collected At',
    'Collection Date',
    'Remarks',
  ]);
  for (const c of collections) {
    rows.push([
      c.accountNo,
      c.clientName,
      c.accountHead ?? '',
      c.accountHeadCode ?? '',
      c.accountType,
      c.frequency,
      paiseToRupees(c.collectedPaise),
      c.collectedAt,
      c.collectionDate,
      c.remarks ?? '',
    ]);
  }
  return rows;
}

function buildTxtContent(params: {
  society: Society;
  agent: Agent;
  exportedAt: string;
  lotLabel: string;
  collections: ExportCollectionRow[];
}): string {
  const header = buildHeaderRows({
    society: params.society,
    agent: params.agent,
    exportedAt: params.exportedAt,
    lotLabel: params.lotLabel,
  })
    .map((row) => row[0] ?? '')
    .join('\n');
  const dataRows = buildDataRows(params.collections);
  const lines = dataRows.map((row) => row.map((cell) => String(cell)).join('\t'));
  return [header, ...lines].join('\n');
}

function buildExcelBase64(params: {
  society: Society;
  agent: Agent;
  exportedAt: string;
  lotLabel: string;
  collections: ExportCollectionRow[];
}): string {
  const rows = [
    ...buildHeaderRows({
      society: params.society,
      agent: params.agent,
      exportedAt: params.exportedAt,
      lotLabel: params.lotLabel,
    }),
    ...buildDataRows(params.collections),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Collections');
  return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
}

export async function exportPendingAndShare(params: {
  db: SQLiteDatabase;
  society: Society;
  agent: Agent;
  format?: ExportFormat;
}): Promise<{ files: ExportFileResult[]; shared: boolean } | null> {
  const exportedAt = nowISO();
  const collections = await listPendingCollections({ db: params.db, agentId: params.agent.id });

  if (collections.length === 0) return null;

  const format: ExportFormat = params.format ?? 'xlsx';
  const exportDir = new Directory(Paths.document, 'exports');
  exportDir.create({ intermediates: true, idempotent: true });

  const groups = new Map<
    string,
    {
      lotCode: string;
      lotName: string;
      lotFileCode: string;
      accountHeadCode: string | null;
      accountType: AccountType;
      frequency: Frequency;
      items: ExportCollectionRow[];
    }
  >();
  for (const c of collections) {
    const { lotCode, lotName, lotFileCode, accountHeadCode, accountType, frequency } = lotInfoFromCollection(c);
    const key = sanitizeSegment(lotFileCode);
    if (!groups.has(key)) {
      groups.set(key, { lotCode, lotName, lotFileCode, accountHeadCode, accountType, frequency, items: [] });
    }
    groups.get(key)?.items.push(c);
  }

  const results: ExportFileResult[] = [];

  for (const group of groups.values()) {
    const lotLabel = group.lotCode ? `${group.lotName} (${group.lotCode})` : group.lotName;
    const lotFileCode = sanitizeSegment(group.lotFileCode);
    const stamp = compactNowForFilename(exportedAt);
    const ext = format === 'txt' ? 'txt' : 'xlsx';
    const fileName = `IAMC_${params.society.code}_${params.agent.code}_${lotFileCode}_${stamp}.${ext}`;
    const file = new File(exportDir, fileName);
    file.create({ intermediates: true, overwrite: true });

    if (format === 'txt') {
      const content = buildTxtContent({
        society: params.society,
        agent: params.agent,
        exportedAt,
        lotLabel,
        collections: group.items,
      });
      file.write(content, { encoding: 'utf8' });
    } else {
      const base64 = buildExcelBase64({
        society: params.society,
        agent: params.agent,
        exportedAt,
        lotLabel,
        collections: group.items,
      });
      file.write(base64, { encoding: 'base64' });
    }

    await markExported({
      db: params.db,
      agentId: params.agent.id,
      exportedAt,
      fileUri: file.uri,
      collectionsIds: group.items.map((c) => c.id),
    });

    const lotKey = lotKeyFromParts(group.accountHeadCode, group.accountType, group.frequency);
    results.push({
      fileUri: file.uri,
      collections: group.items.length,
      lotCode: group.lotCode,
      lotName: group.lotName,
      lot: {
        accountHeadCode: group.accountHeadCode,
        accountType: group.accountType,
        frequency: group.frequency,
      },
      lotKey,
    });
  }

  let shared = false;
  if (results.length === 1 && (await Sharing.isAvailableAsync())) {
    const fileUri = results[0].fileUri;
    await Sharing.shareAsync(fileUri, {
      dialogTitle: 'Export pending collections',
      mimeType: format === 'txt' ? 'text/plain' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    shared = true;
  }

  return { files: results, shared };
}
