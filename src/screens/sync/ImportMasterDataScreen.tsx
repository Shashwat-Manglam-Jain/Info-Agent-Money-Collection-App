import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import type { RootStackParamList } from '../../navigation/types';
import { DEFAULT_AGENT_PIN, importAgentReportText } from '../../sync/importAgentReport';
import { getErrorMessage } from '../../utils/errors';
import { theme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportMasterData'>;

export function ImportMasterDataScreen({ navigation }: Props) {
  const { db, signIn } = useApp();
  const [busy, setBusy] = useState(false);

  const pickAndImport = async () => {
    if (!db) return;
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) throw new Error('No file selected');

      const text = await new File(asset.uri).text();
      const result = await importAgentReportText(db, text);

      const signedIn = await signIn({
        societyCode: result.societyCode,
        agentCode: result.agentCode,
        pin: DEFAULT_AGENT_PIN,
      });

      if (!signedIn) {
        Alert.alert(
          'Imported, but sign in failed',
          `Society: ${result.societyName} (${result.societyCode})\nAgent: ${result.agentCode}\nAccounts: ${result.accountsUpserted}\n\nTry signing in manually.`
        );
        return;
      }

      Alert.alert(
        'Imported',
        `Society: ${result.societyName} (${result.societyCode})\nAgent: ${result.agentCode}\nAccounts: ${result.accountsUpserted}`
      );
    } catch (e: unknown) {
      Alert.alert('Import failed', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollScreen>
      <Card>
        <SectionHeader
          title="Import Daily Data (TXT)"
          subtitle="Import the daily agent report text file shared by your admin. This replaces old data. PIN is set to 0000."
          icon="cloud-download-outline"
        />
      </Card>

      <Card>
        <SectionHeader title="Expected format" icon="code-slash-outline" />
        <Text style={styles.schema}>
          {`PRIYADARSHANI MAHILA CREDIT SOCIETY, karanja     Date :- 19-01-2026
main road - 442203
Agent Wise Client Account Report
Account Head:DAILY PIGMY ACCOUNT  007 Agent Name:Mr.GOURAV ... 00100005
----------------------------------------------------------------------
Ac No     Name                                       Balance
----------------------------------------------------------------------
00700034  TUKARAM BHABUTRAO GAVALI                    100.00`}
        </Text>
      </Card>

      <Card>
        <View style={{ gap: 12 }}>
          <Button
            title={busy ? 'Importing…' : 'Pick TXT File & Import'}
            iconLeft="folder-open-outline"
            onPress={pickAndImport}
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
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  schema: { marginTop: 8, fontSize: 12, color: theme.colors.text },
});
