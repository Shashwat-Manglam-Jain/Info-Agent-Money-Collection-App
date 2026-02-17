import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { File } from 'expo-file-system';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useApp } from '../../appState/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { LoadingModal } from '../../components/LoadingModal';
import { PopupModal, type PopupAction } from '../../components/PopupModal';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { getAgentBySocietyAndCode, getRegistration, getSocietyByCode, listAccountLots } from '../../db/repo';
import type { ImportCategory, RootStackParamList } from '../../navigation/types';
import { DEFAULT_AGENT_PIN, importParsedReport } from '../../sync/importAgentReport';
import { parseAgentReportExcel } from '../../sync/parseAgentReportExcel';
import { parseAgentReportText, type ParsedAccount } from '../../sync/parseAgentReport';
import { getErrorMessage } from '../../utils/errors';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';
import { lotKeyFromParts, lotLabel } from '../../utils/lots';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportMasterData'>;

function categoryLabel(category: ImportCategory): string {
  if (category === 'daily') return 'Daily';
  if (category === 'monthly') return 'Monthly';
  return 'Loan';
}

function detectCategory(account: ParsedAccount): ImportCategory | null {
  if (account.accountType === 'LOAN') return 'loan';
  if (account.frequency === 'DAILY') return 'daily';
  if (account.frequency === 'MONTHLY') return 'monthly';
  return null;
}

function matchesCategory(account: ParsedAccount, category: ImportCategory): boolean {
  if (category === 'loan') return account.accountType === 'LOAN';
  if (category === 'daily') return account.accountType !== 'LOAN' && account.frequency === 'DAILY';
  return account.accountType !== 'LOAN' && account.frequency === 'MONTHLY';
}

function stripDataUrlPrefix(value: string): string {
  const trimmed = value.trim();
  const commaIndex = trimmed.indexOf(',');
  return commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : trimmed;
}

function decodeBase64Text(value: string): string {
  const rawBase64 = stripDataUrlPrefix(value);
  if (typeof atob !== 'function') throw new Error('Browser base64 decoder unavailable');
  const binary = atob(rawBase64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function readBlobAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected file'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to read selected file'));
        return;
      }
      resolve(stripDataUrlPrefix(reader.result));
    };
    reader.readAsDataURL(blob);
  });
}

async function readAssetText(asset: DocumentPickerAsset): Promise<string> {
  if (Platform.OS !== 'web') {
    return new File(asset.uri).text();
  }
  if (asset.file) return asset.file.text();
  if (asset.base64) return decodeBase64Text(asset.base64);
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error('Failed to read selected file');
  return response.text();
}

async function readAssetBase64(asset: DocumentPickerAsset): Promise<string> {
  if (Platform.OS !== 'web') {
    return new File(asset.uri).base64();
  }
  if (asset.base64) return stripDataUrlPrefix(asset.base64);
  if (asset.file) return readBlobAsBase64(asset.file);
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error('Failed to read selected file');
  return readBlobAsBase64(await response.blob());
}

