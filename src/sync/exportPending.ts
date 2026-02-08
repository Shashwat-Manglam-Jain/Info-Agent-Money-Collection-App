import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { AccountOpenRequest, Agent, CollectionEntry, Society } from '../models/types';
import { nowISO } from '../utils/dates';
import { listPendingCollections, listPendingOpenRequests, markExported } from '../db/repo';

export type ExportPayloadV1 = {
  schemaVersion: 1;
  exportedAt: string;
  society: Pick<Society, 'id' | 'code' | 'name'>;
  agent: Pick<Agent, 'id' | 'code' | 'name'>;
  collections: Array<
    Pick<
      CollectionEntry,
      'id' | 'accountId' | 'accountNo' | 'collectedAt' | 'collectionDate' | 'collectedPaise' | 'remarks'
    >
  >;
  accountOpenRequests: Array<
    Pick<
      AccountOpenRequest,
      | 'id'
      | 'clientName'
      | 'phone'
      | 'address'
      | 'accountType'
      | 'frequency'
      | 'installmentPaise'
      | 'requestedAt'
      | 'notes'
    >
  >;
};

function compactNowForFilename(iso: string): string {
  // 2026-02-08T18:51:12.345Z -> 20260208_185112Z
  const safe = iso.replace(/[:.]/g, '').replace('T', '_');
  return safe.slice(0, 15) + 'Z';
}

export async function exportPendingAndShare(params: {
  db: SQLiteDatabase;
  society: Society;
  agent: Agent;
}): Promise<{ fileUri: string; collections: number; openRequests: number } | null> {
  const exportedAt = nowISO();
  const [collections, openRequests] = await Promise.all([
    listPendingCollections({ db: params.db, agentId: params.agent.id }),
    listPendingOpenRequests({ db: params.db, agentId: params.agent.id }),
  ]);

  if (collections.length === 0 && openRequests.length === 0) return null;

  const payload: ExportPayloadV1 = {
    schemaVersion: 1,
    exportedAt,
    society: { id: params.society.id, code: params.society.code, name: params.society.name },
    agent: { id: params.agent.id, code: params.agent.code, name: params.agent.name },
    collections: collections.map((c) => ({
      id: c.id,
      accountId: c.accountId,
      accountNo: c.accountNo,
      collectedAt: c.collectedAt,
      collectionDate: c.collectionDate,
      collectedPaise: c.collectedPaise,
      remarks: c.remarks,
    })),
    accountOpenRequests: openRequests.map((r) => ({
      id: r.id,
      clientName: r.clientName,
      phone: r.phone,
      address: r.address,
      accountType: r.accountType,
      frequency: r.frequency,
      installmentPaise: r.installmentPaise,
      requestedAt: r.requestedAt,
      notes: r.notes,
    })),
  };

  const fileName = `IAMC_${params.society.code}_${params.agent.code}_${compactNowForFilename(exportedAt)}.json`;
  const exportDir = new Directory(Paths.document, 'exports');
  exportDir.create({ intermediates: true, idempotent: true });
  const file = new File(exportDir, fileName);
  file.create({ intermediates: true, overwrite: true });
  file.write(JSON.stringify(payload, null, 2), { encoding: 'utf8' });
  const fileUri = file.uri;

  await markExported({
    db: params.db,
    agentId: params.agent.id,
    exportedAt,
    fileUri,
    collectionsIds: collections.map((c) => c.id),
    openRequestIds: openRequests.map((r) => r.id),
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      dialogTitle: 'Export pending collections',
      mimeType: 'application/json',
    });
  }

  return { fileUri, collections: collections.length, openRequests: openRequests.length };
}
