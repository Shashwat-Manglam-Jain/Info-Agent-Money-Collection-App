export type ImportCategory = 'daily' | 'monthly' | 'loan';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  AccountDetail: { accountId: string };
  ExportDetail: {
    fileUri: string;
    fileName: string;
    exportedAtISO?: string | null;
    lotCode?: string | null;
    collectionsCount?: number | null;
  };
  ImportMasterData: { mode?: 'replace' | 'add'; category?: ImportCategory } | undefined;
};

export type MainTabParamList = {
  Collect: undefined;
  Accounts: undefined;
  Reports: undefined;
  Sync: undefined;
};
