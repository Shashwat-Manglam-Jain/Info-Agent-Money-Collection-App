import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { TextField } from '../../components/TextField';
import type { RootStackParamList } from '../../navigation/types';
import type { Account, CollectionEntry } from '../../models/types';
import { getCollectionTotalsForDate, listCollectionsForDate, searchAccountsByLastDigits } from '../../db/repo';
import { toISODate } from '../../utils/dates';
import { formatINR } from '../../utils/money';
import { theme } from '../../theme';

export function CollectScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent } = useApp();
  const [digits, setDigits] = useState('');
  const [results, setResults] = useState<Account[]>([]);
  const [searchedDigits, setSearchedDigits] = useState<string | null>(null);
  const [todayEntries, setTodayEntries] = useState<CollectionEntry[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  const today = useMemo(() => toISODate(new Date()), []);

  const refreshToday = useCallback(async () => {
    if (!db || !agent) return;
    const [entries, totals] = await Promise.all([
      listCollectionsForDate({ db, agentId: agent.id, collectionDate: today }),
      getCollectionTotalsForDate({ db, agentId: agent.id, collectionDate: today }),
    ]);
    setTodayEntries(entries);
    setTodayTotal(totals.totalPaise);
    setTodayCount(totals.count);
  }, [agent, db, today]);

  useFocusEffect(
    useCallback(() => {
      void refreshToday();
    }, [refreshToday])
  );

  const doSearch = useCallback(async () => {
    if (!db || !society) return;
    setSearchedDigits(digits);
    const r = await searchAccountsByLastDigits(db, society.id, digits);
    setResults(r);
  }, [db, digits, society]);

  const openAccount = (accountId: string) => nav.navigate('AccountDetail', { accountId });

  return (
    <ScrollScreen>
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
          {results.length === 0 ? (
            <EmptyState icon="search-outline" title="No matches" message="Try different digits or check the account number." />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(a) => a.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <Pressable onPress={() => openAccount(item.id)} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {item.accountNo} • {item.clientName}
                    </Text>
                    <Text style={styles.rowSub}>
                      {item.accountType} • {item.frequency} • Installment {formatINR(item.installmentPaise)}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </Card>
      ) : null}

      <Card>
        <SectionHeader
          title={`Today (${today})`}
          subtitle={`Entries: ${todayCount} • Total: ${formatINR(todayTotal)}`}
          icon="today-outline"
        />
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
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 10 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
  rowSub: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
});
