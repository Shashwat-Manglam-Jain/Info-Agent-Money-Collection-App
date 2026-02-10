import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useApp } from '../../app/AppProvider';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { TextField } from '../../components/TextField';
import type { Account } from '../../models/types';
import { listAccountLots, listAccounts, listCollectionsForDate } from '../../db/repo';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';
import { formatINR } from '../../utils/money';
import { toISODate } from '../../utils/dates';
import { lotKeyFromParts, lotLabel } from '../../utils/lots';

export function AccountsScreen() {
  const nav = useNavigation<any>();
  const { db, society, agent, activeLot, setActiveLot } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'COLLECTED' | 'REMAINING'>('ALL');
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());
  const today = useMemo(() => toISODate(new Date()), []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!db || !society || !agent) return;
        setLoading(true);
        try {
          const [rows, collected, lotRows] = await Promise.all([
            listAccounts(db, society.id, 2000),
            listCollectionsForDate({ db, agentId: agent.id, collectionDate: today }),
            listAccountLots(db, society.id),
          ]);
          setAccounts(rows);
          setCollectedIds(new Set(collected.map((c) => c.accountId)));
          if (activeLot && !lotRows.find((lot) => lot.key === activeLot.key)) {
            await setActiveLot(null);
          }
        } finally {
          setLoading(false);
        }
      })();
    }, [agent, db, society, today, activeLot, setActiveLot])
  );

  const baseAccounts = useMemo(() => {
    if (!activeLot) return accounts;
    return accounts.filter((a) => {
      const key = lotKeyFromParts(a.accountHeadCode, a.accountType, a.frequency);
      return key === activeLot.key;
    });
  }, [accounts, activeLot]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = baseAccounts;
    if (filter === 'COLLECTED') {
      base = base.filter((a) => collectedIds.has(a.id));
    } else if (filter === 'REMAINING') {
      base = base.filter((a) => !collectedIds.has(a.id));
    }
    if (!q) return base;
    return base.filter(
      (a) => a.clientName.toLowerCase().includes(q) || a.accountNo.toLowerCase().includes(q)
    );
  }, [baseAccounts, collectedIds, filter, query]);

  const hasAccounts = accounts.length > 0;
  const collectedCount = baseAccounts.filter((a) => collectedIds.has(a.id)).length;
  const remainingCount = Math.max(baseAccounts.length - collectedCount, 0);

  return (
    <Screen>
      <Card>
        <TextField
          label="Search Accounts"
          value={query}
          onChangeText={setQuery}
          placeholder="Name or Account No"
          leftIcon="search-outline"
        />
        <View style={{ height: 10 }} />
        <SectionHeader
          title="Filter"
          subtitle={`${today} • ${activeLot ? lotLabel(activeLot) : 'All account types'}`}
          icon="filter-outline"
        />
        <View style={{ height: 10 }} />
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setFilter('ALL')}
            style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>All ({baseAccounts.length})</Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('COLLECTED')}
            style={[styles.filterChip, filter === 'COLLECTED' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === 'COLLECTED' && styles.filterTextActive]}>
              Collected ({collectedCount})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('REMAINING')}
            style={[styles.filterChip, filter === 'REMAINING' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === 'REMAINING' && styles.filterTextActive]}>
              Remaining ({remainingCount})
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card style={{ flex: 1 }}>
        <SectionHeader
          title={`Accounts (${filtered.length})`}
          subtitle="Tap an account to view details."
          icon="people-outline"
        />
        <View style={{ height: 10 }} />
        {loading && accounts.length === 0 ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </View>
        ) : filtered.length === 0 ? (
          hasAccounts ? (
            <EmptyState icon="search-outline" title="No matches" message="Try a different name or account number." />
          ) : (
            <EmptyState
              icon="person-circle-outline"
              title="No accounts yet"
              message="Import the daily TXT file from Sync to see client accounts."
            />
          )
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(a) => a.id}
            style={{ flex: 1 }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => (
              <Pressable onPress={() => nav.navigate('AccountDetail', { accountId: item.id })} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.clientName}</Text>
                  <Text style={styles.rowSub}>{item.accountNo}</Text>
                  <Text style={styles.rowMeta}>
                    {(item.accountHead ?? item.accountType)} • {item.frequency} • Balance {formatINR(item.balancePaise)}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </Card>
    </Screen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { paddingVertical: 10 },
    rowTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
    rowSub: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
    rowMeta: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: theme.radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
    },
    filterText: { fontSize: 12, fontWeight: '700', color: theme.colors.muted },
    filterTextActive: { color: theme.colors.primary },
  });
