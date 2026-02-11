
// import { useMemo, useState } from 'react';
// import { Alert, StyleSheet, Text, View, Dimensions, Image, TextInput, TouchableOpacity } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// import { useApp } from '../../appState/AppProvider';
// import type { RootStackParamList } from '../../navigation/types';
// import { theme } from '../../theme';

// const { height: screenHeight } = Dimensions.get('window');


// import { StyleSheet, Text, View } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// import { useEffect, useMemo, useState } from 'react';
// import { AuthScreen } from '../../components/AuthScreen';
// import { Button } from '../../components/Button';
// import { Card } from '../../components/Card';
// import { PopupModal, type PopupAction } from '../../components/PopupModal';
// import { SectionHeader } from '../../components/SectionHeader';
// import { TextField } from '../../components/TextField';
// import { useApp } from '../../appState/AppProvider';
// import { getRegistration, saveRegistration } from '../../db/repo';
// import type { RootStackParamList } from '../../navigation/types';
// import { useTheme } from '../../theme';
// import type { Theme } from '../../theme';
// >>>>>>> cb92276a0a5200985d5b3593532ed5c9345ccf61
// export function LoginScreen() {
//   const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//   const { db } = useApp();
//   const theme = useTheme();
//   const styles = useMemo(() => makeStyles(theme), [theme]);
//   const [societyName, setSocietyName] = useState('');
//   const [agentName, setAgentName] = useState('');
//   const [saving, setSaving] = useState(false);
//   const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);

//   useEffect(() => {
//     if (!db) return;
//     (async () => {
//       const reg = await getRegistration(db);
//       if (reg) {
//         setSocietyName(reg.societyName);
//         setAgentName(reg.agentName);
//       }
//     })();
//   }, [db]);

//   const closePopup = () => setPopup(null);

//   const showMessage = (title: string, message?: string) => {
//     setPopup({
//       title,
//       message,
//       actions: [{ label: 'OK', onPress: closePopup }],
//     });
//   };

//   const saveProfile = async () => {
//     if (!db) return;
//     const s = societyName.trim();
//     const a = agentName.trim();
//     if (!s || !a) {
//       showMessage('Missing details', 'Enter society name and agent name exactly as in the admin file.');
//       return;
//     }
//     setSaving(true);
//     try {
//       await saveRegistration(db, { societyName: s, agentName: a });
//       showMessage('Saved', 'Registration updated on this device.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
 
//     <View style={styles.container}>
//       <Image 
//         source={require('../../../assets/register.png')} 
//         style={styles.fullImage}
//         resizeMode="contain"
//       />

//       <View style={styles.contentContainer}>
//         <Text style={styles.loginTitle}>Sign In</Text>
//         {/* <Text style={styles.subtitle}>Enter your Society Code and Agent Code, then collect money in real time.</Text> */}

//         <View style={styles.formSection}>
//           <Text style={styles.sectionTitle}>Society Code</Text>
//           {/* <Text style={styles.hintText}>Provided by your society</Text> */}
//           <View style={styles.inputField}>
//             <TextInput
//               style={styles.textInput}
//               value={societyCode}
//               onChangeText={setSocietyCode}
//               placeholder="e.g. S001"
//               autoCapitalize="characters"
//             />
//           </View>
//         </View>

//         <View style={styles.formSection}>
//           <Text style={styles.sectionTitle}>Agent Code</Text>
//           {/* <Text style={styles.hintText}>Provided by your society</Text> */}
//           <View style={styles.inputField}>
//             <TextInput
//               style={styles.textInput}
//               value={agentCode}
//               onChangeText={setAgentCode}
//               placeholder="e.g. AG01"
//               autoCapitalize="characters"
//             />
//           </View>
//         </View>

//         <View style={styles.formSection}>
//           <Text style={styles.sectionTitle}>PIN</Text>
//           {/* <Text style={styles.hintText}>Set / reset your PIN from Register</Text> */}
//           <View style={styles.inputField}>
//             <TextInput
//               style={styles.textInput}
//               value={pin}
//               onChangeText={(v) => setPin(v.replace(/[^0-9]/g, ''))}
//               placeholder=""
//               keyboardType="number-pad"
//               secureTextEntry
//             />
//           </View>
//         </View>

//         <TouchableOpacity 
//           style={[styles.signInButton, busy && styles.buttonDisabled]} 
//           onPress={handleSignIn}
//           disabled={busy}
//         >
//           <Text style={styles.signInButtonText}>
//             {busy ? 'Signing In...' : 'Sign In'}
//           </Text>
//         </TouchableOpacity>

