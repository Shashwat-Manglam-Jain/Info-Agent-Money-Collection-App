import { useMemo, useState } from 'react';
import { Alert, Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../appState/AppProvider';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

const { height: screenHeight } = Dimensions.get('window');

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
        Alert.alert('Sign in failed', 'Check Society Code, Agent Code, and PIN.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/login.png')} style={styles.fullImage} resizeMode="contain" />

      <View style={styles.contentContainer}>
        <Text style={styles.loginTitle}>Sign In</Text>
        <Text style={styles.subtitle}>Use your Society Code and Agent Code to start collecting.</Text>

        <View style={styles.formCard}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Society Code</Text>
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                value={societyCode}
                onChangeText={setSocietyCode}
                placeholder="e.g. S001"
                autoCapitalize="characters"
                placeholderTextColor={theme.colors.muted}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Agent Code</Text>
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                value={agentCode}
                onChangeText={setAgentCode}
                placeholder="e.g. AG01"
                autoCapitalize="characters"
                placeholderTextColor={theme.colors.muted}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>PIN</Text>
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                value={pin}
                onChangeText={(v) => setPin(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                secureTextEntry
                placeholderTextColor={theme.colors.muted}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.signInButton, busy && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={busy}
          >
            <Text style={styles.signInButtonText}>{busy ? 'Signing In...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => nav.navigate('Register')}>
              <Text style={styles.actionButtonText}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => nav.navigate('ImportMasterData')}>
              <Text style={styles.actionButtonText}>Import Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.poweredBy}>Powered by Infopath Solutions</Text>
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.appBg,
    },
    fullImage: {
      width: '100%',
      height: screenHeight * 0.4,
    },
    contentContainer: {
      flex: 1,
      padding: theme.spacing.lg,
      paddingTop: 10,
    },
    loginTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.muted,
      marginBottom: 16,
      textAlign: 'center',
    },
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      ...theme.shadow.card,
    },
    formSection: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 3,
    },
    inputField: {
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      height: 48,
      justifyContent: 'center',
    },
    textInput: {
      fontSize: 16,
      color: theme.colors.text,
      padding: 0,
    },
    signInButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 8,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.primarySoft,
    },
    signInButtonText: {
      color: theme.colors.textOnDark,
      fontSize: 16,
      fontWeight: 'bold',
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 20,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    actionButtonText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: 'bold',
    },
    poweredBy: {
      textAlign: 'center',
      color: theme.colors.muted,
      fontSize: 11,
      marginTop: 6,
    },
  });
