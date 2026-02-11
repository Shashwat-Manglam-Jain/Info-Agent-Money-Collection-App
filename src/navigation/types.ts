export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  AccountDetail: { accountId: string };
  ImportMasterData: { mode?: 'replace' | 'add' } | undefined;
};

export type MainTabParamList = {
  Collect: undefined;
  Accounts: undefined;
  Reports: undefined;
  Sync: undefined;
};
