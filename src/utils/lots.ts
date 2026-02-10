import type { AccountType, Frequency } from '../models/types';

export function lotKeyFromParts(accountHeadCode: string | null, accountType: AccountType, frequency: Frequency): string {
  const headCode = accountHeadCode && accountHeadCode.trim() ? accountHeadCode.trim() : null;
  if (headCode) return `${headCode}_${accountType}_${frequency}`;
  return `${accountType}_${frequency}`;
}

export function lotLabel(params: {
  accountHead?: string | null;
  accountHeadCode?: string | null;
  accountType: AccountType;
  frequency: Frequency;
}): string {
  const base = params.accountHead?.trim() ? params.accountHead.trim() : params.accountType;
  const code = params.accountHeadCode?.trim();
  return code ? `${base} (${code})` : base;
}
