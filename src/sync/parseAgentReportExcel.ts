import * as XLSX from 'xlsx';

import {
  makeSocietyCode,
  normalizeAccountType,
  normalizeFrequency,
  parseDateISO,
  type ParsedAccount,
  type ParsedReport,
} from './parseAgentReport';

function parseAnyDate(line: string): string | null {
  const direct = parseDateISO(line);
  if (direct) return direct;
  const match = line.match(/(\d{2})[\/.-](\d{2})[\/.-](\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function pickSheetName(workbook: XLSX.WorkBook): string {
  const names = workbook.SheetNames;
  const preferred = names.find((n) => n.toLowerCase() !== 'abstract');
  return preferred ?? names[0];
}

function isRowEmpty(row: any[]): boolean {
  return row.every((cell) => String(cell ?? '').trim() === '');
}

function cellText(value: any): string {
  return String(value ?? '').trim();
}

function normalizeHeader(value: any): string {
  return cellText(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function parseNumber(value: any): number {
  const raw = cellText(value);
  if (!raw) return 0;
  const num = Number(raw.replace(/,/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function parseHeadParts(value: string): { head: string; code: string | null } {
  const cleaned = value.replace(/^Account Head:\s*/i, '').replace(/\s{2,}/g, ' ').trim();
  const match = cleaned.match(/(.+?)\s+(\d+)$/);
  if (match) {
    return { head: match[1].trim(), code: match[2].trim() };
  }
  return { head: cleaned, code: null };
}

export function parseAgentReportExcel(base64: string, sheetName?: string): ParsedReport {
  const workbook = XLSX.read(base64, { type: 'base64' });
  const name = sheetName ?? pickSheetName(workbook);
  const sheet = workbook.Sheets[name];
  if (!sheet) throw new Error('No worksheet found in Excel file');

  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, blankrows: false });
  if (!rows.length) throw new Error('Excel sheet is empty');

  let societyName = '';
  let reportDateISO: string | null = null;
  let agentName = '';
  let agentCode = '';
  let currentHead = '';
  let currentHeadCode: string | null = null;
  let currentFrequency: ReturnType<typeof normalizeFrequency> = 'MONTHLY';
  let currentAccountType: ReturnType<typeof normalizeAccountType> = 'SAVINGS';

  const accounts: ParsedAccount[] = [];

  let headerIndex = -1;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || isRowEmpty(row)) continue;
    const first = cellText(row[0]);
    if (!societyName && first && !/collection list/i.test(first) && !/account head/i.test(first)) {
      societyName = first;
      const maybeDate = parseAnyDate(first);
      if (maybeDate) reportDateISO = maybeDate;
      continue;
    }

    const maybeDate = parseAnyDate(first) ?? parseAnyDate(cellText(row[1]));
    if (!reportDateISO && maybeDate) reportDateISO = maybeDate;

    if (/^account head\s*:/i.test(first)) {
      const headCell = cellText(row[2]) || cellText(row[1]) || first;
      const split = headCell.split(/Agent Name:\s*/i);
      const headPart = split[0]?.trim() ?? headCell;
      const agentPart = split[1]?.trim() ?? '';
      const parsedHead = parseHeadParts(headPart);
      const codeCell = cellText(row[1]);
      currentHead = parsedHead.head || currentHead;
      currentHeadCode = parsedHead.code ?? (codeCell && /^\d+$/.test(codeCell) ? codeCell : null);
      currentFrequency = normalizeFrequency(currentHead);
      currentAccountType = normalizeAccountType(currentHead);
      if (agentPart) {
        const agentCodeMatch = agentPart.match(/(.+?)\s+(\d+)$/);
        agentName = agentCodeMatch ? agentCodeMatch[1].trim() : agentPart;
        agentCode = agentCodeMatch ? agentCodeMatch[2].trim() : agentCode;
      }
      continue;
    }

    if (/^agent ac no\s*:/i.test(first)) {
      const codeCell = cellText(row[1]);
      agentCode = codeCell || agentCode;
      continue;
    }

    if (/^agent name\s*:/i.test(first)) {
      const agentCell = cellText(row[1]);
      const agentPart = agentCell || first.replace(/^Agent Name:\s*/i, '').trim();
      const agentCodeMatch = agentPart.match(/(.+?)\s+(\d+)$/);
      agentName = agentCodeMatch ? agentCodeMatch[1].trim() : agentPart;
      agentCode = agentCodeMatch ? agentCodeMatch[2].trim() : agentCode;
      continue;
    }

    if (/^date\s*:/i.test(first)) {
      const maybe = parseAnyDate(cellText(row[1]) || first);
      if (maybe) reportDateISO = maybe;
      continue;
    }

    if (first.toLowerCase() === 'ac no') {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex >= 0) {
    const headerRow = rows[headerIndex] ?? [];
    const headers = headerRow.map(normalizeHeader);
    const idxAccountNo = headers.findIndex((h) => h === 'ac no' || h.startsWith('ac no'));
    const idxName = headers.findIndex((h) => h.startsWith('name'));
    const idxInstallment = headers.findIndex((h) => h.includes('installment'));
    const idxBalance = headers.findIndex((h) => h.includes('balance'));
    const idxCollection = headers.findIndex((h) => h.includes('collection'));
    for (let i = headerIndex + 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row || isRowEmpty(row)) break;
      const first = cellText(row[idxAccountNo >= 0 ? idxAccountNo : 0]);
      if (!first) continue;
      if (/total/i.test(first)) break;

      const accountNo = first;
      const name = cellText(row[idxName >= 0 ? idxName : 1]);
      const installmentRaw = cellText(row[idxInstallment >= 0 ? idxInstallment : 2]);
      const collectionRaw = idxCollection >= 0 ? cellText(row[idxCollection]) : '';
      const fallbackAmount = cellText(row[3] ?? row[2]);
      const balanceRaw = cellText(row[idxBalance >= 0 ? idxBalance : 6]);
      if (!accountNo || !name) continue;
      const installment = parseNumber(installmentRaw) || parseNumber(collectionRaw) || parseNumber(fallbackAmount);
      const balance = parseNumber(balanceRaw);

      accounts.push({
        accountNo,
        clientName: name.replace(/\s{2,}/g, ' ').trim(),
        balanceRupees: balance,
        installmentRupees: installment,
        accountType: currentAccountType,
        frequency: currentFrequency,
        accountHead: currentHead,
        accountHeadCode: currentHeadCode,
      });
    }
  }

  if (!societyName) throw new Error('Society name not found in Excel');
  if (!agentCode || !agentName) throw new Error('Agent name/code not found in Excel');
  if (accounts.length === 0) throw new Error('No account rows found in Excel');

  return {
    societyName,
    societyCode: makeSocietyCode(societyName),
    agentName,
    agentCode,
    reportDateISO,
    accounts,
  };
}
