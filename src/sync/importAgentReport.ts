import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { parseAgentReportText, type ParsedReport } from './parseAgentReport';
import { parseAgentReportExcel } from './parseAgentReportExcel';
import { rupeesToPaise } from '../utils/money';

export const DEFAULT_AGENT_PIN = '0000' as const;


async function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

type ImportResult = {
  societyCode: string;
  societyName: string;
  agentCode: string;
  agentName: string;
  accountsUpserted: number;
};

export async function importParsedReport(
  db: SQLiteDatabase,
  report: ParsedReport,
  options: { replaceExisting?: boolean } = {}
): Promise<ImportResult> {
  const societyCode = report.societyCode;
  const societyName = report.societyName.trim();

  let societyId: string;

  await db.withTransactionAsync(async () => {
    const existingSociety = await db.getFirstAsync<any>('SELECT * FROM societies WHERE code = ?;', societyCode);

    if (options.replaceExisting !== false && existingSociety) {
      await db.runAsync('DELETE FROM collections WHERE society_id = ?;', existingSociety.id);
      await db.runAsync('DELETE FROM exports WHERE society_id = ?;', existingSociety.id);
      await db.runAsync('DELETE FROM accounts WHERE society_id = ?;', existingSociety.id);
    }

    if (existingSociety) {
      societyId = existingSociety.id;
      await db.runAsync('UPDATE societies SET name = ? WHERE id = ?;', societyName, societyId);
    } else {
      societyId = Crypto.randomUUID();
      await db.runAsync('INSERT INTO societies (id, code, name) VALUES (?, ?, ?);', societyId, societyCode, societyName);
    }

    const pinHash = await sha256(`${societyId}:${DEFAULT_AGENT_PIN}`);
    const agentRow = await db.getFirstAsync<any>(
      'SELECT id FROM agents WHERE society_id = ? AND code = ?;',
      societyId,
      report.agentCode
    );

    if (agentRow) {
      await db.runAsync(
        'UPDATE agents SET name = ?, pin_hash = ?, is_active = 1 WHERE id = ?;',
        report.agentName,
        pinHash,
        agentRow.id
      );
    } else {
      const agentId = Crypto.randomUUID();
      await db.runAsync(
        'INSERT INTO agents (id, society_id, code, name, phone, pin_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, 1);',
        agentId,
        societyId,
        report.agentCode,
        report.agentName,
        null,
        pinHash
      );
    }

    for (const a of report.accounts) {
      const lastTxnAt = report.reportDateISO ?? null;
      const balancePaise = rupeesToPaise(a.balanceRupees ?? 0);
      const installmentPaise = rupeesToPaise(a.installmentRupees ?? 0);
      const existing = await db.getFirstAsync<any>(
        'SELECT id FROM accounts WHERE society_id = ? AND account_no = ?;',
        societyId,
        a.accountNo
      );

      if (existing) {
        await db.runAsync(
          `UPDATE accounts
           SET client_name = ?, account_type = ?, frequency = ?,
               account_head = ?, account_head_code = ?,
               installment_paise = ?, balance_paise = ?, last_txn_at = ?
           WHERE id = ?;`,
          a.clientName,
          a.accountType,
          a.frequency,
          a.accountHead,
          a.accountHeadCode,
          installmentPaise,
          balancePaise,
          lastTxnAt,
          existing.id
        );
      } else {
        await db.runAsync(
          `INSERT INTO accounts (
              id, society_id, account_no, client_name, account_type, frequency,
              account_head, account_head_code,
              installment_paise, balance_paise, last_txn_at, opened_at, closes_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE');`,
          Crypto.randomUUID(),
          societyId,
          a.accountNo,
          a.clientName,
          a.accountType,
          a.frequency,
          a.accountHead,
          a.accountHeadCode,
          installmentPaise,
          balancePaise,
          lastTxnAt,
          null,
          null
        );
      }
    }
  });

  return {
    societyCode,
    societyName,
    agentCode: report.agentCode,
    agentName: report.agentName,
    accountsUpserted: report.accounts.length,
  };
}

export async function importAgentReportText(
  db: SQLiteDatabase,
  text: string,
  options: { replaceExisting?: boolean } = {}
): Promise<ImportResult> {
  const report = parseAgentReportText(text);
  return importParsedReport(db, report, options);
}

export async function importAgentReportExcel(
  db: SQLiteDatabase,
  base64: string,
  options: { replaceExisting?: boolean } = {}
): Promise<ImportResult> {
  const report = parseAgentReportExcel(base64);
  return importParsedReport(db, report, options);
}
