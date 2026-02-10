import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthScreen } from '../../components/AuthScreen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import type { RootStackParamList } from '../../navigation/types';
import { theme } from '../../theme';
export function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <AuthScreen
      title="Import Daily Data"
      subtitle="Your admin sends a daily TXT file that contains the agent and client data."
      heroImageLabel="Import data illustration"
      footer={<Text style={styles.footerText}>Importing auto logs you in (PIN is set to 0000).</Text>}
    >
      <Card>
        <View style={{ gap: 12 }}>
          <Text style={styles.copy}>
            Daily import replaces all old data and signs you in automatically.
          </Text>
          <Button
            title="Pick TXT File & Import"
            iconLeft="cloud-download-outline"
            onPress={() => nav.navigate('ImportMasterData')}
          />
        </View>
      </Card>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  copy: { fontSize: 13, color: theme.colors.muted, textAlign: 'center' },
  footerText: { textAlign: 'center', color: theme.colors.mutedOnDark, fontSize: 12 },
});
