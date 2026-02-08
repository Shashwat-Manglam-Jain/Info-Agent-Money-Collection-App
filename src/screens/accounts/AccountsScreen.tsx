import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import type { RootStackParamList } from '../../navigation/types';
import type { Account } from '../../models/types';
import { listAccounts } from '../../db/repo';
import { theme } from '../../theme';

export function AccountsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society } = useApp();
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!db || !society) return;
        const rows = await listAccounts(db, society.id, 500);
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

  return (
    <Screen>
      <Card>
        <TextField label="Search Accounts" value={query} onChangeText={setQuery} placeholder="Name or Account No" />
      </Card>

      <View style={{ height: 12 }} />

      <Card style={{ flex: 1 }}>
        <Text style={styles.title}>Accounts ({filtered.length})</Text>
        <View style={{ height: 10 }} />
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No accounts.</Text>
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
  title: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  empty: { fontSize: 14, color: theme.colors.muted },
  row: { paddingVertical: 10 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
  rowSub: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
});
