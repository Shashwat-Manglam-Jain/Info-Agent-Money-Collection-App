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
import { useI18n } from "../../i18n";
import { useTheme } from "../../theme";
import type { Theme } from "../../theme";
import { images } from "../../assets/images";
import { updateAgentPinByCode, getAgentByCode, createAgent } from "../../db/repo";

export function RegisterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, signIn } = useApp();
  const { t } = useI18n();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [agentCode, setAgentCode] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);

  const pinMismatch =
    pin.length > 0 && confirmPin.length > 0 && pin !== confirmPin;
  const pinTooShort = pin.length > 0 && pin.length < 4;

  const handleSignIn = () => {
    nav.navigate("Login");
  };

  const checkIfUserExists = async (agentCode: string): Promise<boolean> => {
    if (!db) return false;
    try {
      const agent = await getAgentByCode(db, agentCode);
      return !!agent;
    } catch (error) {
      console.error("Error checking agent:", error);
      return false;
    }
  };

  const submit = async () => {
    console.log("Submit started");
    
    if (!db) {
      Alert.alert(
        t("common.error"),
        "Database not initialized"
      );
      return;
    }
    
    const trimmedAgentCode = agentCode.trim();
    console.log("Agent code:", trimmedAgentCode);
    
    // Validate input
    if (!trimmedAgentCode) {
      Alert.alert(
        t("auth.register.missingAgentCodeTitle"),
        t("auth.register.missingAgentCodeMessage")
      );
      return;
    }
    if (pin.length < 4) {
      Alert.alert(
        t("auth.register.invalidPinTitle"),
        t("auth.register.invalidPinMessage")
      );
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert(
        t("auth.register.pinMismatchTitle"),
        t("auth.register.pinMismatchMessage")
      );
      return;
    }

    setBusy(true);
    try {
      // Check if user already exists
      console.log("Checking if user exists...");
      const userExists = await checkIfUserExists(trimmedAgentCode);
      console.log("User exists:", userExists);
      
      if (userExists) {
        console.log("User already exists, navigating to login");
        setBusy(false);
        Alert.alert(
          t("auth.register.alreadyRegistered"),
          "",
          [
            { 
              text: t("common.ok"),
              onPress: () => nav.navigate("Login"),
              style: "default"
            }
          ]
        );
        return;
      }

      // Try to update PIN first (for existing agents)
      console.log("Attempting to update PIN...");
      let result = await updateAgentPinByCode(db, {
        agentCode: trimmedAgentCode,
        pin,
      });
      
      console.log("Update result:", result);

      // If agent not found, create a new agent
      if (result === "agent_not_found") {
        console.log("Agent not found, creating new agent...");
        
        const created = await createAgent(db, {
          agentCode: trimmedAgentCode,
          pin: pin,
          name: `Agent ${trimmedAgentCode}`,
        });
        
        console.log("Agent created:", created);
        
        if (created) {
          result = "updated"; // Treat as successful
        } else {
          setBusy(false);
          Alert.alert(
            "Error",
            "Failed to create new agent. Please try again."
          );
          return;
        }
      }

      // If registration successful
      if (result === "updated") {
        console.log("Registration successful, attempting sign in...");
        
        // Wait a moment for database to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Automatically sign in
        try {
          const signedIn = await signIn({ agentCode: trimmedAgentCode, pin });
          console.log("Sign in result:", signedIn);
          
          if (signedIn) {
            console.log("Sign in successful, navigating to MainTabs");
            // Navigate to main dashboard
            nav.reset({
              index: 0,
              routes: [{ name: "MainTabs" }],
            });
          } else {
            console.log("Sign in failed after registration");
            setBusy(false);
            Alert.alert(
              "Registration Successful",
              "Your account has been created. Please sign in with your credentials.",
              [{ text: "OK", onPress: () => nav.navigate("Login") }]
            );
          }
        } catch (signInError) {
          console.error("Sign in error:", signInError);
          setBusy(false);
          Alert.alert(
            "Registration Successful",
            "Your account has been created. Please sign in with your credentials.",
            [{ text: "OK", onPress: () => nav.navigate("Login") }]
          );
        }
        return;
      }

      if (result === "ambiguous_agent_code") {
        console.log("Ambiguous agent code");
        setBusy(false);
        Alert.alert(
          t("auth.register.agentCodeNotUniqueTitle"),
          t("auth.register.agentCodeNotUniqueMessage")
        );
        return;
      }

      // If we get here, something unexpected happened
      console.log("Unexpected result:", result);
      setBusy(false);
      Alert.alert(
        t("common.error"),
        t("auth.register.registrationError")
      );
      
    } catch (error) {
      console.error("Registration error details:", error);
      setBusy(false);
      Alert.alert(
        t("common.error"),
        t("auth.register.registrationError")
      );
    }
  };

  return (
    <AuthScreen title={t("auth.register.title")} heroImage={images.Logo}>
      <Text style={styles.subtitles}>
        {t("auth.register.subtitle")}
      </Text>

      <Card style={styles.formCard}>
        <View style={styles.formFields}>
          <TextField
            label={t("auth.shared.agentCode")}
            value={agentCode}
            onChangeText={(value) => setAgentCode(value.toUpperCase())}
            placeholder={t("auth.register.agentCodePlaceholder")}
            leftIcon="agent"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TextField
            label={t("auth.register.newPin")}
            value={pin}
            onChangeText={(value) => setPin(value.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            secureTextEntry
            allowReveal
            placeholder={t("auth.register.newPinPlaceholder")}
            leftIcon="key-outline"
            autoCorrect={false}
            error={pinTooShort ? t("auth.register.pinTooShort") : undefined}
          />
          <TextField
            label={t("auth.register.confirmPin")}
            value={confirmPin}
            onChangeText={(value) =>
              setConfirmPin(value.replace(/[^0-9]/g, ""))
            }
            keyboardType="number-pad"
            secureTextEntry
            allowReveal
            placeholder={t("auth.register.confirmPinPlaceholder")}
            leftIcon="checkmark-circle-outline"
            autoCorrect={false}
            error={pinMismatch ? t("auth.register.pinMismatch") : undefined}
          />
        </View>

        <Button
          title={busy ? t("auth.register.savingPin") : t("auth.register.savePin")}
          iconLeft="save-outline"
          onPress={submit}
          loading={busy}
          disabled={
            busy || !agentCode.trim() || pin.length < 4 || pin !== confirmPin
          }
        />

        <View style={styles.signinContainer}>
          <Text style={styles.signinText}>
            {t("auth.register.haveAccount")}{" "}
          </Text>
          <Text style={styles.signinLink} onPress={handleSignIn}>
            {t("auth.register.signIn")}
          </Text>
        </View>
      </Card>

      <View style={styles.poweredByContainer}>
        <View style={styles.poweredByLine} />
        <Text style={styles.poweredByText}>
          {t("branding.poweredBy")}{" "}
          <Text style={styles.infopathText}>InfoPath Solution</Text>
        </Text>
        <View style={styles.poweredByLine} />
      </View>
    </AuthScreen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    formCard: {
      gap: 10,
      backgroundColor: theme.isDark
        ? "rgba(24,40,61,0.92)"
        : "rgba(255,255,255,0.96)",
    },
    formFields: {
      gap: 12,
    },
    signinContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
      paddingVertical: 8,
    },
    signinText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    signinLink: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "600",
      textDecorationLine: "underline",
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