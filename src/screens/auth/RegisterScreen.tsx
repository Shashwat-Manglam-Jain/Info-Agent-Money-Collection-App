import { useState } from 'react';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TextInput, TouchableOpacity, Text } from 'react-native';
import { useApp } from '../../app/AppProvider';
import { setAgentPin } from '../../db/repo';
import type { RootStackParamList } from '../../navigation/types';

const { height: screenHeight } = Dimensions.get('window');

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
    
    if (!s || !a || pin.length < 4 || pin !== confirmPin) {
      return;
    }
    
    setBusy(true);
    try {
      await setAgentPin({ db, societyCode: s, agentCode: a, pin });
      nav.goBack();
    } catch (e: unknown) {
      console.error('Failed to set PIN:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../../assets/login.png')} 
        style={styles.fullImage}
        resizeMode="contain"
      />

      <View style={styles.contentContainer}>
        <Text style={styles.registerTitle}>Register</Text>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Society Code</Text>
          {/* <Text style={styles.hintText}>provided by society</Text> */}
          <View style={styles.inputField}>
            <TextInput
              style={styles.textInput}
              value={societyCode}
              onChangeText={setSocietyCode}
              placeholder=""
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Agent Code</Text>
          {/* <Text style={styles.hintText}>provided by society</Text> */}
          <View style={styles.inputField}>
            <TextInput
              style={styles.textInput}
              value={agentCode}
              onChangeText={setAgentCode}
              placeholder=""
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>New PIN</Text>
          {/* <Text style={styles.hintText}>Minimum 4 digits</Text> */}
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

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Confirm PIN</Text>
          <View style={styles.inputField}>
            <TextInput
              style={styles.textInput}
              value={confirmPin}
              onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, ''))}
              placeholder=""
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
        </View>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, busy && styles.saveButtonDisabled]} 
            onPress={submit}
            disabled={busy}
          >
            <Text style={styles.saveButtonText}>Save PIN</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.importButton}
            onPress={() => nav.navigate('ImportMasterData')}
          >
            <Text style={styles.importButtonText}>IMPORT DATA</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => nav.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
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
    padding: 10,
    paddingTop: 0,
  },
  registerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
  saveButtonContainer: {
    marginBottom: 15,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 5,
  },
  importButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  importButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#757575',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});