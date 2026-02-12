export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type AccountType = 'PIGMY' | 'LOAN' | 'SAVINGS';

export type AccountStatus = 'ACTIVE' | 'CLOSED';

export type CollectionStatus = 'PENDING' | 'EXPORTED';


export type Society = {
  id: string;
  code: string;
  name: string;
};

export type Agent = {
  id: string;
  societyId: string;
  code: string;
  name: string;
  phone: string | null;
  isActive: boolean;
};

export type AgentProfile = {
  society: Society;
  agent: Agent;
};

export type Account = {
  id: string;
  societyId: string;
  agentId: string;
  accountNo: string;
  lotKey: string;
  clientName: string;
  accountType: AccountType;
  frequency: Frequency;
  accountHead: string | null;
  accountHeadCode: string | null;
  installmentPaise: number;
  balancePaise: number;
  lastTxnAt: string | null;
  openedAt: string | null;
  closesAt: string | null;
  status: AccountStatus;
};

export type CollectionEntry = {
  id: string;
  societyId: string;
  agentId: string;
  accountId: string;
  accountNo: string;
  collectedPaise: number;
  collectedAt: string;
  collectionDate: string;
  status: CollectionStatus;
  exportedAt: string | null;
  remarks: string | null;
};

export type ExportRecord = {
  id: string;
  societyId: string;
  agentId: string;
  exportedAt: string;
  fileUri: string | null;
  collectionsCount: number;
};

export type ExportCollectionRow = CollectionEntry & {
  clientName: string;
  accountHead: string | null;
  accountHeadCode: string | null;
  accountType: AccountType;
  frequency: Frequency;
};

export type AccountLot = {
  key: string;
  accountHead: string | null;
  accountHeadCode: string | null;
  accountType: AccountType;
  frequency: Frequency;
  count: number;
};

export type ActiveLot = {
  key: string;
  accountHead: string | null;
  accountHeadCode: string | null;
  accountType: AccountType;
  frequency: Frequency;
};
