import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { rupeesToPaise } from '../utils/money';
import { nowISO } from '../utils/dates';

function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

export async function seedDemoData(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM societies;');
  if ((row?.count ?? 0) > 0) return;

  const societyId = Crypto.randomUUID();
  const agentId = Crypto.randomUUID();
  const pin = '1234';
  const pinHash = await sha256(`${societyId}:${pin}`);
  const now = nowISO();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO societies (id, code, name) VALUES (?, ?, ?);',
      societyId,
      'DEMO',
      'Demo Credit Cooperative Society'
    );

    await db.runAsync(
      'INSERT INTO agents (id, society_id, code, name, phone, pin_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, 1);',
      agentId,
      societyId,
      'AG001',
      'Demo Agent',
      '9999999999',
      pinHash
    );

    const sampleAccounts = [
      {
        accountNo: 'D-00001234',
        clientName: 'Asha Patil',
        accountType: 'PIGMY',
        frequency: 'DAILY',
        installmentRupees: 50,
        balanceRupees: 1250,
        lastTxnAt: now,
      },
      {
        accountNo: 'D-00005678',
        clientName: 'Ramesh Kulkarni',
        accountType: 'PIGMY',
        frequency: 'DAILY',
        installmentRupees: 100,
        balanceRupees: 9800,
        lastTxnAt: now,
      },
      {
        accountNo: 'W-00008901',
        clientName: 'Sonal Deshmukh',
        accountType: 'PIGMY',
        frequency: 'WEEKLY',
        installmentRupees: 500,
        balanceRupees: 15000,
        lastTxnAt: now,
      },
      {
        accountNo: 'M-00004567',
        clientName: 'Imran Shaikh',
        accountType: 'SAVINGS',
        frequency: 'MONTHLY',
        installmentRupees: 1000,
        balanceRupees: 42000,
        lastTxnAt: now,
      },
      {
        accountNo: 'L-00002345',
        clientName: 'Meera Joshi',
        accountType: 'LOAN',
        frequency: 'MONTHLY',
        installmentRupees: 2500,
        balanceRupees: 75000,
        lastTxnAt: now,
      },
    ] as const;

    for (const a of sampleAccounts) {
      await db.runAsync(
        `INSERT INTO accounts (
            id, society_id, account_no, client_name, account_type, frequency,
            installment_paise, balance_paise, last_txn_at, opened_at, closes_at, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE');`,
        Crypto.randomUUID(),
        societyId,
        a.accountNo,
        a.clientName,
        a.accountType,
        a.frequency,
        rupeesToPaise(a.installmentRupees),
        rupeesToPaise(a.balanceRupees),
        a.lastTxnAt,
        null,
        null
      );
    }
  });
}

