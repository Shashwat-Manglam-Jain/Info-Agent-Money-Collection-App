import type { ExportCollectionRow } from '../models/types';
import { lotKeyFromParts } from '../utils/lots';

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function lotLabel(row: ExportCollectionRow): string {
  return row.accountHeadCode
    ? `${row.accountHeadCode}_${row.accountType}_${row.frequency}`
    : `${row.accountType}_${row.frequency}`;
}

export function validatePendingCollectionsForExport(collections: ExportCollectionRow[]): void {
  if (collections.length === 0) return;

  const byAccountNo = new Map<
    string,
    Array<{ lotKey: string; lotLabel: string; clientName: string; normalizedClient: string }>
  >();
  const sameLotClientMap = new Map<string, string>();

  for (const row of collections) {
    const key = lotKeyFromParts(row.accountHeadCode, row.accountType, row.frequency);
    const label = lotLabel(row);
    const normalizedClient = normalizeText(row.clientName);
    const sameLotKey = `${key}|${row.accountNo}`;

    const existingSameLotClient = sameLotClientMap.get(sameLotKey);
    if (existingSameLotClient && existingSameLotClient !== normalizedClient) {
      throw new Error(
        `Export blocked: Account ${row.accountNo} in lot ${label} has multiple client names. Please re-import this lot and try again.`
      );
    }
    sameLotClientMap.set(sameLotKey, normalizedClient);

    const list = byAccountNo.get(row.accountNo) ?? [];
    list.push({
      lotKey: key,
      lotLabel: label,
      clientName: row.clientName.trim(),
      normalizedClient,
    });
    byAccountNo.set(row.accountNo, list);
  }

  const crossLotConflicts: string[] = [];
  for (const [accountNo, entries] of byAccountNo.entries()) {
    const distinctLots = new Set(entries.map((e) => e.lotKey));
    if (distinctLots.size <= 1) continue;

    const distinctClients = new Set(entries.map((e) => e.normalizedClient));
    if (distinctClients.size <= 1) continue;

    const firstByLot = new Map<string, { lotLabel: string; clientName: string }>();
    for (const entry of entries) {
      if (!firstByLot.has(entry.lotKey)) {
        firstByLot.set(entry.lotKey, { lotLabel: entry.lotLabel, clientName: entry.clientName });
      }
    }
    const summary = Array.from(firstByLot.values())
      .slice(0, 3)
      .map((item) => `${item.lotLabel}: ${item.clientName}`)
      .join(' | ');
    crossLotConflicts.push(`${accountNo} -> ${summary}`);
  }

  if (crossLotConflicts.length > 0) {
    const preview = crossLotConflicts.slice(0, 3).join('\n');
    const more = crossLotConflicts.length > 3 ? `\n+${crossLotConflicts.length - 3} more conflict(s)` : '';
    throw new Error(
      `Export blocked: same account number is linked to different clients across account types.\n${preview}${more}`
    );
  }
}
