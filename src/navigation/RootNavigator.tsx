import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "../appState/AppProvider";
import { Icon } from "../components/Icon";
import { PopupModal, type PopupAction } from "../components/PopupModal";
import { useI18n, type TranslationKey } from "../i18n";
import { AppSplashScreen } from "../screens/auth/AppSplashScreen";
import { useTheme, useThemeController } from "../theme";
import type { MainTabParamList, RootStackParamList } from "./types";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_HEADER_META: Record<
  keyof MainTabParamList,
  {
    titleKey: TranslationKey;
    icon: string;
  }
> = {
  Collect: { titleKey: "navigation.tabs.collect", icon: "cash-outline" },
  Accounts: { titleKey: "navigation.tabs.clients", icon: "people-outline" },
  Reports: { titleKey: "navigation.tabs.reports", icon: "bar-chart-outline" },
  Sync: { titleKey: "navigation.tabs.sync", icon: "sync-outline" },
};

const getCollectScreen = () =>
  require("../screens/collections/CollectScreen").CollectScreen;
const getAccountsScreen = () =>
  require("../screens/accounts/AccountsScreen").AccountsScreen;
const getReportsScreen = () =>
  require("../screens/collections/ReportsScreen").ReportsScreen;
const getSyncScreen = () => require("../screens/sync/SyncScreen").SyncScreen;

const getLoginScreen = () => require("../screens/auth/LoginScreen").LoginScreen;
const getRegisterScreen = () =>
  require("../screens/auth/RegisterScreen").RegisterScreen;
const getAccountDetailScreen = () =>
  require("../screens/collections/AccountDetailScreen").AccountDetailScreen;
const getExportDetailScreen = () =>
  require("../screens/collections/ExportDetailScreen").ExportDetailScreen;
const getImportMasterDataScreen = () =>
  require("../screens/sync/ImportMasterDataScreen").ImportMasterDataScreen;

function useSelectorStyles() {
  const theme = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        trigger: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: theme.radii.pill,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceTint,
        },
        triggerText: {
          fontSize: 12,
          fontWeight: "800",
          color: theme.colors.primary,
        },
      }),
    [theme]
  );
}

function ThemeSelectorButton() {
  const theme = useTheme();
  const { mode, setMode, options } = useThemeController();
  const { t } = useI18n();
  const styles = useSelectorStyles();
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.mode === mode) ?? options[0],
    [mode, options]
  );

  const selectedLabel = t("common.selected");

  const actions = useMemo<PopupAction[]>(
    () =>
      options.map((option) => ({
        label:
          mode === option.mode
            ? `${option.label} (${selectedLabel})`
            : option.label,
        variant: mode === option.mode ? "primary" : "secondary",
        onPress: () => {
          setMode(option.mode);
          setOpen(false);
        },
      })),
    [mode, options, selectedLabel, setMode]
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={t("navigation.theme.accessibilityLabel")}
      >
        <Icon name={selectedOption.icon} size={16} color={theme.colors.primary} />
        <Text style={styles.triggerText}>{selectedOption.label}</Text>
      </Pressable>
      <PopupModal
        visible={open}
        title={t("navigation.theme.modalTitle")}
        message={t("navigation.theme.modalMessage")}
        actions={actions}
        onDismiss={() => setOpen(false)}
      />
    </>
  );
}

function LanguageSelectorButton() {
  const theme = useTheme();
  const styles = useSelectorStyles();
  const { language, setLanguage, options, t } = useI18n();
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.language === language) ?? options[0],
    [language, options]
  );

  const selectedLabel = t("common.selected");

  const actions = useMemo<PopupAction[]>(
    () =>
      options.map((option) => ({
        label:
          language === option.language
            ? `${t(option.labelKey)} (${selectedLabel})`
            : t(option.labelKey),
        variant: language === option.language ? "primary" : "secondary",
        onPress: () => {
          setLanguage(option.language);
          setOpen(false);
        },
      })),
    [language, options, selectedLabel, setLanguage, t]
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={t("navigation.language.accessibilityLabel")}
      >
        <Icon name={selectedOption.icon} size={16} color={theme.colors.primary} />
        <Text style={styles.triggerText}>{t(selectedOption.labelKey)}</Text>
      </Pressable>
      <PopupModal
        visible={open}
        title={t("navigation.language.modalTitle")}
        message={t("navigation.language.modalMessage")}
        actions={actions}
        onDismiss={() => setOpen(false)}
      />
    </>
  );
}

function MainTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const tabBarBottomInset =
    Platform.OS === "android" && insets.bottom === 0 ? 24 : insets.bottom;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerLeftIconWrap: {
          width: 34,
          height: 34,
          borderRadius: theme.radii.pill,
          marginLeft: 8,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.primarySoft,
        },
        headerRightWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginRight: 8,
        },
      }),
    [theme]
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tabMeta = TAB_HEADER_META[route.name];
        return {
          headerShown: true,
          headerTitleAlign: "left",
          headerStyle: {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 1,
          },
          headerTintColor: theme.colors.text,
          headerTitle: t(tabMeta.titleKey),
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "900",
            color: theme.colors.text,
          },
          headerLeftContainerStyle: { paddingLeft: 10 },
          headerLeft: () => (
            <View style={styles.headerLeftIconWrap}>
              <Icon name={tabMeta.icon} size={16} color={theme.colors.primary} />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRightWrap}>
              <LanguageSelectorButton />
              <ThemeSelectorButton />
            </View>
          ),
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: 45 + tabBarBottomInset,
            paddingTop: 4,
            paddingBottom: 8 + tabBarBottomInset,
            paddingHorizontal: 8,
          },
          tabBarItemStyle: { paddingVertical: 1 },
          tabBarLabelStyle: { fontWeight: "800", fontSize: 11 },
          tabBarIcon: ({ size, color, focused }) => (
            <Icon
              name={`tab-${route.name}${focused ? "-active" : ""}`}
              size={size}
              color={color}
            />
          ),
        };
      }}
    >
      <Tab.Screen
        name="Collect"
        getComponent={getCollectScreen}
        options={{ title: t("navigation.tabs.collect") }}
      />
      <Tab.Screen
        name="Accounts"
        getComponent={getAccountsScreen}
        options={{ title: t("navigation.tabs.clients") }}
      />
      <Tab.Screen
        name="Reports"
        getComponent={getReportsScreen}
        options={{ title: t("navigation.tabs.reports") }}
      />
      <Tab.Screen
        name="Sync"
        getComponent={getSyncScreen}
        options={{ title: t("navigation.tabs.sync") }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { ready, agent } = useApp();
  const theme = useTheme();
  const { t } = useI18n();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stackHeaderRightWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginRight: 6,
        },
      }),
    []
  );

  if (!ready) return <AppSplashScreen />;

  const baseNavTheme = theme.isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseNavTheme,
    dark: theme.isDark,
    colors: {
      ...baseNavTheme.colors,
      background: theme.colors.appBg,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.appBg },
          headerStyle: { backgroundColor: theme.colors.surface },
          headerShadowVisible: true,
          headerTitleAlign: "left",
          headerTitleStyle: { fontWeight: "900", fontSize: 18 },
          headerTintColor: theme.colors.text,
          headerRight: () => (
            <View style={styles.stackHeaderRightWrap}>
              <LanguageSelectorButton />
              <ThemeSelectorButton />
            </View>
          ),
        }}
      >
        {agent ? (
          <>
            <RootStack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="AccountDetail"
              getComponent={getAccountDetailScreen}
              options={{ title: t("navigation.stack.account") }}
            />
            <RootStack.Screen
              name="ExportDetail"
              getComponent={getExportDetailScreen}
              options={{ title: t("navigation.stack.exportDetails") }}
            />
            <RootStack.Screen
              name="ImportMasterData"
              getComponent={getImportMasterDataScreen}
              options={{ title: t("navigation.stack.importAccountData") }}
            />
          </>
        ) : (
          <>
            <RootStack.Screen
              name="Login"
              getComponent={getLoginScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="Register"
              getComponent={getRegisterScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="ImportMasterData"
              getComponent={getImportMasterDataScreen}
              options={{ title: t("navigation.stack.importAccountData") }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
