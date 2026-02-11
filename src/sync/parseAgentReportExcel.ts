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

    const maybeDate = parseAnyDate(first);
    if (!reportDateISO && maybeDate) reportDateISO = maybeDate;

    if (/^account head:/i.test(first)) {
      const headPart = first.replace(/^Account Head:\s*/i, '').trim();
      const headCodeMatch = headPart.match(/(.+?)\s+(\d+)$/);
      currentHead = headCodeMatch ? headCodeMatch[1].trim() : headPart;
      currentHeadCode = headCodeMatch ? headCodeMatch[2].trim() : null;
      currentFrequency = normalizeFrequency(currentHead);
      currentAccountType = normalizeAccountType(currentHead);
      continue;
    }

    if (/^agent name:/i.test(first)) {
      const agentPart = first.replace(/^Agent Name:\s*/i, '').trim();
      const agentCodeMatch = agentPart.match(/(.+?)\s+(\d+)$/);
      agentName = agentCodeMatch ? agentCodeMatch[1].trim() : agentPart;
      agentCode = agentCodeMatch ? agentCodeMatch[2].trim() : agentCode;
      continue;
    }

    if (first.toLowerCase() === 'ac no') {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex >= 0) {
    for (let i = headerIndex + 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row || isRowEmpty(row)) break;
      const first = cellText(row[0]);
      if (!first) continue;
      if (/total/i.test(first)) break;

      const accountNo = first;
      const name = cellText(row[2] ?? row[1]);
      const amountRaw = cellText(row[3] ?? row[2]);
      if (!accountNo || !name) continue;
      const amount = Number(String(amountRaw).replace(/,/g, ''));

      accounts.push({
        accountNo,
        clientName: name.replace(/\s{2,}/g, ' ').trim(),
        balanceRupees: 0,
        installmentRupees: Number.isFinite(amount) ? amount : 0,
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
