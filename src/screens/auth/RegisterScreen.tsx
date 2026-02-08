import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { setAgentPin } from '../../db/repo';
import { AuthScreen } from '../../components/AuthScreen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import type { RootStackParamList } from '../../navigation/types';
import { getErrorMessage } from '../../utils/errors';
import { theme } from '../../theme';

export function RegisterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db } = useApp();
  const [societyCode, setSocietyCode] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!db) return;
    const s = societyCode.trim();
    const a = agentCode.trim();
    if (!s || !a) {
      Alert.alert('Missing info', 'Society Code and Agent Code are required.');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('Weak PIN', 'PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('PIN mismatch', 'PIN and Confirm PIN must match.');
      return;
    }

    setBusy(true);
    try {
      const ok = await setAgentPin({ db, societyCode: s, agentCode: a, pin });
      if (!ok) {
        Alert.alert(
          'Not found',
          'Society/Agent not found. Import master data first, or check the codes.'
        );
        return;
      }
      Alert.alert('PIN set', 'You can now sign in with your new PIN.');
      nav.goBack();
    } catch (e: unknown) {
      Alert.alert('Failed', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      title="Register / Set PIN"
      subtitle="First time on this phone? Import master data, then set your PIN for secure login."
      footer={<Text style={styles.footerText}>PIN is stored securely on device and validated locally.</Text>}
    >
      <Card>
        <View style={{ gap: 12 }}>
          <TextField
            label="Society Code"
            value={societyCode}
            onChangeText={setSocietyCode}
            placeholder="e.g. S001"
            autoCapitalize="characters"
          />
          <TextField
            label="Agent Code"
            value={agentCode}
            onChangeText={setAgentCode}
            placeholder="e.g. AG01"
            autoCapitalize="characters"
          />
          <TextField
            label="New PIN"
            value={pin}
            onChangeText={(v) => setPin(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            secureTextEntry
            hint="Minimum 4 digits."
          />
          <TextField
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            secureTextEntry
          />

          <Button title="Save PIN" onPress={submit} loading={busy} />

          <View style={styles.actions}>
            <Button title="Import Data" variant="secondary" onPress={() => nav.navigate('ImportMasterData')} style={{ flex: 1 }} />
            <Button title="Back" variant="secondary" onPress={() => nav.goBack()} style={{ flex: 1 }} />
          </View>
        </View>
      </Card>

      <View style={{ height: 14 }} />

      <Card>
        <Text style={styles.hintTitle}>Tip</Text>
        <Text style={styles.hint}>
          If your Society provides a PIN in master data, you can skip registration and sign in directly.
        </Text>
      </Card>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  hintTitle: { fontSize: 14, fontWeight: '900', color: theme.colors.text },
  hint: { marginTop: 6, fontSize: 13, color: theme.colors.muted },
  footerText: { textAlign: 'center', color: theme.colors.mutedOnDark, fontSize: 12 },
});
