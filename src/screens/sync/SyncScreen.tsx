import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScrollScreen } from '../../components/Screen';
import { getPendingExportCounts } from '../../db/repo';
import type { RootStackParamList } from '../../navigation/types';
import { exportPendingAndShare } from '../../sync/exportPending';
import { getErrorMessage } from '../../utils/errors';
import { theme } from '../../theme';

export function SyncScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent, signOut } = useApp();
  const [pendingCollections, setPendingCollections] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(async () => {
    if (!db || !agent) return;
    const pending = await getPendingExportCounts({ db, agentId: agent.id });
    setPendingCollections(pending.collections);
    setPendingRequests(pending.openRequests);
  }, [agent, db]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const societyName = useMemo(() => society?.name ?? '—', [society?.name]);

  return (
    <ScrollScreen>
      <Card>
        <Text style={styles.title}>Society</Text>
        <Text style={styles.kv}>{societyName}</Text>
        <Text style={styles.kv}>Agent: {agent?.code ?? '—'} • {agent?.name ?? '—'}</Text>
      </Card>

      <Card>
        <Text style={styles.title}>Pending</Text>
        <View style={{ height: 10 }} />
        <Text style={styles.kv}>Collections: {pendingCollections}</Text>
        <Text style={styles.kv}>Account opening requests: {pendingRequests}</Text>
        <View style={{ height: 12 }} />
        <Button
          title={exporting ? 'Exporting…' : 'Export Pending'}
          variant="secondary"
          disabled={exporting}
          onPress={async () => {
            if (!db || !society || !agent) return;
            setExporting(true);
            try {
              const result = await exportPendingAndShare({ db, society, agent });
              if (!result) {
                Alert.alert('Nothing to export', 'No pending collections or requests.');
              } else {
                Alert.alert(
                  'Exported',
                  `Collections: ${result.collections}\nRequests: ${result.openRequests}\nFile: ${result.fileUri}`
                );
              }
              await refresh();
            } catch (e: unknown) {
              Alert.alert('Export failed', getErrorMessage(e));
            } finally {
              setExporting(false);
            }
          }}
        />
        <View style={{ height: 10 }} />
        <Button title="Import Master Data" onPress={() => nav.navigate('ImportMasterData')} />
        <View style={{ height: 10 }} />
        <Button title="New Account Request" onPress={() => nav.navigate('NewAccountRequest')} />
        <View style={{ height: 10 }} />
        <Button title="Pending Requests" variant="secondary" onPress={() => nav.navigate('PendingRequests')} />
      </Card>

      <Card>
        <Button title="Logout" variant="danger" onPress={signOut} />
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  kv: { marginTop: 6, fontSize: 14, color: theme.colors.text },
});
