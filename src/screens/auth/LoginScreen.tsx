import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { AuthScreen } from '../../components/AuthScreen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import type { RootStackParamList } from '../../navigation/types';
import { theme } from '../../theme';

export function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useApp();
  const [societyCode, setSocietyCode] = useState('DEMO');
  const [agentCode, setAgentCode] = useState('AG001');
  const [pin, setPin] = useState('1234');
  const [busy, setBusy] = useState(false);

  const isDemo = useMemo(
    () =>
      societyCode.trim().toUpperCase() === 'DEMO' &&
      agentCode.trim().toUpperCase() === 'AG001' &&
      pin.trim() === '1234',
    [agentCode, pin, societyCode]
  );

  const handleSignIn = async () => {
    setBusy(true);
    try {
      const ok = await signIn({ societyCode, agentCode, pin });
      if (!ok) {
        Alert.alert('Sign in failed', 'Check Society Code, Agent Code, and PIN.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      title="Sign In"
      subtitle="Enter your Society Code and Agent Code, then collect money in real time."
      footer={
        <Text style={styles.footerText}>
          {isDemo ? 'Demo is ready — you can sign in now.' : 'Need data? Import master data from Sync / Login.'}
        </Text>
      }
    >
      <Card>
        <View style={{ gap: 12 }}>
          <TextField
            label="Society Code"
            value={societyCode}
            onChangeText={setSocietyCode}
            placeholder="e.g. S001"
            autoCapitalize="characters"
            hint="Provided by your society."
          />
          <TextField
            label="Agent Code"
            value={agentCode}
            onChangeText={setAgentCode}
            placeholder="e.g. AG01"
            autoCapitalize="characters"
            hint="Provided by your society."
          />
          <TextField
            label="PIN"
            value={pin}
            onChangeText={(v) => setPin(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            secureTextEntry
            hint="Set / reset your PIN from Register."
          />

          <Button title="Sign In" onPress={handleSignIn} loading={busy} />

          <View style={styles.actions}>
            <Button
              title="Register / Set PIN"
              variant="secondary"
              onPress={() => nav.navigate('Register')}
              style={{ flex: 1 }}
            />
            <Button title="Import Data" variant="secondary" onPress={() => nav.navigate('ImportMasterData')} style={{ flex: 1 }} />
          </View>
        </View>
      </Card>

      <View style={{ height: 14 }} />

      <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <Text style={styles.hintTitle}>Demo (seeded)</Text>
        <Text style={styles.hint}>Society: DEMO • Agent: AG001 • PIN: 1234</Text>
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
