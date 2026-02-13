import { useMemo, useState } from 'react';
import { StyleSheet, View, Dimensions, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '../../appState/AppProvider';
// import { setAgentPin } from '../../db/repo';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

const { height: screenHeight } = Dimensions.get('window');

export function RegisterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  
  const [agentCode, setAgentCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!db) return;
    const a = agentCode.trim();
    
    if (!a || pin.length < 4 || pin !== confirmPin) {
      return;
    }
    
    setBusy(true);
    try {
      // await setAgentPin({ db, societyCode: s, agentCode: a, pin });
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
        <View style={styles.formCard}>
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
                placeholderTextColor={theme.colors.muted}
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
                placeholderTextColor={theme.colors.muted}
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
                placeholderTextColor={theme.colors.muted}
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
      height: screenHeight * 0.2,
    },
    contentContainer: {
      flex: 1,
      padding: theme.spacing.lg,
      paddingTop: 0,
    },
    registerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
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
    hintText: {
      fontSize: 12,
      color: theme.colors.muted,
      marginBottom: 5,
      fontStyle: 'italic',
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
    saveButtonContainer: {
      marginBottom: 15,
      marginTop: 8,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: theme.colors.primarySoft,
    },
    saveButtonText: {
      color: theme.colors.textOnDark,
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
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    importButtonText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: 'bold',
    },
    backButton: {
      flex: 1,
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    backButtonText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: 'bold',
    },
    poweredBy: {
      textAlign: 'center',
      color: theme.colors.muted,
      fontSize: 11,
      marginTop: 8,
    },
  });
