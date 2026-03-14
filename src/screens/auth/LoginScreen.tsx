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

// Import hero image for login screen
import { images } from "../../assets/images";

export function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn } = useApp();
  const { t } = useI18n();
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
    t("auth.login.signInFailedTitle"),
    t("auth.login.signInFailedMessage"),
    [
      { 
        text: t("common.ok"),
        onPress: () => {},
        style: "default"
      }
    ]
  );
}
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = () => {
    nav.navigate("Register");
  };

  return (
    <AuthScreen
      title={t("auth.login.title")}
      heroImage={images.Logo}
    >
      <Text style={styles.subtitle}>{t("auth.login.subtitle")}</Text>

      <Card style={styles.formCard}>
        <View style={styles.formFields}>
          <TextField
            label={t("auth.shared.agentCode")}
            value={agentCode}
            onChangeText={(value) => setAgentCode(value.toUpperCase())}
            placeholder={t("auth.login.agentCodePlaceholder")}
            leftIcon="agent"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TextField
            label={t("auth.shared.pin")}
            value={pin}
            onChangeText={(value) => setPin(value.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            secureTextEntry
            allowReveal
            placeholder={t("auth.login.pinPlaceholder")}
            leftIcon="key-outline"
            autoCorrect={false}
          />
        </View>
        
        <Button
          title={busy ? t("auth.login.signingIn") : t("auth.login.signIn")}
          iconLeft="log-in-outline"
          onPress={handleSignIn}
          loading={busy}
          disabled={!agentCode.trim() || pin.trim().length < 4}
        />
        
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>
            {t("auth.login.noAccount")}{" "}
          </Text>
          <Text style={styles.signupLink} onPress={handleSignUp}>
            {t("auth.login.signUp")}
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
      gap: 14,
      backgroundColor: theme.isDark
        ? "rgba(24,40,61,0.92)"
        : "rgba(255,255,255,0.96)",
    },
    formFields: {
      gap: 12,
    },
    signupContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
      paddingVertical: 8,
    },
    signupText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    signupLink: {
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
    subtitle: {
      color: "white",
      fontSize: 16,
      textAlign: "center",
      marginBottom: 5,
    },
  });