import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { parseAgentReportText, type ParsedReport } from './parseAgentReport';
import { parseAgentReportExcel } from './parseAgentReportExcel';
import { rupeesToPaise } from '../utils/money';
import { lotKeyFromParts } from '../utils/lots';

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

function normalizeHeadCode(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function importParsedReport(
  db: SQLiteDatabase,
  report: ParsedReport,
  options: { replaceExisting?: boolean } = {}
): Promise<ImportResult> {
  const societyCode = report.societyCode;
  const societyName = report.societyName.trim();

  let societyId: string;
  let agentId: string;

  await db.withTransactionAsync(async () => {
    const existingSociety = await db.getFirstAsync<any>('SELECT * FROM societies WHERE code = ?;', societyCode);

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
      agentId = agentRow.id;
      await db.runAsync(
        'UPDATE agents SET name = ?, pin_hash = ?, is_active = 1 WHERE id = ?;',
        report.agentName,
        pinHash,
        agentRow.id
      );
    } else {
      agentId = Crypto.randomUUID();
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

    if (options.replaceExisting !== false) {
      const lots = new Map<
        string,
        { lotKey: string; accountHeadCode: string | null; accountType: string; frequency: string }
      >();
      for (const account of report.accounts) {
        const accountHeadCode = normalizeHeadCode(account.accountHeadCode);
        const lotKey = lotKeyFromParts(accountHeadCode, account.accountType, account.frequency);
        if (!lots.has(lotKey)) {
          lots.set(lotKey, {
            lotKey,
            accountHeadCode,
            accountType: account.accountType,
            frequency: account.frequency,
          });
        }
      }

      await db.runAsync(
        `DELETE FROM exports
         WHERE society_id = ? AND agent_id = ?;`,
        societyId,
        agentId
      );

      for (const lot of lots.values()) {
        if (lot.accountHeadCode) {
          await db.runAsync(
            `DELETE FROM collections
             WHERE society_id = ? AND agent_id = ?
               AND account_id IN (
                 SELECT id FROM accounts
                 WHERE society_id = ? AND agent_id = ? AND account_lot_key = ?
                   AND account_type = ? AND frequency = ? AND account_head_code = ?
               );`,
            societyId,
            agentId,
            societyId,
            agentId,
            lot.lotKey,
            lot.accountType,
            lot.frequency,
            lot.accountHeadCode
          );
          await db.runAsync(
            `DELETE FROM accounts
             WHERE society_id = ? AND agent_id = ? AND account_lot_key = ?
               AND account_type = ? AND frequency = ? AND account_head_code = ?;`,
            societyId,
            agentId,
            lot.lotKey,
            lot.accountType,
            lot.frequency,
            lot.accountHeadCode
          );
        } else {
          await db.runAsync(
            `DELETE FROM collections
             WHERE society_id = ? AND agent_id = ?
               AND account_id IN (
                 SELECT id FROM accounts
                 WHERE society_id = ? AND agent_id = ? AND account_lot_key = ?
                   AND account_type = ? AND frequency = ?
                   AND (account_head_code IS NULL OR account_head_code = '')
               );`,
            societyId,
            agentId,
            societyId,
            agentId,
            lot.lotKey,
            lot.accountType,
            lot.frequency
          );
          await db.runAsync(
            `DELETE FROM accounts
             WHERE society_id = ? AND agent_id = ? AND account_lot_key = ?
               AND account_type = ? AND frequency = ?
               AND (account_head_code IS NULL OR account_head_code = '');`,
            societyId,
            agentId,
            lot.lotKey,
            lot.accountType,
            lot.frequency
          );
        }
      }
    }

    for (const a of report.accounts) {
      const lastTxnAt = report.reportDateISO ?? null;
      const balancePaise = rupeesToPaise(a.balanceRupees ?? 0);
      const installmentPaise = rupeesToPaise(a.installmentRupees ?? 0);
      const accountHeadCode = normalizeHeadCode(a.accountHeadCode);
      const lotKey = lotKeyFromParts(accountHeadCode, a.accountType, a.frequency);
      const existing = await db.getFirstAsync<any>(
        `SELECT id FROM accounts
         WHERE society_id = ? AND agent_id = ? AND account_no = ? AND account_lot_key = ?;`,
        societyId,
        agentId,
        a.accountNo,
        lotKey
      );

      if (existing) {
        await db.runAsync(
          `UPDATE accounts
           SET client_name = ?, account_lot_key = ?, account_type = ?, frequency = ?,
               account_head = ?, account_head_code = ?,
               installment_paise = ?, balance_paise = ?, last_txn_at = ?
           WHERE id = ?;`,
          a.clientName,
          lotKey,
          a.accountType,
          a.frequency,
          a.accountHead,
          accountHeadCode,
          installmentPaise,
          balancePaise,
          lastTxnAt,
          existing.id
        );
      } else {
        await db.runAsync(
          `INSERT INTO accounts (
              id, society_id, agent_id, account_no, account_lot_key, client_name, account_type, frequency,
              account_head, account_head_code,
              installment_paise, balance_paise, last_txn_at, opened_at, closes_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE');`,
          Crypto.randomUUID(),
          societyId,
          agentId,
          a.accountNo,
          lotKey,
          a.clientName,
          a.accountType,
          a.frequency,
          a.accountHead,
          accountHeadCode,
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