//         <View style={styles.actionsContainer}>
//           <TouchableOpacity 
//             style={styles.actionButton}
//             onPress={() => nav.navigate('Register')}
//           >
//             <Text style={styles.actionButtonText}>Register</Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={styles.actionButton}
//             onPress={() => nav.navigate('ImportMasterData')}
//           >
//             <Text style={styles.actionButtonText}>Import Data</Text>
//           </TouchableOpacity>
//         </View>

       
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'white',
//   },
//   fullImage: {
//     width: '100%',
//     height: screenHeight * 0.4,
//   },
//   contentContainer: {
//     flex: 1,
//     padding: 20,
//     paddingTop: 10,
//   },
//   loginTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   formSection: {
//     marginBottom: 12,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 3,
//   },
//   hintText: {
//     fontSize: 12,
//     color: '#888',
//     marginBottom: 5,
//     fontStyle: 'italic',
//   },
//   inputField: {
//     backgroundColor: '#f8f8f8',
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 6,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     height: 48,
//     justifyContent: 'center',
//   },
//   textInput: {
//     fontSize: 16,
//     color: '#333',
//     padding: 0,
//   },
//   signInButton: {
//     backgroundColor: '#4CAF50',
//     borderRadius: 8,
//     paddingVertical: 14,
//     alignItems: 'center',
//     marginBottom: 12,
//     marginTop: 8,
//   },
//   buttonDisabled: {
//     backgroundColor: '#A5D6A7',
//   },
//   signInButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   actionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 12,
//     marginBottom: 20,
//   },
//   actionButton: {
//     flex: 1,
//     backgroundColor: '#757575',
//     borderRadius: 8,
//     paddingVertical: 12,
//     alignItems: 'center',
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   demoContainer: {
//     backgroundColor: '#f5f5f5',
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 6,
//     padding: 12,
//     marginBottom: 12,
//   },
//   demoTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 4,
//   },
//   demoText: {
//     fontSize: 13,
//     color: '#666',
//   },
//   footerText: {
//     textAlign: 'center',
//     color: '#888',
//     fontSize: 12,
//     marginTop: 10,
//   },
// });
// =======
//     <AuthScreen
//       title="Import Daily Data"
//       subtitle="Your admin sends a daily TXT or Excel file that contains the agent and client data."
//       heroImageLabel="Import data illustration"
//       footer={<Text style={styles.footerText}>Importing auto logs you in (PIN is set to 0000).</Text>}
//     >
//       <Card>
//         <SectionHeader
//           title="Register Device"
//           subtitle="Use the same Society Name and Agent Name that appear in your admin file."
//           icon="id-card-outline"
//         />
//         <View style={{ height: 10 }} />
//         <TextField
//           label="Society Name"
//           value={societyName}
//           onChangeText={setSocietyName}
//           placeholder="e.g. PRIYADARSHANI MAHILA CREDIT SOCIETY, karanja"
//           leftIcon="business-outline"
//           autoCorrect={false}
//         />
//         <View style={{ height: 10 }} />
//         <TextField
//           label="Agent Name"
//           value={agentName}
//           onChangeText={setAgentName}
//           placeholder="e.g. Mr.PRAKASH VITHOBA BIRGADE"
//           leftIcon="person-outline"
//           autoCorrect={false}
//         />
//         <View style={{ height: 12 }} />
//         <Button
//           title={saving ? 'Saving…' : 'Save Registration'}
//           iconLeft="save-outline"
//           onPress={saveProfile}
//           disabled={saving}
//         />
//       </Card>
//       <Card>
//         <View style={{ gap: 12 }}>
//           <Text style={styles.copy}>
//             Daily import replaces all old data and signs you in automatically.
//           </Text>
//           <Button
//             title="Pick TXT/Excel File & Import"
//             iconLeft="cloud-download-outline"
//             onPress={() => nav.navigate('ImportMasterData')}
//           />
//         </View>
//       </Card>
//       <PopupModal
//         visible={!!popup}
//         title={popup?.title ?? ''}
//         message={popup?.message}
//         actions={popup?.actions}
//         onDismiss={closePopup}
//       />
//     </AuthScreen>
//   );
// }

// const makeStyles = (theme: Theme) =>
//   StyleSheet.create({
//     copy: { fontSize: 13, color: theme.colors.muted, textAlign: 'center' },
//     footerText: { textAlign: 'center', color: theme.colors.mutedOnDark, fontSize: 12 },
//   });
// >>>>>>> cb92276a0a5200985d5b3593532ed5c9345ccf61

import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View, Dimensions, Image, TextInput, TouchableOpacity } from 'react-native';
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
      <Image 
        source={require('../../../assets/login.png')} 
        style={styles.fullImage}
        resizeMode="contain"
      />

      <View style={styles.contentContainer}>
        <Text style={styles.loginTitle}>Sign In</Text>
        <Text style={styles.subtitle}>Use your Society Code and Agent Code to start collecting.</Text>

        <View style={styles.formCard}>
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
                placeholderTextColor={theme.colors.muted}
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
                placeholderTextColor={theme.colors.muted}
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
                placeholderTextColor={theme.colors.muted}
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

        <Text style={styles.poweredBy}>Powered by Infopath Solutions</Text>

        {/* <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>Demo (seeded)</Text>
          <Text style={styles.demoText}>Society: DEMO • Agent: AG001 • PIN: 1234</Text>
        </View> */}

        {/* <Text style={styles.footerText}>
          {isDemo ? 'Demo is ready — you can sign in now.' : 'Need data? Import master data from Sync / Login.'}
        </Text> */}
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
    demoContainer: {
      backgroundColor: theme.colors.surfaceTint,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: 6,
      padding: 12,
      marginBottom: 12,
    },
    demoTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    demoText: {
      fontSize: 13,
      color: theme.colors.muted,
    },
    footerText: {
      textAlign: 'center',
      color: theme.colors.muted,
      fontSize: 12,
      marginTop: 10,
    },
    poweredBy: {
      textAlign: 'center',
      color: theme.colors.muted,
      fontSize: 11,
      marginTop: 6,
    },
  });
