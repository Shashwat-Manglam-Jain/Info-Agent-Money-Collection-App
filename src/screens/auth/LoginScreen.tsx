import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useEffect, useMemo, useState } from 'react';
import { AuthScreen } from '../../components/AuthScreen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PopupModal, type PopupAction } from '../../components/PopupModal';
import { SectionHeader } from '../../components/SectionHeader';
import { TextField } from '../../components/TextField';
import { useApp } from '../../app/AppProvider';
import { getRegistration, saveRegistration } from '../../db/repo';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';
export function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [societyName, setSocietyName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);

  useEffect(() => {
    if (!db) return;
    (async () => {
      const reg = await getRegistration(db);
      if (reg) {
        setSocietyName(reg.societyName);
        setAgentName(reg.agentName);
      }
    })();
  }, [db]);

  const closePopup = () => setPopup(null);

  const showMessage = (title: string, message?: string) => {
    setPopup({
      title,
      message,
      actions: [{ label: 'OK', onPress: closePopup }],
    });
  };

  const saveProfile = async () => {
    if (!db) return;
    const s = societyName.trim();
    const a = agentName.trim();
    if (!s || !a) {
      showMessage('Missing details', 'Enter society name and agent name exactly as in the admin file.');
      return;
    }
    setSaving(true);
    try {
      await saveRegistration(db, { societyName: s, agentName: a });
      showMessage('Saved', 'Registration updated on this device.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthScreen
      title="Import Daily Data"
      subtitle="Your admin sends a daily TXT or Excel file that contains the agent and client data."
      heroImageLabel="Import data illustration"
      footer={<Text style={styles.footerText}>Importing auto logs you in (PIN is set to 0000).</Text>}
    >
      <Card>
        <SectionHeader
          title="Register Device"
          subtitle="Use the same Society Name and Agent Name that appear in your admin file."
          icon="id-card-outline"
        />
        <View style={{ height: 10 }} />
        <TextField
          label="Society Name"
          value={societyName}
          onChangeText={setSocietyName}
          placeholder="e.g. PRIYADARSHANI MAHILA CREDIT SOCIETY, karanja"
          leftIcon="business-outline"
          autoCorrect={false}
        />
        <View style={{ height: 10 }} />
        <TextField
          label="Agent Name"
          value={agentName}
          onChangeText={setAgentName}
          placeholder="e.g. Mr.PRAKASH VITHOBA BIRGADE"
          leftIcon="person-outline"
          autoCorrect={false}
        />
        <View style={{ height: 12 }} />
        <Button
          title={saving ? 'Saving…' : 'Save Registration'}
          iconLeft="save-outline"
          onPress={saveProfile}
          disabled={saving}
        />
      </Card>
      <Card>
        <View style={{ gap: 12 }}>
          <Text style={styles.copy}>
            Daily import replaces all old data and signs you in automatically.
          </Text>
          <Button
            title="Pick TXT/Excel File & Import"
            iconLeft="cloud-download-outline"
            onPress={() => nav.navigate('ImportMasterData')}
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
    </AuthScreen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    copy: { fontSize: 13, color: theme.colors.muted, textAlign: 'center' },
    footerText: { textAlign: 'center', color: theme.colors.mutedOnDark, fontSize: 12 },
  });
