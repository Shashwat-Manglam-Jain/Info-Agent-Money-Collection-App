// import { useCallback, useMemo, useState } from 'react';
// import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
// import { useFocusEffect, useNavigation } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// import { useApp } from '../../appState/AppProvider';
// import { Button } from '../../components/Button';
// import { Card } from '../../components/Card';
// import { EmptyState } from '../../components/EmptyState';
// import { Icon } from '../../components/Icon';
// import { LotSelector } from '../../components/LotSelector';
// import { Skeleton } from '../../components/Skeleton';
// import { ScrollScreen } from '../../components/Screen';
// import { SectionHeader } from '../../components/SectionHeader';
// import { SocietySwitcherCard } from '../../components/SocietySwitcherCard';
// import { TextField } from '../../components/TextField';
// import type { RootStackParamList } from '../../navigation/types';
// import type { Account, AccountLot, CollectionEntry } from '../../models/types';
// import {
//   getAccountCount,
//   getAccountCountByLot,
//   getCollectionTotalsForDate,
//   getCollectionTotalsForDateByLot,
//   listAccountLots,
//   listCollectionsForDate,
//   listCollectionsForDateByLot,
//   searchAccountsByLastDigits,
// } from '../../db/repo';
// import { toISODate } from '../../utils/dates';
// import { formatINR } from '../../utils/money';
// import { useTheme } from '../../theme';
// import type { Theme } from '../../theme';
// import { lotKeyFromParts, lotLabel } from '../../utils/lots';

// export function CollectScreen() {
//   const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//   const { db, society, agent, activeLot, setActiveLot } = useApp();
//   const theme = useTheme();
//   const styles = useMemo(() => makeStyles(theme), [theme]);
//   const [digits, setDigits] = useState('');
//   const [results, setResults] = useState<Account[]>([]);
//   const [lots, setLots] = useState<AccountLot[]>([]);
//   const [searchedDigits, setSearchedDigits] = useState<string | null>(null);
//   const [todayEntries, setTodayEntries] = useState<CollectionEntry[]>([]);
//   const [todayTotal, setTodayTotal] = useState(0);
//   const [todayCount, setTodayCount] = useState(0);
//   const [totalAccounts, setTotalAccounts] = useState(0);
//   const [loading, setLoading] = useState(true);

//   const today = useMemo(() => toISODate(new Date()), []);

//   const refreshToday = useCallback(async () => {
//     if (!db || !agent || !society) return;
//     setLoading(true);
//     try {
//       const [entries, totals, accountCount, lotRows] = activeLot
//         ? await Promise.all([
//             listCollectionsForDateByLot({
//               db,
//               societyId: society.id,
//               agentId: agent.id,
//               collectionDate: today,
//               lot: activeLot,
//             }),
//             getCollectionTotalsForDateByLot({
//               db,
//               societyId: society.id,
//               agentId: agent.id,
//               collectionDate: today,
//               lot: activeLot,
//             }),
//             getAccountCountByLot(db, society.id, agent.id, activeLot),
//             listAccountLots(db, society.id, agent.id),
//           ])
//         : await Promise.all([
//             listCollectionsForDate({ db, societyId: society.id, agentId: agent.id, collectionDate: today }),
//             getCollectionTotalsForDate({ db, societyId: society.id, agentId: agent.id, collectionDate: today }),
//             getAccountCount(db, society.id, agent.id),
//             listAccountLots(db, society.id, agent.id),
//           ]);
//       setTodayEntries(entries);
//       setTodayTotal(totals.totalPaise);
//       setTodayCount(totals.count);
//       setTotalAccounts(accountCount);
//       setLots(lotRows);
//       if (activeLot && !lotRows.find((lot) => lot.key === activeLot.key)) {
//         await setActiveLot(null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [agent, db, society, today, activeLot, setActiveLot]);

//   const remainingCount = Math.max(totalAccounts - todayCount, 0);

//   useFocusEffect(
//     useCallback(() => {
//       void refreshToday();
//     }, [refreshToday])
//   );

//   const doSearch = useCallback(async () => {
//     if (!db || !society || !agent) return;
//     setSearchedDigits(digits);
//     const r = await searchAccountsByLastDigits(db, society.id, agent.id, digits);
//     setResults(r);
//   }, [agent, db, digits, society]);

