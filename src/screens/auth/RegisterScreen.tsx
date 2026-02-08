import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { setAgentPin } from '../../db/repo';
import { AuthScreen } from '../../components/AuthScreen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { InlineAlert } from '../../components/InlineAlert';
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
  const [errors, setErrors] = useState<{ societyCode?: string; agentCode?: string; pin?: string; confirmPin?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    if (!db) return;
    const s = societyCode.trim();
    const a = agentCode.trim();
    setFormError(null);

    const next: { societyCode?: string; agentCode?: string; pin?: string; confirmPin?: string } = {};
    if (!s || !a) {
      if (!s) next.societyCode = 'Society Code is required.';
      if (!a) next.agentCode = 'Agent Code is required.';
    }
    if (pin.length < 4) {
      next.pin = 'PIN must be at least 4 digits.';
    }
    if (pin !== confirmPin) {
      next.confirmPin = 'PIN and Confirm PIN must match.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const ok = await setAgentPin({ db, societyCode: s, agentCode: a, pin });
      if (!ok) {
        setFormError('Society/Agent not found. Import master data first, or check the codes.');
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
          {formError ? <InlineAlert message={formError} /> : null}
          <TextField
            label="Society Code"
            value={societyCode}
            onChangeText={(v) => {
              setSocietyCode(v.toUpperCase());
              setErrors((e) => ({ ...e, societyCode: undefined }));
            }}
            placeholder="e.g. S001"
            autoCapitalize="characters"
            leftIcon="business-outline"
            error={errors.societyCode}
            disabled={busy}
            autoCorrect={false}
          />
          <TextField
            label="Agent Code"
            value={agentCode}
            onChangeText={(v) => {
              setAgentCode(v.toUpperCase());
              setErrors((e) => ({ ...e, agentCode: undefined }));
            }}
            placeholder="e.g. AG01"
            autoCapitalize="characters"
            leftIcon="person-outline"
            error={errors.agentCode}
            disabled={busy}
            autoCorrect={false}
          />
          <TextField
            label="New PIN"
            value={pin}
            onChangeText={(v) => {
              setPin(v.replace(/[^0-9]/g, ''));
              setErrors((e) => ({ ...e, pin: undefined }));
            }}
            keyboardType="number-pad"
            secureTextEntry
            allowReveal
            hint="Minimum 4 digits."
            leftIcon="key-outline"
            error={errors.pin}
            disabled={busy}
            autoCorrect={false}
          />
          <TextField
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={(v) => {
              setConfirmPin(v.replace(/[^0-9]/g, ''));
              setErrors((e) => ({ ...e, confirmPin: undefined }));
            }}
            keyboardType="number-pad"
            secureTextEntry
            allowReveal
            leftIcon="checkmark-circle-outline"
            error={errors.confirmPin}
            disabled={busy}
            autoCorrect={false}
          />

          <Button title="Save PIN" iconLeft="save-outline" onPress={submit} loading={busy} />

          <View style={styles.actions}>
            <Button
              title="Import Data"
              variant="ghost"
              iconLeft="cloud-download-outline"
              onPress={() => nav.navigate('ImportMasterData')}
              style={{ flex: 1 }}
              disabled={busy}
            />
            <Button
              title="Back"
              variant="ghost"
              iconLeft="arrow-back-outline"
              onPress={() => nav.goBack()}
              style={{ flex: 1 }}
              disabled={busy}
            />
          </View>
        </View>
      </Card>

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