export function ImportMasterDataScreen({ navigation, route }: Props) {
  const { db, signIn, agent, setActiveLot } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [busy, setBusy] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const [registration, setRegistration] = useState<{ societyName: string; agentName: string } | null>(null);
  const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);
  const mode = route.params?.mode ?? 'replace';
  const category = route.params?.category;
  const isAddMode = mode === 'add';
  const categoryText = category ? categoryLabel(category) : 'Account';

  useEffect(() => {
    if (!pendingNavigation || !agent) return;
    setPendingNavigation(false);
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [agent, navigation, pendingNavigation]);

  useEffect(() => {
    navigation.setOptions({
      title: category ? `Import ${categoryText} Data` : 'Import Account Data',
    });
  }, [category, categoryText, navigation]);

  useEffect(() => {
    if (!db) return;
    (async () => {
      const reg = await getRegistration(db);
      setRegistration(reg);
    })();
  }, [db]);

  const isExcelAsset = (asset: DocumentPickerAsset): boolean => {
    const name = asset.name?.toLowerCase() ?? '';
    const mime = asset.mimeType?.toLowerCase() ?? '';
    return (
      name.endsWith('.xls') ||
      name.endsWith('.xlsx') ||
      mime.includes('excel') ||
      mime.includes('spreadsheet') ||
      mime === 'application/vnd.ms-excel' ||
      mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  };

  const closePopup = () => setPopup(null);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: agent ? 'MainTabs' : 'Login' }] });
  };

  const showMessage = (title: string, message?: string, actions?: PopupAction[]) => {
    setPopup({
      title,
      message,
      actions: actions ?? [{ label: 'OK', onPress: closePopup }],
    });
  };

  const pickAndImport = async () => {
    if (!db) return;
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'text/*',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        copyToCacheDirectory: true,
        base64: Platform.OS === 'web',
        multiple: false,
      });

      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) throw new Error('No file selected');

      const isExcel = isExcelAsset(asset);
      const report = isExcel
        ? parseAgentReportExcel(await readAssetBase64(asset))
        : parseAgentReportText(await readAssetText(asset));

      const firstAccount = report.accounts[0];
      if (category && !matchesCategory(firstAccount, category)) {
        const detected = detectCategory(firstAccount);
        const detectedText = detected ? categoryLabel(detected) : 'a different';
        showMessage(
          'Wrong file selected',
          `This screen is for ${categoryText} data, but the selected file looks like ${detectedText} account data.\n\nPlease choose the correct file.`
        );
        return;
      }

      const newLotKey = lotKeyFromParts(firstAccount.accountHeadCode, firstAccount.accountType, firstAccount.frequency);
      const newLotLabel = lotLabel({
        accountHead: firstAccount.accountHead,
        accountHeadCode: firstAccount.accountHeadCode,
        accountType: firstAccount.accountType,
        frequency: firstAccount.frequency,
      });

      if (mode === 'add') {
        const existingSociety = await getSocietyByCode(db, report.societyCode);
        if (existingSociety) {
          const existingAgent = await getAgentBySocietyAndCode(db, existingSociety.id, report.agentCode);
          if (existingAgent) {
            const lots = await listAccountLots(db, existingSociety.id, existingAgent.id);
            if (lots.find((lot) => lot.key === newLotKey)) {
              showMessage(
                'Account type already loaded',
                `This account type is already loaded: ${newLotLabel}\n\nPlease select a different file (Daily/Monthly/Loan).`
              );
              return;
            }
          }
        }
      }

      const result = await importParsedReport(db, report, { replaceExisting: mode !== 'add' });

      const signedIn = await signIn({
        societyCode: result.societyCode,
        agentCode: result.agentCode,
        pin: DEFAULT_AGENT_PIN,
      });

      if (!signedIn) {
        showMessage(
          'Imported, but sign in failed',
          `Society: ${result.societyName} (${result.societyCode})\nAgent: ${result.agentCode}\nAccounts: ${result.accountsUpserted}\n\nTry signing in manually.`
        );
        return;
      }

      await setActiveLot({
        key: newLotKey,
        accountHead: firstAccount.accountHead,
        accountHeadCode: firstAccount.accountHeadCode,
        accountType: firstAccount.accountType,
        frequency: firstAccount.frequency,
      });

      showMessage(
        'Imported',
        `Society: ${result.societyName} (${result.societyCode})\nAgent: ${result.agentCode}\nAccounts: ${result.accountsUpserted}\nType: ${newLotLabel}`,
        [
          { label: 'Stay', variant: 'ghost', onPress: closePopup },
          { label: 'Open Dashboard', onPress: () => { closePopup(); setPendingNavigation(true); } },
        ]
      );
    } catch (e: unknown) {
      showMessage('Import failed', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollScreen>
      <Card>
        <SectionHeader
          title={isAddMode ? `Add ${categoryText} Data (TXT or Excel)` : `Import ${categoryText} Data (TXT or Excel)`}
          subtitle={
            isAddMode
              ? `Add a new ${categoryText.toLowerCase()} file. Existing data stays. PIN is set to 0000.`
              : category
                ? `Import only ${categoryText.toLowerCase()} file data. Existing data is kept, and collections are removed only after export. PIN is set to 0000.`
                : 'Import agent report data shared by your admin. Existing data is kept, and collections are removed only after export. PIN is set to 0000.'
          }
          icon="cloud-download-outline"
        />
        <Text style={styles.registered}>
          {registration
            ? `Registered: ${registration.societyName} • ${registration.agentName}`
            : 'Registration is optional. You can import without it.'}
        </Text>
      </Card>

      <Card>
        <SectionHeader
          title="Quick Import Guide"
          icon="sparkles-outline"
          subtitle="No fixed sample needed. The app auto-detects structure."
        />

        <View style={styles.guideHero}>
          <View style={styles.guideHeroIconWrap}>
            <Icon name="cloud-upload-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.guideHeroTitle}>
              {isAddMode ? `Add ${categoryText} records safely` : `Import ${categoryText} records in one step`}
            </Text>
            <Text style={styles.guideHeroText}>
              Pick a TXT/XLS/XLSX report and we automatically read headers, rows, and extra spaces.
            </Text>
          </View>
        </View>

        <View style={styles.formatRow}>
          <View style={styles.formatChip}>
            <Icon name="document-text-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.formatChipText}>TXT</Text>
          </View>
          <View style={styles.formatChip}>
            <Icon name="grid-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.formatChipText}>XLS</Text>
          </View>
          <View style={styles.formatChip}>
            <Icon name="grid-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.formatChipText}>XLSX</Text>
          </View>
        </View>

        <View style={styles.stepsList}>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Choose file</Text>
              <Text style={styles.stepText}>Select report shared by your admin from device storage.</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Auto-parse</Text>
              <Text style={styles.stepText}>The app validates account type and imports rows automatically.</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Start collecting</Text>
              <Text style={styles.stepText}>Open dashboard immediately after successful import.</Text>
            </View>
          </View>
        </View>

        <View style={styles.tipBox}>
          <Icon name="information-circle-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.tipText}>
            Import only {category ? `${categoryText.toLowerCase()} ` : ''}account files on this screen for best results.
          </Text>
        </View>
      </Card>

      <Card>
        <View style={{ gap: 12 }}>
          <Button
            title={
              busy
                ? 'Importing…'
                : isAddMode
                  ? `Pick ${categoryText} File & Add`
                  : `Pick ${categoryText} File & Import`
            }
            iconLeft="folder-open-outline"
            onPress={pickAndImport}
            disabled={busy}
          />
          <Button
            title="Refresh Session"
            variant="secondary"
            iconLeft="refresh-outline"
            onPress={() => {
              if (agent) {
                navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
              } else {
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }
            }}
            disabled={busy}
          />
          <Button
            title="Back"
            variant="ghost"
            iconLeft="arrow-back-outline"
            onPress={handleBack}
            disabled={busy}
          />
        </View>
      </Card>

      <PopupModal
        visible={!!popup}
        title={popup?.title ?? ''}
        message={popup?.message}
        actions={popup?.actions}
        onDismiss={closePopup}
      />
      <LoadingModal visible={busy && !popup} title="Importing file" message="Reading the TXT/Excel data…" />
    </ScrollScreen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    guideHero: {
      marginTop: 12,
      flexDirection: 'row',
      gap: 10,
      padding: 12,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
    },
    guideHeroIconWrap: {
      width: 32,
      height: 32,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    guideHeroTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.colors.text,
    },
    guideHeroText: {
      marginTop: 3,
      fontSize: 12,
      color: theme.colors.muted,
      lineHeight: 17,
    },
    formatRow: {
      marginTop: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    formatChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    formatChipText: {
      fontSize: 11,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: 0.2,
    },
    stepsList: {
      marginTop: 12,
      padding: 12,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
      gap: 10,
    },
    stepRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    stepBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    stepBadgeText: {
      fontSize: 12,
      fontWeight: '900',
      color: theme.colors.textOnDark,
      lineHeight: 12,
    },
    stepTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: theme.colors.text,
    },
    stepText: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 17,
      color: theme.colors.muted,
    },
    tipBox: {
      marginTop: 10,
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    tipText: { flex: 1, fontSize: 12, color: theme.colors.text, lineHeight: 17, fontWeight: '700' },
    registered: { marginTop: 9, fontSize: 12, color: theme.colors.muted, lineHeight: 17 },
  });
