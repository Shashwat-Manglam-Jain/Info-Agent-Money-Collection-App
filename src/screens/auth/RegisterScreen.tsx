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
import { updateAgentPinByCode } from "../../db/repo";

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

  const submit = async () => {
    if (!db) return;
    const trimmedAgentCode = agentCode.trim();
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
      const result = await updateAgentPinByCode(db, {
        agentCode: trimmedAgentCode,
        pin,
      });

      if (result === "updated") {
        const signedIn = await signIn({ agentCode: trimmedAgentCode, pin });
        if (signedIn) return;
        Alert.alert(
          t("auth.register.pinSavedTitle"),
          t("auth.register.pinSavedMessage"),
          [{ text: t("common.ok"), onPress: () => nav.goBack() }]
        );
        return;
      }

      if (result === "ambiguous_agent_code") {
        Alert.alert(
          t("auth.register.agentCodeNotUniqueTitle"),
          t("auth.register.agentCodeNotUniqueMessage")
        );
        return;
      }

      Alert.alert(
        t("auth.register.agentNotFoundTitle"),
        t("auth.register.agentNotFoundMessage")
      );
    } finally {
      setBusy(false);
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

        <View style={styles.secondaryActions}>
          <Button
            title={t("actions.importDailyFile")}
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
            title={t("actions.importMonthlyFile")}
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
            title={t("actions.importLoanFile")}
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
            title={t("auth.register.backToSignIn")}
            variant="secondary"
            iconLeft="arrow-back-outline"
            onPress={() => nav.goBack()}
          />
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
