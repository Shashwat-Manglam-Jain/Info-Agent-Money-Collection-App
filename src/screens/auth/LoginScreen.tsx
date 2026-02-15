import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useApp } from "../../appState/AppProvider";
import { AuthScreen } from "../../components/AuthScreen";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import type { RootStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme";
import type { Theme } from "../../theme";

// Import hero image for login screen
import { images } from "../../assets/images";

export function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [agentCode, setAgentCode] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    setBusy(true);
    try {
      const ok = await signIn({ agentCode, pin });
      if (!ok) {
        Alert.alert(
          "Sign in failed",
          "Check Agent Code and PIN.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      title="Welcome Back"
      heroImage={images.Logo} // Add your hero image here
    >
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <Card style={styles.formCard}>
        <View style={styles.formFields}>
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
            onChangeText={(value) => setPin(value.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            secureTextEntry
            allowReveal
            placeholder="Enter PIN"
            leftIcon="key-outline"
            autoCorrect={false}
          />
        </View>
        <Button
          title={busy ? "Signing In…" : "Sign In"}
          iconLeft="log-in-outline"
          onPress={handleSignIn}
          loading={busy}
          disabled={
            !agentCode.trim() || pin.trim().length < 4
          }
        />
        <View style={styles.secondaryActions}>
          <Button
            title="Register Agent PIN"
            variant="secondary"
            iconLeft="person-outline"
            onPress={() => nav.navigate("Register")}
          />
          <Button
            title="Import Daily File"
            variant="ghost"
            iconLeft="cloud-download-outline"
            onPress={() =>
              nav.navigate("ImportMasterData", {
                mode: "replace",
                category: "daily",
              })
            }
          />
          <Button
            title="Import Monthly File"
            variant="ghost"
            iconLeft="document-text-outline"
            onPress={() =>
              nav.navigate("ImportMasterData", {
                mode: "replace",
                category: "monthly",
              })
            }
          />
          <Button
            title="Import Loan File"
            variant="ghost"
            iconLeft="cash-outline"
            onPress={() =>
              nav.navigate("ImportMasterData", {
                mode: "replace",
                category: "loan",
              })
            }
          />
        </View>
      </Card>
      <View style={styles.poweredByContainer}>
        <View style={styles.poweredByLine} />
        <Text style={styles.poweredByText}>
          Powered by <Text style={styles.infopathText}>InfoPath Solution</Text>
        </Text>
        <View style={styles.poweredByLine} />
      </View>
    </AuthScreen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    formCard: {
      gap: 14,
      backgroundColor: theme.isDark
        ? "rgba(24,40,61,0.92)"
        : "rgba(255,255,255,0.96)",
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
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: 6,
    },
    poweredByContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
    },
    poweredByLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.isDark
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.1)",
    },
    poweredByText: {
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontWeight: "400",
      marginHorizontal: 8,
      letterSpacing: 0.3,
    },
    infopathText: {
      color: theme.colors.primary,
      fontWeight: "700",
      fontSize: 12,
    },
    subtitle: {
      color: "white",
      fontSize: 16,
      textAlign: "center",
      marginBottom: 5,
    },
  });