//   const filteredResults = useMemo(() => {
//     if (!activeLot) return results;
//     return results.filter((a) => lotKeyFromParts(a.accountHeadCode, a.accountType, a.frequency) === activeLot.key);
//   }, [activeLot, results]);

//   const collectionProgress = totalAccounts > 0 ? Math.min(todayCount / totalAccounts, 1) : 0;

//   const openAccount = (accountId: string) => nav.navigate('AccountDetail', { accountId });

//   return (
//     <ScrollScreen>
//       <SocietySwitcherCard />

//       <Card>
//         <SectionHeader
//           title="Account Type"
//           subtitle={activeLot ? `Active: ${lotLabel(activeLot)}` : 'All account types'}
//           icon="layers-outline"
//           right={(
//             <Pressable
//               onPress={() => nav.navigate('ImportMasterData', { mode: 'add' })}
//               style={styles.addButton}
//               accessibilityLabel="Add account type"
//             >
//               <Icon name="add" size={18} color={theme.colors.primary} />
//             </Pressable>
//           )}
//         />
//         <View style={{ height: 10 }} />
//         {loading && lots.length === 0 ? (
//           <View style={{ gap: 8 }}>
//             <Skeleton height={14} width="60%" />
//             <Skeleton height={36} width="100%" />
//           </View>
//         ) : (
//           <LotSelector lots={lots} activeLot={activeLot} onSelect={setActiveLot} />
//         )}
//       </Card>

//       <Card>
//         <SectionHeader
//           title="Quick Collect"
//           subtitle="Enter last digits of Account No to fetch details."
//           icon="flash-outline"
//         />
//         <View style={{ height: 10 }} />
//         <TextField
//           label="Last Digits"
//           value={digits}
//           onChangeText={(v) => setDigits(v.replace(/[^0-9]/g, ''))}
//           keyboardType="number-pad"
//           placeholder="e.g. 1234"
//           leftIcon="keypad-outline"
//           autoCorrect={false}
//         />
//         <View style={{ height: 12 }} />
//         <Button title="Search" iconLeft="search-outline" onPress={doSearch} disabled={!digits.trim()} />
//       </Card>

//       {searchedDigits ? (
//         <Card>
//           <SectionHeader title="Matches" subtitle={`Account No ends with: ${searchedDigits}`} icon="list-outline" />
//           <View style={{ height: 10 }} />
//           {filteredResults.length === 0 ? (
//             <EmptyState icon="search-outline" title="No matches" message="Try different digits or check the account number." />
//           ) : (
//             <FlatList
//               data={filteredResults}
//               keyExtractor={(a) => a.id}
//               scrollEnabled={false}
//               ItemSeparatorComponent={() => <View style={styles.sep} />}
//               renderItem={({ item }) => (
//                 <Pressable onPress={() => openAccount(item.id)} style={styles.row}>
//                   <View style={{ flex: 1 }}>
//                     <View style={styles.matchTop}>
//                       <View style={styles.clientLine}>
//                         <Icon name="client" size={15} color={theme.colors.primary} />
//                         <Text style={styles.rowTitle} numberOfLines={1}>
//                           {item.clientName}
//                         </Text>
//                       </View>
//                       <Text style={styles.accountChip}>{item.accountNo}</Text>
//                     </View>
//                     <Text style={styles.rowSub}>
//                       {(item.accountHead ?? item.accountType)} • {item.frequency} • Balance {formatINR(item.balancePaise)}
//                     </Text>
//                   </View>
//                 </Pressable>
//               )}
//             />
//           )}
//         </Card>
//       ) : null}

