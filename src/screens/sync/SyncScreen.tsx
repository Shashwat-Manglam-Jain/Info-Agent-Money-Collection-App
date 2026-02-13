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
import type { ImportCategory, RootStackParamList } from '../../navigation/types';
import { exportPendingAndShare, type ExportCategory, type ExportFormat } from '../../sync/exportPending';
import { getErrorMessage } from '../../utils/errors';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

const exportCategories: ExportCategory[] = ['daily', 'monthly', 'loan'];

function categoryLabel(category: ExportCategory | ImportCategory): string {
  if (category === 'daily') return 'Daily';
  if (category === 'monthly') return 'Monthly';
  return 'Loan';
}

export function SyncScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent, signOut } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [pendingCollections, setPendingCollections] = useState(0);
  const [pendingDaily, setPendingDaily] = useState(0);
  const [pendingMonthly, setPendingMonthly] = useState(0);
  const [pendingLoan, setPendingLoan] = useState(0);
  const [accountCount, setAccountCount] = useState(0);
  const [exportingCategory, setExportingCategory] = useState<ExportCategory | null>(null);
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
      setPendingDaily(pending.daily);
      setPendingMonthly(pending.monthly);
      setPendingLoan(pending.loan);
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

  const pendingCountFor = (category: ExportCategory): number => {
    if (category === 'daily') return pendingDaily;
    if (category === 'monthly') return pendingMonthly;
    return pendingLoan;
  };

  const doExport = async (format: ExportFormat, category: ExportCategory) => {
    if (!db || !society || !agent) return;
    setExportingCategory(category);
    try {
      const result = await exportPendingAndShare({ db, society, agent, format, category });
      if (!result) {
        setPopup({
          title: 'Nothing to export',
          message: `No pending ${categoryLabel(category)} collections.`,
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
        title: `${categoryLabel(category)} Exported`,
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
      setExportingCategory(null);
    }
  };

  const openExportPopup = (category: ExportCategory) => {
    if (!db || !society || !agent) return;
    const count = pendingCountFor(category);
    if (count === 0) {
      setPopup({
        title: 'Nothing to export',
        message: `No pending ${categoryLabel(category)} collections.`,
        actions: [{ label: 'OK', onPress: closePopup }],
      });
      return;
    }
    setPopup({
      title: `${categoryLabel(category)} Export Format`,
      message: `Choose format for ${categoryLabel(category)} export (${count} collections).`,
      actions: [
        { label: 'Cancel', variant: 'ghost', onPress: closePopup },
        {
          label: 'Excel (default)',
          onPress: () => {
            closePopup();
            void doExport('xlsx', category);
          },
        },
        {
          label: 'Text (TXT)',
          variant: 'secondary',
          onPress: () => {
            closePopup();
            void doExport('txt', category);
          },
        },
        {
          label: 'PDF',
          variant: 'secondary',
          onPress: () => {
            closePopup();
            void doExport('pdf', category);
          },
        },
      ],
    });
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
            <Skeleton height={12} width="50%" />
            <Skeleton height={12} width="40%" />
            <Skeleton height={12} width="45%" />
          </View>
        ) : (
          <View style={styles.pendingGrid}>
            <View style={styles.pendingTile}>
              <Text style={styles.pendingValue}>{pendingCollections}</Text>
              <Text style={styles.pendingLabel}>Collections</Text>
            </View>
            <View style={styles.pendingTile}>
              <Text style={styles.pendingValue}>{pendingDaily}</Text>
              <Text style={styles.pendingLabel}>Daily</Text>
            </View>
            <View style={styles.pendingTile}>
              <Text style={styles.pendingValue}>{pendingMonthly}</Text>
              <Text style={styles.pendingLabel}>Monthly</Text>
            </View>
            <View style={styles.pendingTile}>
              <Text style={styles.pendingValue}>{pendingLoan}</Text>
              <Text style={styles.pendingLabel}>Loan</Text>
            </View>
            <View style={styles.pendingTileWide}>
              <Text style={styles.pendingValue}>{accountCount}</Text>
              <Text style={styles.pendingLabel}>Clients Loaded</Text>
            </View>
          </View>
        )}
      </Card>

      <Card>
        <SectionHeader
          title="Export Separately"
          subtitle="Export Daily, Monthly, and Loan files separately."
          icon="share-outline"
        />
        <View style={{ height: 10 }} />
        {exportCategories.map((category) => (
          <View key={category} style={styles.rowGap}>
            <Button
              title={
                exportingCategory === category
                  ? 'Exporting…'
                  : `Export ${categoryLabel(category)} (${pendingCountFor(category)})`
              }
              variant="secondary"
              disabled={loading || !!exportingCategory || pendingCountFor(category) === 0}
              iconLeft="share-outline"
              onPress={() => openExportPopup(category)}
            />
          </View>
        ))}
      </Card>

      <Card>
        <SectionHeader
          title="Import Separately"
          subtitle="Choose the exact file type to avoid confusion."
          icon="cloud-download-outline"
        />
        <View style={{ height: 10 }} />
        <View style={styles.rowGap}>
          <Button
            title="Import Daily File (TXT/Excel)"
            iconLeft="cloud-download-outline"
            onPress={() => nav.navigate('ImportMasterData', { mode: 'replace', category: 'daily' })}
          />
        </View>
        <View style={styles.rowGap}>
          <Button
            title="Import Monthly File (TXT/Excel)"
            variant="secondary"
            iconLeft="cloud-download-outline"
            onPress={() => nav.navigate('ImportMasterData', { mode: 'replace', category: 'monthly' })}
          />
        </View>
        <View style={styles.rowGap}>
          <Button
            title="Import Loan File (TXT/Excel)"
            variant="secondary"
            iconLeft="cloud-download-outline"
            onPress={() => nav.navigate('ImportMasterData', { mode: 'replace', category: 'loan' })}
          />
        </View>
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
    pendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pendingTile: {
      width: '48%',
      minHeight: 76,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
      paddingHorizontal: 10,
      paddingVertical: 10,
      justifyContent: 'center',
      gap: 3,
    },
    pendingTileWide: {
      width: '100%',
      minHeight: 76,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
      paddingHorizontal: 10,
      paddingVertical: 10,
      justifyContent: 'center',
      gap: 3,
    },
    pendingValue: {
      fontSize: 16,
      fontWeight: '900',
      color: theme.colors.text,
    },
    pendingLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.muted,
      letterSpacing: 0.35,
      textTransform: 'uppercase',
    },
    rowGap: { marginTop: 10 },
  });
