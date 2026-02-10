import { describe, expect, it } from 'vitest';
import { parseAgentReportText } from '../src/sync/parseAgentReport';

const sample1 = `PRIYADARSHANI MAHILA CREDIT SOCIETY, karanja                 Date :- 19-01-2026
main road - 442203
Agent Wise Client Account Report
Account Head:DAILY PIGMY ACCOUNT  007 Agent Name:Mr.PRAKASH VITHOBA BIRGADE  00100001

----------------------------------------------------------------------
Ac No     Name                                       Balance  
----------------------------------------------------------------------
00700116  BEBITAI MARAOTRAO BHOKRE                    650.00  
00700346  HEMANT MANOHAR BOBDE                        200.00  
00700990  RAJU SHAMRAO WIRULKAR                       520.00  
00701291  RAJU SHAMRAO WIRULKAR                       600.00  
00701398  MANGALA RAMESHRAO SARODE                   2540.00  
00701399  RAMESH RAMRAOJI SARODE                      800.00  
00701586  DIPAK BUDHDARAM GAJBHIYE                   7600.00  
00701614  SATISH UTTAM KASHIKAR                       140.00  
00701661  SANJAY NAMDEVRAO DESHMUKH                   500.00  
00701665  VIJAY GULABRAO BAINGANE                      10.00  
00701786  VISHNU KESHAVRAO BOWADE                     630.00  
00701927  YUVRAJ BALIRAMJI GIRHALE                   1850.00  
00701945  YADAV DAMUJI SOMKUWAR                        80.00  
00701961  ANUSAYA SHANTARAM CHARDE                   3850.00  
00702118  NAJ PARVIN SADRODDIN ENAMDAR                100.00  
00702255  GANGADHAR GANPATARAO KINKAR                 400.00  
00702259  MAROTI MAHADEO PARADKAR                     920.00  

----------------------------------------------------------------------
          Total Records =                                 17  
          Total Tr Amount =                         11400.00  
----------------------------------------------------------------------`;

const sample2 = `PRIYADARSHANI MAHILA CREDIT SOCIETY, karanja                 Date :- 19-01-2026
main road - 442203
Agent Wise Client Account Report
Account Head:DAILY PIGMY ACCOUNT  007 Agent Name:Mr.LALIT DNYANESHOWER DHOLE  00100006

----------------------------------------------------------------------
Ac No     Name                                       Balance  
----------------------------------------------------------------------
00704713  NITESH GANPATRAO KALASKAR                   100.00  
00704714  CHITRA DIGAMBAR YESANSURE                   100.00  
00704788  SUWARNA NAMDEORAO DESHMUKH SUWARNA PREM GAKHARE      200.00  
00704912  MITHUNSINGH AVTARSINGH BAWARI              5,100.00  
`;

const sampleComma = `TEST SOCIETY                 Date :- 01-02-2026
Agent Wise Client Account Report
Account Head:MONTHLY RECURRING DEPOSIT  034 Agent Name:Mr.TEST USER  00000001
----------------------------------------------------------------------
Ac No     Name                                       Balance  
----------------------------------------------------------------------
03400001  SAMPLE PERSON                             1,200.50  
`;

describe('parseAgentReportText', () => {
  it('parses agent, head, and accounts from sample 1', () => {
    const report = parseAgentReportText(sample1);
    expect(report.societyName).toBe('PRIYADARSHANI MAHILA CREDIT SOCIETY, karanja');
    expect(report.reportDateISO).toBe('2026-01-19');
    expect(report.agentCode).toBe('00100001');
    expect(report.agentName).toBe('Mr.PRAKASH VITHOBA BIRGADE');
    expect(report.accounts.length).toBe(17);
    expect(report.accounts[0].accountHead).toBe('DAILY PIGMY ACCOUNT');
    expect(report.accounts[0].accountHeadCode).toBe('007');
    expect(report.accounts[0].accountNo).toBe('00700116');
    expect(report.accounts[0].balanceRupees).toBe(650);
  });

  it('parses long names and agent code from sample 2', () => {
    const report = parseAgentReportText(sample2);
    expect(report.agentCode).toBe('00100006');
    expect(report.agentName).toBe('Mr.LALIT DNYANESHOWER DHOLE');
    const longName = report.accounts.find((a) => a.accountNo === '00704788');
    expect(longName?.clientName).toBe('SUWARNA NAMDEORAO DESHMUKH SUWARNA PREM GAKHARE');
  });

  it('parses comma separated balances', () => {
    const report = parseAgentReportText(sampleComma);
    expect(report.accounts[0].balanceRupees).toBe(1200.5);
  });
});
