import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';

import { parseAgentReportExcel } from '../src/sync/parseAgentReportExcel';

function makeBase64(rows: any[][]): string {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
}

describe('parseAgentReportExcel', () => {
  it('parses agent details and amount rows', () => {
    const rows = [
      ['TEST SOCIETY, CITY'],
      ['Collection List of 31/03/2024'],
      ['Account Head:DAILY PIGMY ACCOUNT  007 '],
      ['Agent Name:Mr.TEST AGENT 00100099'],
      ['Ac No', 'Comp Ac No', 'Name', 'Amount'],
      ['101', '700001', 'FIRST CLIENT', '100'],
      ['102', '700002', 'SECOND CLIENT', '150'],
    ];

    const base64 = makeBase64(rows);
    const report = parseAgentReportExcel(base64);

    expect(report.societyName).toBe('TEST SOCIETY, CITY');
    expect(report.reportDateISO).toBe('2024-03-31');
    expect(report.agentName).toBe('Mr.TEST AGENT');
    expect(report.agentCode).toBe('00100099');
    expect(report.accounts.length).toBe(2);
    expect(report.accounts[0].accountNo).toBe('101');
    expect(report.accounts[0].accountHead).toBe('DAILY PIGMY ACCOUNT');
    expect(report.accounts[0].accountHeadCode).toBe('007');
    expect(report.accounts[0].installmentRupees).toBe(100);
  });
});
