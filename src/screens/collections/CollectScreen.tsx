import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../appState/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { LotSelector } from '../../components/LotSelector';
import { Skeleton } from '../../components/Skeleton';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SocietySwitcherCard } from '../../components/SocietySwitcherCard';
import { TextField } from '../../components/TextField';
import type { RootStackParamList } from '../../navigation/types';
import type { Account, AccountLot, CollectionEntry } from '../../models/types';
import {
  getAccountCount,
  getAccountCountByLot,
  getCollectionTotalsForDate,
  getCollectionTotalsForDateByLot,
  listAccountLots,
  listCollectionsForDate,
  listCollectionsForDateByLot,
  searchAccountsByLastDigits,
} from '../../db/repo';
import { toISODate } from '../../utils/dates';
import { formatINR } from '../../utils/money';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';
import { lotKeyFromParts, lotLabel } from '../../utils/lots';

export function CollectScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent, activeLot, setActiveLot } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [digits, setDigits] = useState('');
  const [results, setResults] = useState<Account[]>([]);
  const [lots, setLots] = useState<AccountLot[]>([]);
  const [searchedDigits, setSearchedDigits] = useState<string | null>(null);
  const [todayEntries, setTodayEntries] = useState<CollectionEntry[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => toISODate(new Date()), []);

  const refreshToday = useCallback(async () => {
    if (!db || !agent || !society) return;
    setLoading(true);
    try {
      const [entries, totals, accountCount, lotRows] = activeLot
        ? await Promise.all([
            listCollectionsForDateByLot({
              db,
              societyId: society.id,
              agentId: agent.id,
              collectionDate: today,
              lot: activeLot,
            }),
            getCollectionTotalsForDateByLot({
              db,
              societyId: society.id,
              agentId: agent.id,
              collectionDate: today,
              lot: activeLot,
            }),
            getAccountCountByLot(db, society.id, agent.id, activeLot),
            listAccountLots(db, society.id, agent.id),
          ])
        : await Promise.all([
            listCollectionsForDate({ db, societyId: society.id, agentId: agent.id, collectionDate: today }),
            getCollectionTotalsForDate({ db, societyId: society.id, agentId: agent.id, collectionDate: today }),
            getAccountCount(db, society.id, agent.id),
            listAccountLots(db, society.id, agent.id),
          ]);
      setTodayEntries(entries);
      setTodayTotal(totals.totalPaise);
      setTodayCount(totals.count);
      setTotalAccounts(accountCount);
      setLots(lotRows);
      if (activeLot && !lotRows.find((lot) => lot.key === activeLot.key)) {
        await setActiveLot(null);
      }
    } finally {
      setLoading(false);
    }
  }, [agent, db, society, today, activeLot, setActiveLot]);

  const remainingCount = Math.max(totalAccounts - todayCount, 0);

  useFocusEffect(
    useCallback(() => {
      void refreshToday();
    }, [refreshToday])
  );

  const doSearch = useCallback(async () => {
    if (!db || !society || !agent) return;
    setSearchedDigits(digits);
    const r = await searchAccountsByLastDigits(db, society.id, agent.id, digits);
    setResults(r);
  }, [agent, db, digits, society]);

  const filteredResults = useMemo(() => {
    if (!activeLot) return results;
    return results.filter((a) => lotKeyFromParts(a.accountHeadCode, a.accountType, a.frequency) === activeLot.key);
  }, [activeLot, results]);

  const collectionProgress = totalAccounts > 0 ? Math.min(todayCount / totalAccounts, 1) : 0;

  const openAccount = (accountId: string) => nav.navigate('AccountDetail', { accountId });

  return (
    <ScrollScreen>
      <SocietySwitcherCard />

      <Card>
        <SectionHeader
          title="Account Type"
          subtitle={activeLot ? `Active: ${lotLabel(activeLot)}` : 'All account types'}
          icon="layers-outline"
          right={(
            <Pressable
              onPress={() => nav.navigate('ImportMasterData', { mode: 'add' })}
              style={styles.addButton}
              accessibilityLabel="Add account type"
            >
              <Icon name="add" size={18} color={theme.colors.primary} />
            </Pressable>
          )}
        />
        <View style={{ height: 10 }} />
        {loading && lots.length === 0 ? (
          <View style={{ gap: 8 }}>
            <Skeleton height={14} width="60%" />
            <Skeleton height={36} width="100%" />
          </View>
        ) : (
          <LotSelector lots={lots} activeLot={activeLot} onSelect={setActiveLot} />
        )}
      </Card>

      <Card>
        <SectionHeader
          title="Quick Collect"
          subtitle="Enter last digits of Account No to fetch details."
          icon="flash-outline"
        />
        <View style={{ height: 10 }} />
        <TextField
          label="Last Digits"
          value={digits}
          onChangeText={(v) => setDigits(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="e.g. 1234"
          leftIcon="keypad-outline"
          autoCorrect={false}
        />
        <View style={{ height: 12 }} />
        <Button title="Search" iconLeft="search-outline" onPress={doSearch} disabled={!digits.trim()} />
      </Card>

      {searchedDigits ? (
        <Card>
          <SectionHeader title="Matches" subtitle={`Account No ends with: ${searchedDigits}`} icon="list-outline" />
          <View style={{ height: 10 }} />
          {filteredResults.length === 0 ? (
            <EmptyState icon="search-outline" title="No matches" message="Try different digits or check the account number." />
          ) : (
            <FlatList
              data={filteredResults}
              keyExtractor={(a) => a.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <Pressable onPress={() => openAccount(item.id)} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.matchTop}>
                      <View style={styles.clientLine}>
                        <Icon name="client" size={15} color={theme.colors.primary} />
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {item.clientName}
                        </Text>
                      </View>
                      <Text style={styles.accountChip}>{item.accountNo}</Text>
                    </View>
                    <Text style={styles.rowSub}>
                      {(item.accountHead ?? item.accountType)} • {item.frequency} • Balance {formatINR(item.balancePaise)}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </Card>
      ) : null}

      <Card>
        <SectionHeader title={`Today (${today})`} subtitle="Daily progress summary" icon="today-outline" />
        <View style={{ height: 10 }} />
        {loading ? (
          <View style={{ gap: 10 }}>
            <View style={styles.statsGrid}>
              <Skeleton height={72} width="31%" />
              <Skeleton height={72} width="31%" />
              <Skeleton height={72} width="31%" />
            </View>
            <Skeleton height={8} width="100%" />
            <Skeleton height={42} width="100%" />
            <Skeleton height={42} width="100%" />
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{todayCount}</Text>
                <Text style={styles.statLabel}>Collected</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{remainingCount}</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{formatINR(todayTotal)}</Text>
                <Text style={styles.statLabel}>Amount</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(collectionProgress * 100)}%` }]} />
            </View>
            <Text style={styles.kv}>
              {Math.round(collectionProgress * 100)}% complete • {todayCount} / {totalAccounts} clients
            </Text>
            <View style={{ height: 10 }} />
            {todayEntries.length === 0 ? (
              <EmptyState icon="receipt-outline" title="No collections yet" message="Start with Quick Collect above." />
            ) : (
              <FlatList
                data={todayEntries}
                keyExtractor={(e) => e.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => (
                  <Pressable onPress={() => openAccount(item.accountId)} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{item.accountNo}</Text>
                      <Text style={styles.rowSub}>{formatINR(item.collectedPaise)}</Text>
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

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: theme.radii.sm,
    },
    matchTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    clientLine: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
    accountChip: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
    },
    rowTitle: { fontSize: 15, fontWeight: '900', color: theme.colors.text },
    rowSub: { fontSize: 12, color: theme.colors.muted, marginTop: 3, lineHeight: 17 },
    sep: { height: 1, backgroundColor: theme.colors.border },
    kv: { marginTop: 6, fontSize: 13, color: theme.colors.text, fontWeight: '600' },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceTint,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    statTile: {
      flex: 1,
      minHeight: 78,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
      paddingHorizontal: 11,
      paddingVertical: 10,
      justifyContent: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: 15,
      fontWeight: '900',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    progressTrack: {
      marginTop: 10,
      height: 8,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surfaceTint,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.primary,
    },
  });
