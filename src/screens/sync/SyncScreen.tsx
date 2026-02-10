import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { clearAllData, getPendingExportCounts } from '../../db/repo';
import type { RootStackParamList } from '../../navigation/types';
import { exportPendingAndShare } from '../../sync/exportPending';
import { getErrorMessage } from '../../utils/errors';
import { theme } from '../../theme';

export function SyncScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent, signOut } = useApp();
  const [pendingCollections, setPendingCollections] = useState(0);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(async () => {
    if (!db || !agent) return;
    const pending = await getPendingExportCounts({ db, agentId: agent.id });
    setPendingCollections(pending.collections);
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
        <SectionHeader title="Society" icon="business-outline" />
        <Text style={styles.kv}>{societyName}</Text>
        <Text style={styles.kv}>Agent: {agent?.code ?? '—'} • {agent?.name ?? '—'}</Text>
      </Card>

      <Card>
        <SectionHeader title="Pending" icon="time-outline" />
        <View style={{ height: 10 }} />
        <Text style={styles.kv}>Collections: {pendingCollections}</Text>
        <View style={{ height: 12 }} />
        <Button
          title={exporting ? 'Exporting…' : 'Export & Clear Data'}
          variant="secondary"
          disabled={exporting}
          iconLeft="share-outline"
          onPress={() => {
            if (!db || !society || !agent) return;
            Alert.alert(
              'Export & clear data',
              'After export, all local data will be removed and you will be logged out.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Continue',
                  style: 'destructive',
                  onPress: async () => {
                    setExporting(true);
                    try {
                      const result = await exportPendingAndShare({ db, society, agent });
                      if (!result) {
                        Alert.alert('Nothing to export', 'No pending collections.');
                        return;
                      }
                      await clearAllData(db);
                      await signOut();
                      Alert.alert(
                        'Exported',
                        `Collections: ${result.collections}\nFile: ${result.fileUri}\n\nLocal data cleared.`
                      );
                    } catch (e: unknown) {
                      Alert.alert('Export failed', getErrorMessage(e));
                    } finally {
                      setExporting(false);
                    }
                  },
                },
              ]
            );
          }}
        />
        <View style={{ height: 10 }} />
        <Button title="Import Daily Data" iconLeft="cloud-download-outline" onPress={() => nav.navigate('ImportMasterData')} />
      </Card>

      <Card>
        <Button title="Logout" variant="danger" iconLeft="log-out-outline" onPress={signOut} />
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  kv: { marginTop: 6, fontSize: 14, color: theme.colors.text },
});