//       <Card>
//         <SectionHeader title={`Today (${today})`} subtitle="Daily progress summary" icon="today-outline" />
//         <View style={{ height: 10 }} />
//         {loading ? (
//           <View style={{ gap: 10 }}>
//             <View style={styles.statsGrid}>
//               <Skeleton height={72} width="31%" />
//               <Skeleton height={72} width="31%" />
//               <Skeleton height={72} width="31%" />
//             </View>
//             <Skeleton height={8} width="100%" />
//             <Skeleton height={42} width="100%" />
//             <Skeleton height={42} width="100%" />
//           </View>
//         ) : (
//           <>
//             <View style={styles.statsGrid}>
//               <View style={styles.statTile}>
//                 <Text style={styles.statValue}>{todayCount}</Text>
//                 <Text style={styles.statLabel}>Collected</Text>
//               </View>
//               <View style={styles.statTile}>
//                 <Text style={styles.statValue}>{remainingCount}</Text>
//                 <Text style={styles.statLabel}>Remaining</Text>
//               </View>
//               <View style={styles.statTile}>
//                 <Text style={styles.statValue}>{formatINR(todayTotal)}</Text>
//                 <Text style={styles.statLabel}>Amount</Text>
//               </View>
//             </View>
//             <View style={styles.progressTrack}>
//               <View style={[styles.progressFill, { width: `${Math.round(collectionProgress * 100)}%` }]} />
//             </View>
//             <Text style={styles.kv}>
//               {Math.round(collectionProgress * 100)}% complete • {todayCount} / {totalAccounts} clients
//             </Text>
//             <View style={{ height: 10 }} />
//             {todayEntries.length === 0 ? (
//               <EmptyState icon="receipt-outline" title="No collections yet" message="Start with Quick Collect above." />
//             ) : (
//               <FlatList
//                 data={todayEntries}
//                 keyExtractor={(e) => e.id}
//                 scrollEnabled={false}
//                 ItemSeparatorComponent={() => <View style={styles.sep} />}
//                 renderItem={({ item }) => (
//                   <Pressable onPress={() => openAccount(item.accountId)} style={styles.row}>
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.rowTitle}>{item.accountNo}</Text>
//                       <Text style={styles.rowSub}>{formatINR(item.collectedPaise)}</Text>
//                     </View>
//                   </Pressable>
//                 )}
//               />
//             )}
//           </>
//         )}
//       </Card>
//     </ScrollScreen>
//   );
// }

