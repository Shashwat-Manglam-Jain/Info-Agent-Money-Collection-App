import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { File } from 'expo-file-system';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useApp } from '../../appState/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
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

const TXT_SAMPLE = `Society Name                         Date :- 19-01-2026
Agent Wise Client Account Report
Account Head:DAILY PIGMY ACCOUNT  007 Agent Name:Mr.GOURAV ... 00100005
----------------------------------------------------------------------
Ac No      Name                                Balance
----------------------------------------------------------------------
00700034   TUKARAM BHABUTRAO GAVALI             100.00
00700076   TULSHIDAS GULABCHAND SHARMA           50.00`;

const EXCEL_SAMPLE = `Society Name
Agent AC No : 100001
Agent Name : Mr.PRAKASH VITHOBA BIRGADE
Account Head : 7  DAILY PIGMY ACCOUNT 007
Date : 19/01/2026
Ac No     Name                          Installment Amount  Balance
00707313  YASH PRUTHVIRAJ WATKAR         100                 16000`;

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
        multiple: false,
      });

      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) throw new Error('No file selected');

      const isExcel = isExcelAsset(asset);
      const report = isExcel
        ? parseAgentReportExcel(await new File(asset.uri).base64())
        : parseAgentReportText(await new File(asset.uri).text());

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
                ? `Import only ${categoryText.toLowerCase()} file data. Existing matching data is replaced. PIN is set to 0000.`
                : 'Import agent report data shared by your admin. Existing matching data is replaced. PIN is set to 0000.'
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
        <SectionHeader title="Expected format" icon="code-slash-outline" subtitle="Swipe left/right to view full sample lines." />

        <View style={styles.sampleCard}>
          <View style={styles.sampleHead}>
            <Text style={styles.sampleTag}>TXT</Text>
            <Text style={styles.sampleTitle}>Daily report sample</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.sampleScrollContent}
          >
            <Text style={styles.schema} allowFontScaling={false}>
              {TXT_SAMPLE}
            </Text>
          </ScrollView>
        </View>

        <View style={styles.sampleCard}>
          <View style={styles.sampleHead}>
            <Text style={styles.sampleTag}>Excel</Text>
            <Text style={styles.sampleTitle}>Sheet rows sample</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.sampleScrollContent}
          >
            <Text style={styles.schema} allowFontScaling={false}>
              {EXCEL_SAMPLE}
            </Text>
          </ScrollView>
        </View>

        <Text style={styles.schemaNote}>Columns auto-align in export. Import accepts extra spaces.</Text>
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
            onPress={() => navigation.goBack()}
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
    sampleCard: {
      marginTop: 12,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
      overflow: 'hidden',
    },
    sampleHead: {
      paddingHorizontal: 11,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.primarySoft,
    },
    sampleTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radii.pill,
      fontSize: 11,
      fontWeight: '900',
      color: theme.colors.primary,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      letterSpacing: 0.2,
    },
    sampleTitle: { fontSize: 12, fontWeight: '800', color: theme.colors.text },
    sampleScrollContent: { padding: 10 },
    schema: {
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.text,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 10,
      backgroundColor: theme.colors.surface,
    },
    schemaNote: { marginTop: 9, fontSize: 12, color: theme.colors.muted, lineHeight: 17 },
    registered: { marginTop: 9, fontSize: 12, color: theme.colors.muted, lineHeight: 17 },
  });
