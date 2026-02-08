import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { AuthScreen } from '../../components/AuthScreen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { InlineAlert } from '../../components/InlineAlert';
import { TextField } from '../../components/TextField';
import type { RootStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
import { getErrorMessage } from '../../utils/errors';

const DEMO = { societyCode: 'DEMO', agentCode: 'AG001', pin: '1234' } as const;

export function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useApp();
  const [societyCode, setSocietyCode] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ societyCode?: string; agentCode?: string; pin?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isDemo = useMemo(
    () =>
      societyCode.trim().toUpperCase() === DEMO.societyCode &&
      agentCode.trim().toUpperCase() === DEMO.agentCode &&
      pin.trim() === DEMO.pin,
    [agentCode, pin, societyCode]
  );

  const validate = (): boolean => {
    const next: { societyCode?: string; agentCode?: string; pin?: string } = {};
    if (!societyCode.trim()) next.societyCode = 'Society Code is required.';
    if (!agentCode.trim()) next.agentCode = 'Agent Code is required.';
    if (pin.trim().length < 4) next.pin = 'PIN must be at least 4 digits.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignIn = async () => {
    setFormError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      const ok = await signIn({ societyCode, agentCode, pin });
      if (!ok) {
        setFormError('Sign in failed. Check Society Code, Agent Code, and PIN.');
      }
    } catch (e: unknown) {
      Alert.alert('Sign in failed', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      title="Sign In"
      subtitle="Sign in with your Society + Agent codes to start collections."
      heroImageLabel="Sign in illustration"
      footer={
        <Text style={styles.footerText}>
          {isDemo
            ? 'Demo credentials filled — tap Sign In.'
            : 'First time? Import master data, or tap “Fill Demo Credentials”.'}
        </Text>
      }
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
            hint="Provided by your society."
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
            hint="Provided by your society."
            leftIcon="person-outline"
            error={errors.agentCode}
            disabled={busy}
            autoCorrect={false}
          />
          <TextField
            label="PIN"
            value={pin}
            onChangeText={(v) => {
              setPin(v.replace(/[^0-9]/g, ''));
              setErrors((e) => ({ ...e, pin: undefined }));
            }}
            keyboardType="number-pad"
            secureTextEntry
            allowReveal
            hint="Set / reset your PIN from Register."
            leftIcon="key-outline"
            error={errors.pin}
            disabled={busy}
            autoCorrect={false}
          />

          <Button title="Sign In" iconLeft="log-in-outline" onPress={handleSignIn} loading={busy} />

          <View style={styles.actions}>
            <Button
              title="Register"
              variant="ghost"
              iconLeft="person-add-outline"
              onPress={() => nav.navigate('Register')}
              style={{ flex: 1 }}
              disabled={busy}
            />
            <Button
              title="Import Data"
              variant="ghost"
              iconLeft="cloud-download-outline"
              onPress={() => nav.navigate('ImportMasterData')}
              style={{ flex: 1 }}
              disabled={busy}
            />
          </View>
        </View>
      </Card>

      <Card style={styles.demoCard}>
        <View style={styles.demoHeader}>
          <Icon name="sparkles-outline" size={20} color={theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hintTitle}>Demo (seeded)</Text>
            <Text style={styles.hint}>Society: DEMO • Agent: AG001 • PIN: 1234</Text>
          </View>
        </View>
        <View style={{ height: 10 }} />
        <Button
          title="Fill Demo Credentials"
          variant="ghost"
          iconLeft="flash-outline"
          onPress={() => {
            setFormError(null);
            setErrors({});
            setSocietyCode(DEMO.societyCode);
            setAgentCode(DEMO.agentCode);
            setPin(DEMO.pin);
          }}
          disabled={busy}
        />
      </Card>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  demoCard: { backgroundColor: theme.colors.appBg },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hintTitle: { fontSize: 14, fontWeight: '900', color: theme.colors.text },
  hint: { marginTop: 6, fontSize: 13, color: theme.colors.muted },
  footerText: { textAlign: 'center', color: theme.colors.mutedOnDark, fontSize: 12 },
});
