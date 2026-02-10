import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { TextField } from '../../components/TextField';
import type { RootStackParamList } from '../../navigation/types';
import type { Account } from '../../models/types';
import { listAccounts } from '../../db/repo';
import { theme } from '../../theme';
import { formatINR } from '../../utils/money';

export function AccountsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society } = useApp();
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!db || !society) return;
        const rows = await listAccounts(db, society.id, 2000);
        setAccounts(rows);
      })();
    }, [db, society])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.clientName.toLowerCase().includes(q) || a.accountNo.toLowerCase().includes(q)
    );
  }, [accounts, query]);

  const hasAccounts = accounts.length > 0;

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
      </Card>

      <Card style={{ flex: 1 }}>
        <SectionHeader title={`Accounts (${filtered.length})`} subtitle="Tap an account to view details." icon="people-outline" />
        <View style={{ height: 10 }} />
        {filtered.length === 0 ? (
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

const styles = StyleSheet.create({
  row: { paddingVertical: 10 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
  rowSub: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  rowMeta: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
});
