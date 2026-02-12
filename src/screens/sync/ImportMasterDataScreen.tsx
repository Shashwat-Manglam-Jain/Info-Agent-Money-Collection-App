import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
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
import type { RootStackParamList } from '../../navigation/types';
import { DEFAULT_AGENT_PIN, importParsedReport } from '../../sync/importAgentReport';
import { parseAgentReportExcel } from '../../sync/parseAgentReportExcel';
import { parseAgentReportText } from '../../sync/parseAgentReport';
import { getErrorMessage } from '../../utils/errors';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';
import { lotKeyFromParts, lotLabel } from '../../utils/lots';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportMasterData'>;

export function ImportMasterDataScreen({ navigation, route }: Props) {
  const { db, signIn, agent, setActiveLot } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [busy, setBusy] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const [registration, setRegistration] = useState<{ societyName: string; agentName: string } | null>(null);
  const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);
  const mode = route.params?.mode ?? 'replace';
  const isAddMode = mode === 'add';

  useEffect(() => {
    if (!pendingNavigation || !agent) return;
    setPendingNavigation(false);
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [agent, navigation, pendingNavigation]);

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
          title={isAddMode ? 'Add Account Type (TXT or Excel)' : 'Import Daily Data (TXT or Excel)'}
          subtitle={
            isAddMode
              ? 'Add a new account type (Daily/Monthly/Loan). Existing data stays. PIN is set to 0000.'
              : 'Import the daily agent report file shared by your admin. This replaces old data. PIN is set to 0000.'
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
        <SectionHeader title="Expected format" icon="code-slash-outline" />
        <Text style={styles.schemaTitle}>TXT sample</Text>
        <Text style={styles.schema}>
          {`Society Name                         Date :- 19-01-2026
Agent Wise Client Account Report
Account Head:DAILY PIGMY ACCOUNT  007 Agent Name:Mr.GOURAV ... 00100005
----------------------------------------------------------------------
Ac No      Name                                Balance
----------------------------------------------------------------------
00700034   TUKARAM BHABUTRAO GAVALI             100.00
00700076   TULSHIDAS GULABCHAND SHARMA           50.00`}
        </Text>
        <Text style={styles.schemaTitle}>Excel sample</Text>
        <Text style={styles.schema}>
          {`Society Name
Agent AC No : 100001
Agent Name : Mr.PRAKASH VITHOBA BIRGADE
Account Head : 7  DAILY PIGMY ACCOUNT 007
Date : 19/01/2026
Ac No     Name                          Installment Amount  Balance
00707313  YASH PRUTHVIRAJ WATKAR         100                 16000`}
        </Text>
        <Text style={styles.schemaNote}>Columns auto-align in export. Import accepts extra spaces.</Text>
      </Card>

      <Card>
        <View style={{ gap: 12 }}>
          <Button
            title={busy ? 'Importing…' : isAddMode ? 'Pick TXT/Excel File & Add' : 'Pick TXT/Excel File & Import'}
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
    schemaTitle: { marginTop: 8, fontSize: 12, fontWeight: '800', color: theme.colors.text },
    schema: {
      marginTop: 6,
      fontSize: 12,
      lineHeight: 16,
      color: theme.colors.text,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radii.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: 10,
    },
    schemaNote: { marginTop: 8, fontSize: 12, color: theme.colors.muted },
    registered: { marginTop: 8, fontSize: 12, color: theme.colors.muted },
  });
