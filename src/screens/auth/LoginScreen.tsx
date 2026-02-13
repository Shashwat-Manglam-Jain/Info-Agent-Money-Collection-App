import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../appState/AppProvider';
import { AuthScreen } from '../../components/AuthScreen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

export function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [societyCode, setSocietyCode] = useState('DEMO');
  const [agentCode, setAgentCode] = useState('AG001');
  const [pin, setPin] = useState('1234');
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      const ok = await signIn({ societyCode, agentCode, pin });
      if (!ok) {
        Alert.alert('Sign in failed', 'Check Company Code, Agent Code, and PIN.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title="Sign In" subtitle="Use your company and agent profile to continue collection work.">
      <Card style={styles.formCard}>
        <View style={styles.formFields}>
          <TextField
            label="Company Code"
            value={societyCode}
            onChangeText={(value) => setSocietyCode(value.toUpperCase())}
            placeholder="e.g. S001"
            leftIcon="company"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TextField
            label="Agent Code"
            value={agentCode}
            onChangeText={(value) => setAgentCode(value.toUpperCase())}
            placeholder="e.g. AG01"
            leftIcon="agent"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TextField
            label="PIN"
            value={pin}
            onChangeText={(value) => setPin(value.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            secureTextEntry
            allowReveal
            placeholder="Enter PIN"
            leftIcon="key-outline"
            autoCorrect={false}
          />
        </View>
        <Button
          title={busy ? 'Signing In…' : 'Sign In'}
          iconLeft="log-in-outline"
          onPress={handleSignIn}
          loading={busy}
          disabled={!societyCode.trim() || !agentCode.trim() || pin.trim().length < 4}
        />
        <View style={styles.secondaryActions}>
          <Button title="Register Agent PIN" variant="secondary" iconLeft="person-outline" onPress={() => nav.navigate('Register')} />
          <Button
            title="Import Daily File"
            variant="ghost"
            iconLeft="cloud-download-outline"
            onPress={() => nav.navigate('ImportMasterData', { mode: 'replace', category: 'daily' })}
          />
          <Button
            title="Import Monthly File"
            variant="ghost"
            iconLeft="document-text-outline"
            onPress={() => nav.navigate('ImportMasterData', { mode: 'replace', category: 'monthly' })}
          />
          <Button
            title="Import Loan File"
            variant="ghost"
            iconLeft="cash-outline"
            onPress={() => nav.navigate('ImportMasterData', { mode: 'replace', category: 'loan' })}
          />
        </View>
      </Card>

      <Text style={styles.supportText}>Need setup help? Import a file first, then sign in with your assigned profile.</Text>
    </AuthScreen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    formCard: {
      gap: 14,
      backgroundColor: theme.isDark ? 'rgba(24,40,61,0.92)' : 'rgba(255,255,255,0.96)',
    },
    formFields: {
      gap: 12,
    },
    secondaryActions: {
      gap: 8,
    },
    supportText: {
      color: theme.colors.mutedOnDark,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 6,
    },
  });
