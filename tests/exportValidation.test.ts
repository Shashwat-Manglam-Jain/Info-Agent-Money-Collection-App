import { describe, expect, it } from 'vitest';

import type { ExportCollectionRow } from '../src/models/types';
import { validatePendingCollectionsForExport } from '../src/sync/exportValidation';

function row(overrides: Partial<ExportCollectionRow>): ExportCollectionRow {
  return {
    id: overrides.id ?? 'col-1',
    societyId: overrides.societyId ?? 'soc-1',
    agentId: overrides.agentId ?? 'agent-1',
    accountId: overrides.accountId ?? 'acc-1',
    accountNo: overrides.accountNo ?? '00700001',
    collectedPaise: overrides.collectedPaise ?? 10000,
    collectedAt: overrides.collectedAt ?? '2026-02-12T10:00:00Z',
    collectionDate: overrides.collectionDate ?? '2026-02-12',
    status: overrides.status ?? 'PENDING',
    exportedAt: overrides.exportedAt ?? null,
    remarks: overrides.remarks ?? null,
    clientName: overrides.clientName ?? 'CLIENT ONE',
    accountHead: overrides.accountHead ?? 'DAILY PIGMY ACCOUNT',
    accountHeadCode: overrides.accountHeadCode ?? '007',
    accountType: overrides.accountType ?? 'PIGMY',
    frequency: overrides.frequency ?? 'DAILY',
  };
}

describe('validatePendingCollectionsForExport', () => {
  it('passes when account-type client mapping is consistent', () => {
    const rows: ExportCollectionRow[] = [
      row({ id: 'c1', accountNo: '00700001', clientName: 'CLIENT ONE', accountHeadCode: '007', accountType: 'PIGMY' }),
      row({ id: 'c2', accountNo: '00700002', clientName: 'CLIENT TWO', accountHeadCode: '007', accountType: 'PIGMY' }),
      row({
        id: 'c3',
        accountNo: '02100001',
        clientName: 'CLIENT LOAN',
        accountHeadCode: '021',
        accountType: 'LOAN',
        frequency: 'MONTHLY',
      }),
    ];

    expect(() => validatePendingCollectionsForExport(rows)).not.toThrow();
  });

  it('fails when same account number maps to different clients across account types', () => {
    const rows: ExportCollectionRow[] = [
      row({ id: 'c1', accountNo: '00700001', clientName: 'CLIENT ONE', accountHeadCode: '007', accountType: 'PIGMY' }),
      row({
        id: 'c2',
        accountNo: '00700001',
        clientName: 'CLIENT OTHER',
        accountHeadCode: '021',
        accountType: 'LOAN',
        frequency: 'MONTHLY',
      }),
    ];

    expect(() => validatePendingCollectionsForExport(rows)).toThrow(
      'same account number is linked to different clients across account types'
    );
  });

  it('fails when same account number in same lot has multiple client names', () => {
    const rows: ExportCollectionRow[] = [
      row({ id: 'c1', accountNo: '00700001', clientName: 'CLIENT ONE', accountHeadCode: '007', accountType: 'PIGMY' }),
      row({
        id: 'c2',
        accountNo: '00700001',
        clientName: 'CLIENT RENAMED',
        accountHeadCode: '007',
        accountType: 'PIGMY',
      }),
    ];

    expect(() => validatePendingCollectionsForExport(rows)).toThrow('has multiple client names');
  });
});
