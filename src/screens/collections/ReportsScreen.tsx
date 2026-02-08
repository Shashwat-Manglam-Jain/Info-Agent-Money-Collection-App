import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useApp } from '../../app/AppProvider';
import { Card } from '../../components/Card';
import { ScrollScreen } from '../../components/Screen';
import { getCollectionTotalsForDate, getPendingExportCounts } from '../../db/repo';
import { toISODate } from '../../utils/dates';
import { formatINR } from '../../utils/money';
import { theme } from '../../theme';

export function ReportsScreen() {
  const { db, agent } = useApp();
  const today = useMemo(() => toISODate(new Date()), []);
  const [todayCount, setTodayCount] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [pendingCollections, setPendingCollections] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!db || !agent) return;
        const [totals, pending] = await Promise.all([
          getCollectionTotalsForDate({ db, agentId: agent.id, collectionDate: today }),
          getPendingExportCounts({ db, agentId: agent.id }),
        ]);
        setTodayCount(totals.count);
        setTodayTotal(totals.totalPaise);
        setPendingCollections(pending.collections);
        setPendingRequests(pending.openRequests);
      })();
    }, [agent, db, today])
  );

  return (
    <ScrollScreen>
      <Card>
        <Text style={styles.title}>Today ({today})</Text>
        <View style={{ height: 10 }} />
        <Text style={styles.kv}>Collections: {todayCount}</Text>
        <Text style={styles.kv}>Total Collected: {formatINR(todayTotal)}</Text>
      </Card>

      <Card>
        <Text style={styles.title}>Pending Sync</Text>
        <View style={{ height: 10 }} />
        <Text style={styles.kv}>Collections not exported: {pendingCollections}</Text>
        <Text style={styles.kv}>Account opening requests not exported: {pendingRequests}</Text>
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  kv: { marginTop: 6, fontSize: 14, color: theme.colors.text },
});
