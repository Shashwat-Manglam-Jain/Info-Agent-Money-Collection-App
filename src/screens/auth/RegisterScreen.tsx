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
import { images } from "../../assets/images";

export function RegisterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [agentCode, setAgentCode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);

  const pinMismatch =
    pin.length > 0 && confirmPin.length > 0 && pin !== confirmPin;
  const pinTooShort = pin.length > 0 && pin.length < 4;

  const submit = async () => {
    if (!db) return;
    const trimmedAgentCode = agentCode.trim();
    if (!trimmedAgentCode) {
      Alert.alert("Missing agent code", "Enter a valid agent code.");
      return;
    }
    if (pin.length < 4) {
      Alert.alert("Invalid PIN", "PIN must be at least 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert("PIN mismatch", "PIN and confirm PIN must match.");
      return;
    }

    setBusy(true);
    try {
      // TODO: Persist PIN once registration endpoint is finalized.
      nav.goBack();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title="Register" heroImage={images.Logo}>
      <Text style={styles.subtitles}>
        Create a secure PIN for your agent profile
      </Text>

      <Card style={styles.formCard}>
        <View style={styles.formFields}>
          <TextField
            label="Agent Code"
            value={agentCode}
            onChangeText={(value) => setAgentCode(value.toUpperCase())}
            placeholder="e.g. AG001"
            leftIcon="agent"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TextField
            label="New PIN"
            value={pin}
            onChangeText={(value) => setPin(value.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            secureTextEntry
            allowReveal
            placeholder="At least 4 digits"
            leftIcon="key-outline"
            autoCorrect={false}
            error={pinTooShort ? "PIN must be at least 4 digits." : undefined}
          />
          <TextField
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={(value) =>
              setConfirmPin(value.replace(/[^0-9]/g, ""))
            }
            keyboardType="number-pad"
            secureTextEntry
            allowReveal
            placeholder="Re-enter PIN"
            leftIcon="checkmark-circle-outline"
            autoCorrect={false}
            error={pinMismatch ? "PIN does not match." : undefined}
          />
        </View>

        <Button
          title={busy ? "Saving…" : "Save PIN"}
          iconLeft="save-outline"
          onPress={submit}
          loading={busy}
          disabled={
            busy || !agentCode.trim() || pin.length < 4 || pin !== confirmPin
          }
        />

        <View style={styles.secondaryActions}>
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
          <Button
            title="Back to Sign In"
            variant="secondary"
            iconLeft="arrow-back-outline"
            onPress={() => nav.goBack()}
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
    subtitles: {
      color: "white",
      fontSize: 16,
      textAlign: "center",
      marginBottom: 5,
    },
  });