// const makeStyles = (theme: Theme) =>
//   StyleSheet.create({
//     row: {
//       paddingVertical: 12,
//       paddingHorizontal: 4,
//       borderRadius: theme.radii.sm,
//     },
//     matchTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
//     clientLine: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
//     accountChip: {
//       fontSize: 11,
//       fontWeight: '800',
//       color: theme.colors.primary,
//       paddingHorizontal: 10,
//       paddingVertical: 6,
//       borderRadius: theme.radii.pill,
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//       backgroundColor: theme.colors.primarySoft,
//     },
//     rowTitle: { fontSize: 15, fontWeight: '900', color: theme.colors.text },
//     rowSub: { fontSize: 12, color: theme.colors.muted, marginTop: 3, lineHeight: 17 },
//     sep: { height: 1, backgroundColor: theme.colors.border },
//     kv: { marginTop: 6, fontSize: 13, color: theme.colors.text, fontWeight: '600' },
//     addButton: {
//       width: 36,
//       height: 36,
//       borderRadius: 18,
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//       alignItems: 'center',
//       justifyContent: 'center',
//       backgroundColor: theme.colors.surfaceTint,
//     },
//     statsGrid: {
//       flexDirection: 'row',
//       gap: 8,
//     },
//     statTile: {
//       flex: 1,
//       minHeight: 78,
//       borderRadius: theme.radii.sm + 2,
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//       backgroundColor: theme.colors.surfaceTint,
//       paddingHorizontal: 11,
//       paddingVertical: 10,
//       justifyContent: 'center',
//       gap: 4,
//     },
//     statValue: {
//       fontSize: 15,
//       fontWeight: '900',
//       color: theme.colors.text,
//     },
//     statLabel: {
//       fontSize: 11,
//       fontWeight: '700',
//       color: theme.colors.muted,
//       textTransform: 'uppercase',
//       letterSpacing: 0.4,
//     },
//     progressTrack: {
//       marginTop: 10,
//       height: 8,
//       borderRadius: theme.radii.pill,
//       backgroundColor: theme.colors.surfaceTint,
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//       overflow: 'hidden',
//     },
//     progressFill: {
//       height: '100%',
//       borderRadius: theme.radii.pill,
//       backgroundColor: theme.colors.primary,
//     },
//   });

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useApp } from "../../appState/AppProvider";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { Icon } from "../../components/Icon";
import { Skeleton } from "../../components/Skeleton";
import { ScrollScreen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { SocietySwitcherCard } from "../../components/SocietySwitcherCard";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import type {
  Account,
  AccountLot,
  ExportCollectionRow,
} from "../../models/types";

import {
  getAccountCount,
  getAccountCountByLot,
  listAccountLots,
  listPendingCollections,
  searchAccountsByLastDigits,
} from "../../db/repo";

import { formatINR } from "../../utils/money";
import { useTheme } from "../../theme";
import type { Theme } from "../../theme";
import { lotKeyFromParts, lotLabel } from "../../utils/lots";
import { useClientNameLocalizer, useI18n } from "../../i18n";

const ALL_LOT_KEY = "__all__";

type LotOption = {
  key: string;
  label: string;
  count: number;
};

export function CollectScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent, activeLot, setActiveLot } = useApp();
  const { t } = useI18n();
  const localizeClientName = useClientNameLocalizer();

  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [digits, setDigits] = useState("");
  const [results, setResults] = useState<Account[]>([]);
  const [lots, setLots] = useState<AccountLot[]>([]);
  const [pendingEntries, setPendingEntries] = useState<ExportCollectionRow[]>(
    [],
  );
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lotSwitcherVisible, setLotSwitcherVisible] = useState(false);
  const [lotQuery, setLotQuery] = useState("");
  const [pendingLotSelection, setPendingLotSelection] =
    useState<string>(ALL_LOT_KEY);

  const refreshPending = useCallback(async () => {
    if (!db || !agent || !society) return;

    setLoading(true);

    try {
      const [allPending, accountCount, lotRows] = await Promise.all([
        listPendingCollections({
          db,
          societyId: society.id,
          agentId: agent.id,
        }),
        activeLot
          ? getAccountCountByLot(db, society.id, agent.id, activeLot)
          : getAccountCount(db, society.id, agent.id),
        listAccountLots(db, society.id, agent.id),
      ]);

      const visiblePending = activeLot
        ? allPending.filter(
            (entry) =>
              lotKeyFromParts(
                entry.accountHeadCode,
                entry.accountType,
                entry.frequency,
              ) === activeLot.key,
          )
        : allPending;

      setPendingEntries(visiblePending);
      setPendingTotal(
        visiblePending.reduce(
          (total, entry) => total + entry.collectedPaise,
          0,
        ),
      );
      setPendingCount(visiblePending.length);
      setTotalAccounts(accountCount);
      setLots(lotRows);
    } finally {
      setLoading(false);
    }
  }, [db, agent, society, activeLot]);

  useFocusEffect(
    useCallback(() => {
      void refreshPending();
    }, [refreshPending]),
  );

  const remainingCount = Math.max(totalAccounts - pendingCount, 0);

  /* ------------------ DEBOUNCED SEARCH ------------------ */

  useEffect(() => {
    if (!db || !society || !agent) return;

    const timer = setTimeout(async () => {
      if (!digits.trim()) {
        setResults([]);
        return;
      }

      const r = await searchAccountsByLastDigits(
        db,
        society.id,
        agent.id,
        digits,
      );

      setResults(r);
    }, 400); // debounce delay

    return () => clearTimeout(timer);
  }, [digits, db, society, agent]);

  /* ------------------ FILTER BY LOT ------------------ */

  const filteredResults = useMemo(() => {
    if (!activeLot) return results;

    return results.filter(
      (a) =>
        lotKeyFromParts(a.accountHeadCode, a.accountType, a.frequency) ===
        activeLot.key,
    );
  }, [results, activeLot]);

  const formatLotDisplayLabel = useCallback(
    (params: {
      accountHead?: string | null;
      accountHeadCode?: string | null;
      accountType: AccountLot["accountType"];
      frequency: AccountLot["frequency"];
    }): string => localizeClientName(lotLabel(params)),
    [localizeClientName],
  );

  const frequencyLabel = useCallback(
    (frequency: Account["frequency"]): string => {
      if (frequency === "DAILY") return t("import.category.daily");
      if (frequency === "MONTHLY") return t("import.category.monthly");
      return localizeClientName(frequency);
    },
    [localizeClientName, t],
  );

  const accountTypeLabel = useCallback(
    (accountType: Account["accountType"]): string => {
      if (accountType === "LOAN") return t("import.category.loan");
      return localizeClientName(accountType);
    },
    [localizeClientName, t],
  );

  const currentLotKey = activeLot?.key ?? ALL_LOT_KEY;
  const currentLotLabel = activeLot
    ? formatLotDisplayLabel(activeLot)
    : t("accounts.filter.allAccountTypes");
  const currentLotCount = activeLot
    ? (lots.find((lot) => lot.key === activeLot.key)?.count ?? 0)
    : lots.reduce((total, lot) => total + lot.count, 0);

  const lotOptions = useMemo<LotOption[]>(
    () => [
      {
        key: ALL_LOT_KEY,
        label: t("accounts.filter.allAccountTypes"),
        count: lots.reduce((total, lot) => total + lot.count, 0),
      },
      ...lots.map((lot) => ({
        key: lot.key,
        label: formatLotDisplayLabel({
          accountHead: lot.accountHead,
          accountHeadCode: lot.accountHeadCode,
          accountType: lot.accountType,
          frequency: lot.frequency,
        }),
        count: lot.count,
      })),
    ],
    [formatLotDisplayLabel, lots, t],
  );

  const filteredLotOptions = useMemo(() => {
    const q = lotQuery.trim().toLowerCase();
    if (!q) return lotOptions;
    return lotOptions.filter((option) =>
      `${option.label} ${option.key}`.toLowerCase().includes(q),
    );
  }, [lotOptions, lotQuery]);

  const openLotSwitcher = useCallback(() => {
    setPendingLotSelection(currentLotKey);
    setLotQuery("");
    setLotSwitcherVisible(true);
  }, [currentLotKey]);

  const closeLotSwitcher = useCallback(() => {
    setLotSwitcherVisible(false);
    setLotQuery("");
  }, []);

  const applyLotSelection = useCallback(async () => {
    const selectedKey = pendingLotSelection || currentLotKey;
    if (selectedKey === currentLotKey) {
      closeLotSwitcher();
      return;
    }
    if (selectedKey === ALL_LOT_KEY) {
      await setActiveLot(null);
      closeLotSwitcher();
      return;
    }
    const selected = lots.find((lot) => lot.key === selectedKey);
    if (!selected) {
      closeLotSwitcher();
      return;
    }
    await setActiveLot({
      key: selected.key,
      accountHead: selected.accountHead,
      accountHeadCode: selected.accountHeadCode,
      accountType: selected.accountType,
      frequency: selected.frequency,
    });
    closeLotSwitcher();
  }, [
    closeLotSwitcher,
    currentLotKey,
    lots,
    pendingLotSelection,
    setActiveLot,
  ]);

  const canApplyLotSelection = pendingLotSelection !== currentLotKey;

  const renderLotOption = useCallback(
    ({ item }: { item: LotOption }) => {
      const isCurrent = item.key === currentLotKey;
      const isSelected = item.key === pendingLotSelection;
      return (
        <Pressable
          onPress={() => setPendingLotSelection(item.key)}
          style={[
            styles.lotRow,
            isCurrent && styles.lotRowCurrent,
            isSelected && styles.lotRowSelected,
          ]}
        >
          <View style={styles.lotRowBody}>
            <Text style={styles.lotRowTitle} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.lotRowSub}>
              {t("collect.accountType.accountsCount", { count: item.count })}
            </Text>
          </View>
          <View
            style={[
              styles.lotRowBadge,
              isCurrent && styles.lotRowBadgeCurrent,
              isSelected && styles.lotRowBadgeSelected,
            ]}
          >
            <Text
              style={[
                styles.lotRowBadgeText,
                isCurrent && styles.lotRowBadgeTextCurrent,
                isSelected && styles.lotRowBadgeTextSelected,
              ]}
            >
              {isCurrent
                ? t("collect.accountType.current")
                : isSelected
                  ? t("collect.accountType.selected")
                  : t("collect.accountType.tap")}
            </Text>
          </View>
        </Pressable>
      );
    },
    [currentLotKey, pendingLotSelection, styles, t],
  );

  const collectionProgress =
    totalAccounts > 0 ? pendingCount / totalAccounts : 0;

  // const openAccount = (id: string) =>
  //   nav.navigate('AccountDetail', { accountId: id });

  const openAccount = (id: string) => {
    Keyboard.dismiss();
    nav.navigate("AccountDetail", { accountId: id });
  };
  const sortedPendingEntries = useMemo(() => {
    return [...pendingEntries].sort(
      (a, b) =>
        new Date(b.collectionDate).getTime() -
        new Date(a.collectionDate).getTime(),
    );
  }, [pendingEntries]);

  /* ------------------ UI ------------------ */

  return (
    <ScrollScreen>
      {/* SEARCH TOP */}
      <Card>
        <TextField
          label={t("collect.search.label")}
          value={digits}
          onChangeText={(v) => setDigits(v.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder={t("collect.search.placeholder")}
          leftIcon="search-outline"
        />
      </Card>

      {/* SEARCH RESULTS */}
      {digits ? (
        <Card>
          <SectionHeader
            title={t("collect.search.matchesTitle")}
            subtitle={t("collect.search.matchesSubtitle", { digits })}
            icon="list-outline"
          />

          <View style={{ height: 10 }} />

          {filteredResults.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title={t("collect.search.noMatchesTitle")}
              message={t("collect.search.noMatchesMessage")}
            />
          ) : (
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={filteredResults}
              keyExtractor={(a) => a.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => openAccount(item.id)}
                  style={styles.row}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.matchTop}>
                      <View style={styles.clientLine}>
                        <Icon
                          name="client"
                          size={15}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {localizeClientName(item.clientName)}
                        </Text>
                      </View>

                      <Text style={styles.accountChip}>{item.accountNo}</Text>
                    </View>

                    <Text style={styles.rowSub}>
                      {item.accountHead
                        ? localizeClientName(item.accountHead)
                        : accountTypeLabel(item.accountType)}{" "}
                      • {frequencyLabel(item.frequency)} • Balance{" "}
                      {formatINR(item.balancePaise)}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </Card>
      ) : null}

      <SocietySwitcherCard />

      {/* ACCOUNT TYPE */}
      <Card>
        <SectionHeader
          title={t("collect.accountType.title")}
          subtitle={t("collect.accountType.subtitle")}
          icon="layers-outline"
          right={
            <View style={styles.accountTypeActions}>
              <Pressable
                onPress={() =>
                  nav.navigate("ImportMasterData", { mode: "add" })
                }
                style={styles.accountTypeButton}
                accessibilityLabel={t("collect.accountType.accessibilityAdd")}
              >
                <Icon
                  name="add-circle-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.accountTypeButtonText}>
                  {t("collect.accountType.buttonAdd")}
                </Text>
              </Pressable>
              <Pressable
                onPress={openLotSwitcher}
                style={styles.accountTypeButton}
                accessibilityLabel={t(
                  "collect.accountType.accessibilityChange",
                )}
              >
                <Icon
                  name="swap-horizontal-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={styles.accountTypeButtonText}>
                  {t("collect.accountType.buttonChange")}
                </Text>
              </Pressable>
            </View>
          }
        />

        <View style={{ height: 10 }} />

        {loading ? (
          <Skeleton height={40} width="100%" />
        ) : (
          <View style={styles.selectedLotCard}>
            <View style={styles.selectedLotIcon}>
              <Icon
                name="layers-outline"
                size={16}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.selectedLotBody}>
              <Text style={styles.selectedLotLabel}>
                {t("collect.accountType.selected")}
              </Text>
              <Text style={styles.selectedLotName} numberOfLines={1}>
                {currentLotLabel}
              </Text>
            </View>
            <View style={styles.selectedLotCountChip}>
              <Text style={styles.selectedLotCountText}>{currentLotCount}</Text>
            </View>
          </View>
        )}
      </Card>

      <Modal
        transparent
        animationType="fade"
        visible={lotSwitcherVisible}
        onRequestClose={closeLotSwitcher}
      >
        <View style={styles.lotModalBackdrop}>
          <Pressable
            style={styles.lotModalDismiss}
            onPress={closeLotSwitcher}
          />
          <View style={styles.lotModalCard}>
            <Text style={styles.lotModalTitle}>
              {t("collect.accountType.modalTitle")}
            </Text>
            <Text style={styles.lotModalSubtitle}>
              {t("collect.accountType.modalCurrent", {
                label: currentLotLabel,
              })}
            </Text>

            <View style={styles.lotSearchRow}>
              <Icon
                name="search-outline"
                size={16}
                color={theme.colors.muted}
              />
              <TextInput
                value={lotQuery}
                onChangeText={setLotQuery}
                placeholder={t("collect.accountType.searchPlaceholder")}
                placeholderTextColor={theme.colors.muted}
                style={styles.lotSearchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.lotCountText}>
              {t("collect.accountType.optionsCount", {
                filtered: filteredLotOptions.length,
                total: lotOptions.length,
              })}
            </Text>

            {filteredLotOptions.length === 0 ? (
              <View style={styles.lotEmptyState}>
                <Text style={styles.lotEmptyStateText}>
                  {t("collect.accountType.noResults")}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredLotOptions}
                keyExtractor={(item) => item.key}
                renderItem={renderLotOption}
                style={styles.lotList}
                contentContainerStyle={styles.lotListContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                nestedScrollEnabled
                showsVerticalScrollIndicator
                initialNumToRender={10}
              />
            )}

            <View style={styles.lotModalActions}>
              <Button
                title={t("common.cancel")}
                variant="ghost"
                onPress={closeLotSwitcher}
                style={styles.lotActionButton}
              />
              <Button
                title={
                  canApplyLotSelection
                    ? t("collect.accountType.buttonApplySelect")
                    : t("collect.accountType.buttonAlreadySelected")
                }
                onPress={() => void applyLotSelection()}
                disabled={!canApplyLotSelection}
                iconLeft={
                  canApplyLotSelection ? "swap-horizontal-outline" : undefined
                }
                style={styles.lotActionButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* PENDING SUMMARY */}
      <Card>
        <SectionHeader
          title={t("collect.pending.title")}
          subtitle={t("collect.pending.subtitle")}
          icon="time-outline"
        />

        <View style={{ height: 10 }} />

        {loading ? (
          <Skeleton height={80} width="100%" />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{pendingCount}</Text>
                <Text style={styles.statLabel}>
                  {t("collect.pending.saved")}
                </Text>
              </View>

              <View style={styles.statTile}>
                <Text style={styles.statValue}>{remainingCount}</Text>
                <Text style={styles.statLabel}>
                  {t("collect.pending.remaining")}
                </Text>
              </View>

              <View style={styles.statTile}>
                <Text style={styles.statValue}>{formatINR(pendingTotal)}</Text>
                <Text style={styles.statLabel}>
                  {t("collect.pending.amount")}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(collectionProgress * 100)}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.kv}>
              {t("collect.pending.progress", {
                percent: Math.round(collectionProgress * 100),
                pendingCount,
                totalAccounts,
              })}
            </Text>

            <View style={{ height: 10 }} />

            {pendingEntries.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title={t("collect.pending.emptyTitle")}
                message={t("collect.pending.emptyMessage")}
              />
            ) : (
              <FlatList
                data={sortedPendingEntries}
                keyExtractor={(e) => e.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => openAccount(item.accountId)}
                    style={styles.row}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.pendingItemHeader}>
                        <View style={styles.pendingClientLine}>
                          <Icon
                            name="person-outline"
                            size={14}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.rowTitle}>
                            {localizeClientName(item.clientName)}
                          </Text>
                        </View>

                        <View style={styles.pendingAccountChip}>
                          <Icon
                            name="card-outline"
                            size={12}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.pendingAccountText}>
                            {item.accountNo}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.pendingDetails}>
                        <View style={styles.pendingDetailItem}>
                          <Icon
                            name="cash-outline"
                            size={12}
                            color={theme.colors.success}
                          />
                          <Text style={[styles.rowSub, styles.pendingAmount]}>
                            {formatINR(item.collectedPaise)}
                          </Text>
                        </View>

                        <View style={styles.pendingDetailItem}>
                          <Icon
                            name="calendar-outline"
                            size={12}
                            color={theme.colors.muted}
                          />
                          <Text style={styles.rowSub}>
                            {item.collectionDate}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </>
        )}
      </Card>
    </ScrollScreen>
  );
}

