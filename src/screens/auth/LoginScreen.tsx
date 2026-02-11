import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View, Dimensions, Image, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import type { RootStackParamList } from '../../navigation/types';
import { theme } from '../../theme';

const { height: screenHeight } = Dimensions.get('window');

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
    <View style={styles.container}>
      <Image 
        source={require('../../../assets/register.png')} 
        style={styles.fullImage}
        resizeMode="contain"
      />

      <View style={styles.contentContainer}>
        <Text style={styles.loginTitle}>Sign In</Text>
        {/* <Text style={styles.subtitle}>Enter your Society Code and Agent Code, then collect money in real time.</Text> */}

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Society Code</Text>
          {/* <Text style={styles.hintText}>Provided by your society</Text> */}
          <View style={styles.inputField}>
            <TextInput
              style={styles.textInput}
              value={societyCode}
              onChangeText={setSocietyCode}
              placeholder="e.g. S001"
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Agent Code</Text>
          {/* <Text style={styles.hintText}>Provided by your society</Text> */}
          <View style={styles.inputField}>
            <TextInput
              style={styles.textInput}
              value={agentCode}
              onChangeText={setAgentCode}
              placeholder="e.g. AG01"
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>PIN</Text>
          {/* <Text style={styles.hintText}>Set / reset your PIN from Register</Text> */}
          <View style={styles.inputField}>
            <TextInput
              style={styles.textInput}
              value={pin}
              onChangeText={(v) => setPin(v.replace(/[^0-9]/g, ''))}
              placeholder=""
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.signInButton, busy && styles.buttonDisabled]} 
          onPress={handleSignIn}
          disabled={busy}
        >
          <Text style={styles.signInButtonText}>
            {busy ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => nav.navigate('Register')}
          >
            <Text style={styles.actionButtonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => nav.navigate('ImportMasterData')}
          >
            <Text style={styles.actionButtonText}>Import Data</Text>
          </TouchableOpacity>
        </View>

       
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  fullImage: {
    width: '100%',
    height: screenHeight * 0.4,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  hintText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  inputField: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  signInButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  signInButtonText: {
    color: 'white',
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
    backgroundColor: '#757575',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoContainer: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  demoText: {
    fontSize: 13,
    color: '#666',
  },
  footerText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginTop: 10,
  },
});