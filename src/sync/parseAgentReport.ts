import type { AccountType, Frequency } from '../models/types';

export type ParsedAccount = {
  accountNo: string;
  clientName: string;
  balanceRupees: number;
  installmentRupees?: number;
  accountType: AccountType;
  frequency: Frequency;
  accountHead: string;
  accountHeadCode: string | null;
};

export type ParsedReport = {
  societyName: string;
  societyCode: string;
  agentName: string;
  agentCode: string;
  reportDateISO: string | null;
  accounts: ParsedAccount[];
};

export function makeSocietyCode(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length >= 4) return cleaned.slice(0, 6);
  return 'SOCIETY';
}

export function normalizeFrequency(text: string): Frequency {
  const v = text.toUpperCase();
  if (v.includes('DAILY')) return 'DAILY';
  if (v.includes('WEEKLY')) return 'WEEKLY';
  if (v.includes('MONTHLY')) return 'MONTHLY';
  return 'MONTHLY';
}

export function normalizeAccountType(text: string): AccountType {
  const v = text.toUpperCase();
  if (v.includes('PIGMY') || v.includes('PIGMI')) return 'PIGMY';
  if (v.includes('LOAN')) return 'LOAN';
  if (v.includes('RECURRING') || v.includes('DEPOSIT')) return 'SAVINGS';
  return 'SAVINGS';
}

export function parseDateISO(line: string): string | null {
  const match = line.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

export function parseAgentReportText(text: string): ParsedReport {
  const lines = text.split(/\r?\n/);
  let societyName = '';
  let reportDateISO: string | null = null;
  let agentName = '';
  let agentCode = '';
  let currentHead = '';
  let currentHeadCode: string | null = null;
  let currentFrequency: Frequency = 'MONTHLY';
  let currentAccountType: AccountType = 'SAVINGS';
  const accounts: ParsedAccount[] = [];

  let inTable = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (!societyName) {
      if (line.toLowerCase().includes('date')) {
        const parts = line.split(/\s+Date\s*:-\s*/i);
        societyName = (parts[0] ?? '').trim();
        reportDateISO = parseDateISO(line);
      } else {
        societyName = line;
      }
      continue;
    }

    if (line.toLowerCase().startsWith('account head:')) {
      const rest = line.replace(/^Account Head:\s*/i, '').trim();
      const split = rest.split(/\s+Agent Name:\s*/i);
      const headPart = split[0]?.trim() ?? '';
      const agentPart = split[1]?.trim();

      if (headPart) {
        const headCodeMatch = headPart.match(/(.+?)\s+(\d+)$/);
        currentHead = headCodeMatch ? headCodeMatch[1].trim() : headPart;
        currentHeadCode = headCodeMatch ? headCodeMatch[2].trim() : null;
        currentFrequency = normalizeFrequency(currentHead);
        currentAccountType = normalizeAccountType(currentHead);
      }

      if (agentPart) {
        const agentCodeMatch = agentPart.match(/(.+?)\s+(\d+)$/);
        agentName = agentCodeMatch ? agentCodeMatch[1].trim() : agentPart;
        agentCode = agentCodeMatch ? agentCodeMatch[2].trim() : agentCode;
      }
      continue;
    }

    if (line.toLowerCase().startsWith('agent name:')) {
      const agentPart = line.replace(/^Agent Name:\s*/i, '').trim();
      if (agentPart) {
        const agentCodeMatch = agentPart.match(/(.+?)\s+(\d+)$/);
        agentName = agentCodeMatch ? agentCodeMatch[1].trim() : agentPart;
        agentCode = agentCodeMatch ? agentCodeMatch[2].trim() : agentCode;
      }
      continue;
    }

    if (line.toLowerCase().startsWith('ac no')) {
      inTable = true;
      continue;
    }

    if (/^-{5,}$/.test(line)) continue;

    if (line.toLowerCase().startsWith('total records')) {
      inTable = false;
      continue;
    }

    if (inTable) {
      const rowMatch = line.match(/^(\d{4,})\s+(.+?)\s+(-?\d[\d,]*(?:\.\d+)?)$/);
      if (!rowMatch) continue;
      const [, accountNo, name, balanceRaw] = rowMatch;
      const balance = Number(balanceRaw.replace(/,/g, ''));
      const normalizedBalance = Number.isFinite(balance) ? balance : 0;
      accounts.push({
        accountNo: accountNo.trim(),
        clientName: name.replace(/\s{2,}/g, ' ').trim(),
        balanceRupees: normalizedBalance,
        installmentRupees: normalizedBalance,
        accountType: currentAccountType,
        frequency: currentFrequency,
        accountHead: currentHead,
        accountHeadCode: currentHeadCode,
      });
    }
  }

  if (!societyName) throw new Error('Society name not found in file');
  if (!agentCode || !agentName) throw new Error('Agent name/code not found in file');
  if (accounts.length === 0) throw new Error('No account rows found in file');

  return {
    societyName,
    societyCode: makeSocietyCode(societyName),
    agentName,
    agentCode,
    reportDateISO,
    accounts,
  };
}
