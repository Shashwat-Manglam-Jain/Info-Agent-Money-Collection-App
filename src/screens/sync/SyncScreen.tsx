import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../appState/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PopupModal, type PopupAction } from '../../components/PopupModal';
import { SocietySwitcherCard } from '../../components/SocietySwitcherCard';
import { Skeleton } from '../../components/Skeleton';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { clearClientDataByLots, getAccountCount, getPendingExportCounts } from '../../db/repo';
import type { RootStackParamList } from '../../navigation/types';
import { exportPendingAndShare, type ExportFormat } from '../../sync/exportPending';
import { getErrorMessage } from '../../utils/errors';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

export function SyncScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent, signOut } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [pendingCollections, setPendingCollections] = useState(0);
  const [accountCount, setAccountCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);

  const refresh = useCallback(async () => {
    if (!db || !agent || !society) return;
    setLoading(true);
    try {
      const [pending, count] = await Promise.all([
        getPendingExportCounts({ db, societyId: society.id, agentId: agent.id }),
        getAccountCount(db, society.id, agent.id),
      ]);
      setPendingCollections(pending.collections);
      setAccountCount(count);
    } finally {
      setLoading(false);
    }
  }, [agent, db, society]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const fileNameFromUri = (uri: string): string => {
    const parts = uri.split('/');
    return parts[parts.length - 1] || uri;
  };

  const closePopup = () => setPopup(null);

  const doExport = async (format: ExportFormat) => {
    if (!db || !society || !agent) return;
    setExporting(true);
    try {
      const result = await exportPendingAndShare({ db, society, agent, format });
      if (!result) {
        setPopup({
          title: 'Nothing to export',
          message: 'No pending collections.',
          actions: [{ label: 'OK', onPress: closePopup }],
        });
        return;
      }
      await clearClientDataByLots(
        db,
        society.id,
        agent.id,
        result.files.map((file) => file.lot)
      );

      const filesInfo = result.files
        .map((f) => `${f.lotCode ? `Lot ${f.lotCode}` : f.lotName}: ${fileNameFromUri(f.fileUri)}`)
        .join('\n');

      await refresh();

      setPopup({
        title: 'Exported',
        message: `Files: ${result.files.length}\n${filesInfo}\n\nClient data cleared for exported account types.`,
        actions: [{ label: 'OK', onPress: closePopup }],
      });
    } catch (e: unknown) {
      setPopup({
        title: 'Export failed',
        message: getErrorMessage(e),
        actions: [{ label: 'OK', onPress: closePopup }],
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollScreen>
      <SocietySwitcherCard />

      <Card>
        <SectionHeader title="Pending" icon="time-outline" />
        <View style={{ height: 10 }} />
        {loading ? (
          <View style={{ gap: 8 }}>
            <Skeleton height={12} width="55%" />
            <Skeleton height={12} width="45%" />
          </View>
        ) : (
          <>
            <Text style={styles.kv}>Collections: {pendingCollections}</Text>
            <Text style={styles.kv}>Clients loaded: {accountCount}</Text>
          </>
        )}
        <View style={{ height: 12 }} />
        <Button
          title={exporting ? 'Exporting…' : 'Export & Clear Data'}
          variant="secondary"
          disabled={exporting || loading}
          iconLeft="share-outline"
          onPress={() => {
            if (!db || !society || !agent) return;
            setPopup({
              title: 'Export format',
              message: 'Each account type will be exported as a separate lot. Choose the file format.',
              actions: [
                { label: 'Cancel', variant: 'ghost', onPress: closePopup },
                { label: 'Excel (default)', onPress: () => { closePopup(); void doExport('xlsx'); } },
                { label: 'Text (TXT)', variant: 'secondary', onPress: () => { closePopup(); void doExport('txt'); } },
              ],
            });
          }}
        />
        <View style={{ height: 10 }} />
        <Button
          title="Import Daily Data (TXT/Excel)"
          iconLeft="cloud-download-outline"
          onPress={() => nav.navigate('ImportMasterData')}
        />
      </Card>

      <Card>
        {accountCount === 0 ? (
          <Button
            title="Go to Login / Register"
            variant="secondary"
            iconLeft="log-in-outline"
            onPress={() => nav.navigate('Login')}
          />
        ) : null}
        <View style={{ height: accountCount === 0 ? 10 : 0 }} />
        <Button title="Logout" variant="danger" iconLeft="log-out-outline" onPress={signOut} />
      </Card>

      <PopupModal
        visible={!!popup}
        title={popup?.title ?? ''}
        message={popup?.message}
        actions={popup?.actions}
        onDismiss={closePopup}
      />
    </ScrollScreen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    kv: { marginTop: 6, fontSize: 14, color: theme.colors.text },
  });
