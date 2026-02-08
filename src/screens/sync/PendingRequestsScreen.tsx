import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useApp } from '../../app/AppProvider';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import type { AccountOpenRequest } from '../../models/types';
import { listPendingOpenRequests } from '../../db/repo';
import { formatINR } from '../../utils/money';
import { theme } from '../../theme';

export function PendingRequestsScreen() {
  const { db, agent } = useApp();
  const [rows, setRows] = useState<AccountOpenRequest[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!db || !agent) return;
        const r = await listPendingOpenRequests({ db, agentId: agent.id });
        setRows(r);
      })();
    }, [agent, db])
  );

  return (
    <Screen>
      <Card style={{ flex: 1 }}>
        <SectionHeader title={`Pending Requests (${rows.length})`} subtitle="Requests are included in the next export." icon="list-outline" />
        <View style={{ height: 10 }} />
        {rows.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" title="No pending requests" message="You’re all caught up." />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(r) => r.id}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.rowTitle}>{item.clientName}</Text>
                <Text style={styles.rowSub}>
                  {item.accountType} • {item.frequency} • Installment {formatINR(item.installmentPaise)}
                </Text>
                <Text style={styles.rowSub}>Requested: {item.requestedAt}</Text>
              </View>
            )}
          />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 10 },
  rowTitle: { fontSize: 14, fontWeight: '900', color: theme.colors.text },
  rowSub: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
});
