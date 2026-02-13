import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useApp } from '../../appState/AppProvider';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
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
            listAccounts(db, society.id, agent.id, 2000),
            listCollectionsForDate({ db, societyId: society.id, agentId: agent.id, collectionDate: today }),
            listAccountLots(db, society.id, agent.id),
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
            <View style={styles.filterChipContent}>
              {filter === 'ALL' ? <Icon name="checkmark-circle" size={14} color={theme.colors.textOnDark} /> : null}
              <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>All ({baseAccounts.length})</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setFilter('COLLECTED')}
            style={[
              styles.filterChip,
              styles.filterChipCollected,
              filter === 'COLLECTED' && styles.filterChipCollectedActive,
            ]}
          >
            <View style={styles.filterChipContent}>
              {filter === 'COLLECTED' ? <Icon name="checkmark-circle" size={14} color={theme.colors.textOnDark} /> : null}
              <Text
                style={[
                  styles.filterText,
                  styles.filterTextCollected,
                  filter === 'COLLECTED' && styles.filterTextCollectedActive,
                ]}
              >
                Collected ({collectedCount})
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setFilter('REMAINING')}
            style={[
              styles.filterChip,
              styles.filterChipRemaining,
              filter === 'REMAINING' && styles.filterChipRemainingActive,
            ]}
          >
            <View style={styles.filterChipContent}>
              {filter === 'REMAINING' ? <Icon name="checkmark-circle" size={14} color={theme.colors.textOnDark} /> : null}
              <Text
                style={[
                  styles.filterText,
                  styles.filterTextRemaining,
                  filter === 'REMAINING' && styles.filterTextRemainingActive,
                ]}
              >
                Remaining ({remainingCount})
              </Text>
            </View>
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
                <View style={styles.rowCard}>
                  <View style={styles.clientRow}>
                    <Icon name="client" size={16} color={theme.colors.primary} />
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.clientName}
                    </Text>
                  </View>
                  <View style={styles.rowInfoLine}>
                    <Text style={styles.rowSub}>A/c: {item.accountNo}</Text>
                    <View style={[styles.statusChip, collectedIds.has(item.id) ? styles.statusChipDone : styles.statusChipPending]}>
                      <Text style={[styles.statusText, collectedIds.has(item.id) ? styles.statusTextDone : styles.statusTextPending]}>
                        {collectedIds.has(item.id) ? 'Collected' : 'Pending'}
                      </Text>
                    </View>
                  </View>
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
    row: {
      paddingVertical: 2,
    },
    rowCard: {
      minHeight: 94,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
      paddingVertical: 14,
      paddingHorizontal: 12,
      justifyContent: 'center',
    },
    clientRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7 },
    rowInfoLine: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    rowTitle: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '900', color: theme.colors.text },
    rowSub: { flex: 1, minWidth: 0, fontSize: 12, color: theme.colors.muted, fontWeight: '700' },
    rowMeta: { fontSize: 12, color: theme.colors.muted, marginTop: 6, lineHeight: 17 },
    statusChip: {
      minWidth: 86,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusChipDone: {
      backgroundColor: theme.isDark ? 'rgba(22,163,74,0.2)' : 'rgba(22,163,74,0.14)',
      borderColor: theme.colors.success,
    },
    statusChipPending: {
      backgroundColor: theme.isDark ? 'rgba(249,133,133,0.24)' : 'rgba(220,38,38,0.14)',
      borderColor: theme.colors.danger,
    },
    statusText: { fontSize: 11, fontWeight: '800' },
    statusTextDone: { color: theme.colors.success },
    statusTextPending: { color: theme.colors.danger },
    sep: { height: 8 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    filterChipContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    filterChipCollected: {
      backgroundColor: theme.isDark ? 'rgba(22,163,74,0.12)' : 'rgba(22,163,74,0.08)',
      borderColor: theme.colors.success,
    },
    filterChipCollectedActive: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
      borderWidth: 2,
    },
    filterChipRemaining: {
      backgroundColor: theme.isDark ? 'rgba(249,133,133,0.14)' : 'rgba(220,38,38,0.08)',
      borderColor: theme.colors.danger,
    },
    filterChipRemainingActive: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
      borderWidth: 2,
    },
    filterText: { fontSize: 12, fontWeight: '700', color: theme.colors.muted, letterSpacing: 0.1 },
    filterTextActive: { color: theme.colors.textOnDark, fontWeight: '800' },
    filterTextCollected: { color: theme.colors.success },
    filterTextCollectedActive: { color: theme.colors.textOnDark, fontWeight: '800' },
    filterTextRemaining: { color: theme.colors.danger, fontWeight: '800' },
    filterTextRemainingActive: { color: theme.colors.textOnDark, fontWeight: '800' },
  });