/* ------------------ STYLES ------------------ */

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { paddingVertical: 12 },
    matchTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    clientLine: { flexDirection: "row", alignItems: "center", gap: 6 },
    rowTitle: { fontSize: 15, fontWeight: "900", color: theme.colors.text },
    rowSub: { fontSize: 12, color: theme.colors.muted },
    sep: { height: 1, backgroundColor: theme.colors.border },

    accountChip: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
    },
    accountTypeActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    accountTypeButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    accountTypeButtonText: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.colors.primary,
    },
    selectedLotCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.sm + 2,
      backgroundColor: theme.colors.surfaceTint,
      paddingHorizontal: 10,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    selectedLotIcon: {
      width: 30,
      height: 30,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedLotBody: {
      flex: 1,
      minWidth: 0,
    },
    selectedLotLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    selectedLotName: {
      marginTop: 2,
      fontSize: 14,
      fontWeight: "900",
      color: theme.colors.text,
    },
    selectedLotCountChip: {
      minWidth: 34,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedLotCountText: {
      fontSize: 12,
      fontWeight: "900",
      color: theme.colors.primary,
    },
    lotModalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg,
    },
    lotModalDismiss: {
      ...StyleSheet.absoluteFillObject,
    },
    lotModalCard: {
      width: "100%",
      maxWidth: 460,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      ...theme.shadow.card,
    },
    lotModalTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: theme.colors.text,
    },
    lotModalSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.muted,
    },
    lotSearchRow: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radii.sm + 2,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    lotSearchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.text,
    },
    lotCountText: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.muted,
    },
    lotList: {
      marginTop: 8,
      maxHeight: 360,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    lotListContent: {
      padding: 8,
      gap: 8,
    },
    lotRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.sm + 2,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    lotRowCurrent: {
      borderColor: theme.colors.success,
      backgroundColor: theme.isDark
        ? "rgba(67,217,161,0.12)"
        : "rgba(22,163,74,0.08)",
    },
    lotRowSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 2,
    },
    lotRowBody: {
      flex: 1,
      minWidth: 0,
    },
    lotRowTitle: {
      fontSize: 14,
      fontWeight: "900",
      color: theme.colors.text,
    },
    lotRowSub: {
      marginTop: 2,
      fontSize: 12,
      color: theme.colors.muted,
    },
    lotRowBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    lotRowBadgeCurrent: {
      borderColor: theme.colors.success,
      backgroundColor: theme.isDark
        ? "rgba(67,217,161,0.2)"
        : "rgba(22,163,74,0.14)",
    },
    lotRowBadgeSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    lotRowBadgeText: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.colors.muted,
    },
    lotRowBadgeTextCurrent: {
      color: theme.colors.success,
    },
    lotRowBadgeTextSelected: {
      color: theme.colors.primary,
    },
    lotEmptyState: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.sm + 2,
      backgroundColor: theme.colors.surfaceTint,
      padding: 12,
    },
    lotEmptyStateText: {
      fontSize: 12,
      color: theme.colors.muted,
    },
    lotModalActions: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    lotActionButton: {
      flex: 1,
    },

    statsGrid: { flexDirection: "row", gap: 8 },
    statTile: {
      flex: 1,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statValue: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
    statLabel: { fontSize: 11, color: theme.colors.muted },

    progressTrack: {
      marginTop: 10,
      height: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceTint,
      overflow: "hidden",
    },
    progressFill: { height: "100%", backgroundColor: theme.colors.primary },

    kv: { marginTop: 6, fontSize: 13, color: theme.colors.text },

    // New styles for pending items with icons
    pendingItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    pendingClientLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    pendingAccountChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
    },
    pendingAccountText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    pendingDetails: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginLeft: 20, // Aligns with the client name icon
    },
    pendingDetailItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    pendingAmount: {
      fontWeight: "700",
      color: theme.colors.success,
    },
  });
