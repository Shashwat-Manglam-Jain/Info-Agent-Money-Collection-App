import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScrollScreen } from '../../components/Screen';
import type { RootStackParamList } from '../../navigation/types';
import { importMasterData } from '../../sync/importMasterData';
import { getErrorMessage } from '../../utils/errors';
import { theme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportMasterData'>;

export function ImportMasterDataScreen({ navigation }: Props) {
  const { db } = useApp();
  const [busy, setBusy] = useState(false);

  const pickAndImport = async () => {
    if (!db) return;
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) throw new Error('No file selected');

      const text = await new File(asset.uri).text();
      const json = JSON.parse(text);
      const result = await importMasterData(db, json);

      Alert.alert(
        'Imported',
        `Society: ${result.societyCode}\nAgents: ${result.agentsUpserted}\nAccounts: ${result.accountsUpserted}`
      );
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert('Import failed', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollScreen>
      <Card>
        <Text style={styles.title}>Import Master Data</Text>
        <Text style={styles.hint}>
          Import Society + Agent + Client Account data (JSON) exported from your computer system.
        </Text>
      </Card>

      <Card>
        <Text style={styles.schemaTitle}>JSON schema (v1)</Text>
        <Text style={styles.schema}>
          {`{
  "schemaVersion": 1,
  "society": { "code": "S001", "name": "My Society" },
  "agents": [{ "code": "AG01", "name": "Agent Name", "phone": "999...", "pin": "1234" }],
  "accounts": [{
    "accountNo": "D-00001234",
    "clientName": "Client Name",
    "accountType": "PIGMY | LOAN | SAVINGS",
    "frequency": "DAILY | WEEKLY | MONTHLY",
    "installmentRupees": 50,
    "balanceRupees": 1250,
    "lastTxnAt": "2026-02-08T10:00:00.000Z",
    "openedAt": "2025-01-01",
    "closesAt": "2027-01-01"
  }]
}`}
        </Text>
      </Card>

      <Card>
        <View style={{ gap: 12 }}>
          <Button title={busy ? 'Importing…' : 'Pick JSON File & Import'} onPress={pickAndImport} disabled={busy} />
          <Button title="Back" variant="secondary" onPress={() => navigation.goBack()} disabled={busy} />
        </View>
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  hint: { marginTop: 6, fontSize: 13, color: theme.colors.muted },
  schemaTitle: { fontSize: 14, fontWeight: '900', color: theme.colors.text },
  schema: { marginTop: 8, fontSize: 12, color: theme.colors.text },
});
