import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useApp } from "../appState/AppProvider";
import { useTheme, useThemeController } from "../theme";
import type { MainTabParamList, RootStackParamList } from "./types";
import { Icon } from "../components/Icon";
import { PopupModal, type PopupAction } from "../components/PopupModal";
import { AppSplashScreen } from "../screens/auth/AppSplashScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RootStack = createNativeStackNavigator<RootStackParamList>();

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_HEADER_META: Record<
  keyof MainTabParamList,
  {
    title: string;
    icon: string;
  }
> = {
  Collect: { title: "Collect", icon: "cash-outline" },
  Accounts: { title: "Clients", icon: "people-outline" },
  Reports: { title: "Reports", icon: "bar-chart-outline" },
  Sync: { title: "Sync", icon: "sync-outline" },
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

function ThemeSelectorButton({ marginRight }: { marginRight: number }) {
  const theme = useTheme();
  const { mode, setMode, options } = useThemeController();
  const [open, setOpen] = useState(false);

  const styles = useMemo(
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

  const selectedOption = useMemo(
    () => options.find((option) => option.mode === mode) ?? options[0],
    [mode, options]
  );

  const actions = useMemo<PopupAction[]>(
    () =>
      options.map((option) => ({
        label: mode === option.mode ? `${option.label} (Selected)` : option.label,
        variant: mode === option.mode ? "primary" : "secondary",
        onPress: () => {
          setMode(option.mode);
          setOpen(false);
        },
      })),
    [mode, options, setMode]
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { marginRight }]}
        accessibilityRole="button"
        accessibilityLabel="Select theme"
      >
        <Icon name={selectedOption.icon} size={16} color={theme.colors.primary} />
        <Text style={styles.triggerText}>{selectedOption.label}</Text>
      </Pressable>
      <PopupModal
        visible={open}
        title="Choose Theme"
        message="Select the app appearance style."
        actions={actions}
        onDismiss={() => setOpen(false)}
      />
    </>
  );
}

function MainTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarBottomInset =
    Platform.OS === "android" && insets.bottom === 0 ? 24 : insets.bottom;

  const styles = StyleSheet.create({
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
  });

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
          headerTitle: tabMeta.title,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "900",
            color: theme.colors.text,
          },
          headerLeftContainerStyle: { paddingLeft: 10 },
          headerRightContainerStyle: { paddingRight: 10 },
          headerLeft: () => (
            <View style={styles.headerLeftIconWrap}>
              <Icon
                name={tabMeta.icon}
                size={16}
                color={theme.colors.primary}
              />
            </View>
          ),
          headerRight: () => <ThemeSelectorButton marginRight={8} />,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,

            height: 45+ tabBarBottomInset,
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
        options={{ title: "Collect" }}
      />
      <Tab.Screen
        name="Accounts"
        getComponent={getAccountsScreen}
        options={{ title: "Clients" }}
      />
      <Tab.Screen
        name="Reports"
        getComponent={getReportsScreen}
        options={{ title: "Reports" }}
      />
      <Tab.Screen
        name="Sync"
        getComponent={getSyncScreen}
        options={{ title: "Sync" }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { ready, agent } = useApp();
  const theme = useTheme();

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
          headerRight: () => <ThemeSelectorButton marginRight={6} />,
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
              options={{ title: "Account" }}
            />
            <RootStack.Screen
              name="ExportDetail"
              getComponent={getExportDetailScreen}
              options={{ title: "Export Details" }}
            />
            <RootStack.Screen
              name="ImportMasterData"
              getComponent={getImportMasterDataScreen}
              options={{ title: "Import Account Data" }}
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
              options={{ title: "Import Account Data" }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}



// // navigation/RootNavigator.tsx
// import { Pressable, StyleSheet, Text, View } from "react-native";
// import {
//   DarkTheme,
//   DefaultTheme,
//   NavigationContainer,
// } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { useApp } from "../appState/AppProvider";
// import { useTheme, useThemeController } from "../theme";
// import type { MainTabParamList, RootStackParamList } from "./types";
// import { Icon } from "../components/Icon";
// // import { AppSplashScreen } from "../screens/auth/AppSplashScreen"; // ❌ यह हटाएं
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// const RootStack = createNativeStackNavigator<RootStackParamList>();
// const Tab = createBottomTabNavigator<MainTabParamList>();

// const TAB_HEADER_META: Record<
//   keyof MainTabParamList,
//   {
//     title: string;
//     icon: string;
//   }
// > = {
//   Collect: { title: "Collect", icon: "cash-outline" },
//   Accounts: { title: "Clients", icon: "people-outline" },
//   Reports: { title: "Reports", icon: "bar-chart-outline" },
//   Sync: { title: "Sync", icon: "sync-outline" },
// };

// // Lazy loading functions
// const getCollectScreen = () =>
//   require("../screens/collections/CollectScreen").CollectScreen;
// const getAccountsScreen = () =>
//   require("../screens/accounts/AccountsScreen").AccountsScreen;
// const getReportsScreen = () =>
//   require("../screens/collections/ReportsScreen").ReportsScreen;
// const getSyncScreen = () => require("../screens/sync/SyncScreen").SyncScreen;
// const getLoginScreen = () => require("../screens/auth/LoginScreen").LoginScreen;
// const getRegisterScreen = () =>
//   require("../screens/auth/RegisterScreen").RegisterScreen;
// const getAccountDetailScreen = () =>
//   require("../screens/collections/AccountDetailScreen").AccountDetailScreen;
// const getExportDetailScreen = () =>
//   require("../screens/collections/ExportDetailScreen").ExportDetailScreen;
// const getImportMasterDataScreen = () =>
//   require("../screens/sync/ImportMasterDataScreen").ImportMasterDataScreen;

// function MainTabs() {
//   const theme = useTheme();
//   const { toggleTheme } = useThemeController();
//   const insets = useSafeAreaInsets();

//   const styles = StyleSheet.create({
//     headerLeftIconWrap: {
//       width: 34,
//       height: 34,
//       borderRadius: theme.radii.pill,
//       marginLeft: 8,
//       alignItems: "center",
//       justifyContent: "center",
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//       backgroundColor: theme.colors.primarySoft,
//     },
//     headerRight: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 6,
//       marginRight: 8,
//       paddingHorizontal: 12,
//       paddingVertical: 6,
//       borderRadius: theme.radii.pill,
//       borderWidth: 1,
//       borderColor: theme.colors.border,
//       backgroundColor: theme.colors.surfaceTint,
//     },
//     headerRightText: {
//       fontSize: 12,
//       fontWeight: "800",
//       color: theme.colors.primary,
//     },
//   });

//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => {
//         const tabMeta = TAB_HEADER_META[route.name];
//         return {
//           headerShown: true,
//           headerTitleAlign: "left",
//           headerStyle: {
//             backgroundColor: theme.colors.surface,
//             borderBottomColor: theme.colors.border,
//             borderBottomWidth: 1,
//           },
//           headerTintColor: theme.colors.text,
//           headerTitle: tabMeta.title,
//           headerTitleStyle: {
//             fontSize: 18,
//             fontWeight: "900",
//             color: theme.colors.text,
//           },
//           headerLeftContainerStyle: { paddingLeft: 10 },
//           headerRightContainerStyle: { paddingRight: 10 },
//           headerLeft: () => (
//             <View style={styles.headerLeftIconWrap}>
//               <Icon
//                 name={tabMeta.icon}
//                 size={16}
//                 color={theme.colors.primary}
//               />
//             </View>
//           ),
//           headerRight: () => (
//             <Pressable
//               onPress={toggleTheme}
//               style={styles.headerRight}
//               accessibilityRole="button"
//               accessibilityLabel="Toggle theme"
//             >
//               <Icon
//                 name={theme.isDark ? "sunny-outline" : "moon-outline"}
//                 size={16}
//                 color={theme.colors.primary}
//               />
//               <Text style={styles.headerRightText}>
//                 {theme.isDark ? "Light" : "Dark"}
//               </Text>
//             </Pressable>
//           ),
//           tabBarActiveTintColor: theme.colors.primary,
//           tabBarInactiveTintColor: theme.colors.muted,
//           tabBarStyle: {
//             backgroundColor: theme.colors.surface,
//             borderTopColor: theme.colors.border,
//             borderTopWidth: 1,
//             height: 64 + insets.bottom,
//             paddingTop: 4,
//             paddingBottom: 8 + insets.bottom,
//             paddingHorizontal: 8,
//           },
//           tabBarItemStyle: { paddingVertical: 1 },
//           tabBarLabelStyle: { fontWeight: "800", fontSize: 11 },
//           tabBarIcon: ({ size, color, focused }) => (
//             <Icon
//               name={`tab-${route.name}${focused ? "-active" : ""}`}
//               size={size}
//               color={color}
//             />
//           ),
//         };
//       }}
//     >
//       <Tab.Screen
//         name="Collect"
//         getComponent={getCollectScreen}
//         options={{ title: "Collect" }}
//       />
//       <Tab.Screen
//         name="Accounts"
//         getComponent={getAccountsScreen}
//         options={{ title: "Clients" }}
//       />
//       <Tab.Screen
//         name="Reports"
//         getComponent={getReportsScreen}
//         options={{ title: "Reports" }}
//       />
//       <Tab.Screen
//         name="Sync"
//         getComponent={getSyncScreen}
//         options={{ title: "Sync" }}
//       />
//     </Tab.Navigator>
//   );
// }

// export function RootNavigator() {
//   const { ready, agent } = useApp(); // ready अब true ही होगा जब यह render हो
//   const theme = useTheme();
//   const { toggleTheme } = useThemeController();

//   // ❌ यह condition हटा दी - अब splash screen सिर्फ App.js में handle होगा
//   // if (!ready) return <AppSplashScreen />;

//   const baseNavTheme = theme.isDark ? DarkTheme : DefaultTheme;
//   const navTheme = {
//     ...baseNavTheme,
//     dark: theme.isDark,
//     colors: {
//       ...baseNavTheme.colors,
//       background: theme.colors.appBg,
//       card: theme.colors.surface,
//       text: theme.colors.text,
//       border: theme.colors.border,
//       primary: theme.colors.primary,
//     },
//   };

//   return (
//     <NavigationContainer theme={navTheme}>
//       <RootStack.Navigator
//         screenOptions={{
//           contentStyle: { backgroundColor: theme.colors.appBg },
//           headerStyle: { backgroundColor: theme.colors.surface },
//           headerShadowVisible: true,
//           headerTitleAlign: "left",
//           headerTitleStyle: { fontWeight: "900", fontSize: 18 },
//           headerTintColor: theme.colors.text,
//           headerRight: () => (
//             <Pressable
//               onPress={toggleTheme}
//               style={{
//                 flexDirection: "row",
//                 alignItems: "center",
//                 gap: 6,
//                 marginRight: 6,
//                 paddingHorizontal: 10,
//                 paddingVertical: 6,
//                 borderRadius: theme.radii.pill,
//                 borderWidth: 1,
//                 borderColor: theme.colors.border,
//                 backgroundColor: theme.colors.surfaceTint,
//               }}
//               accessibilityRole="button"
//               accessibilityLabel="Toggle theme"
//             >
//               <Icon
//                 name={theme.isDark ? "sunny-outline" : "moon-outline"}
//                 size={16}
//                 color={theme.colors.primary}
//               />
//               <Text
//                 style={{
//                   fontSize: 12,
//                   fontWeight: "800",
//                   color: theme.colors.primary,
//                 }}
//               >
//                 {theme.isDark ? "Light" : "Dark"}
//               </Text>
//             </Pressable>
//           ),
//         }}
//       >
//         {agent ? (
//           <>
//             <RootStack.Screen
//               name="MainTabs"
//               component={MainTabs}
//               options={{ headerShown: false }}
//             />
//             <RootStack.Screen
//               name="AccountDetail"
//               getComponent={getAccountDetailScreen}
//               options={{ title: "Account" }}
//             />
//             <RootStack.Screen
//               name="ExportDetail"
//               getComponent={getExportDetailScreen}
//               options={{ title: "Export Details" }}
//             />
//             <RootStack.Screen
//               name="ImportMasterData"
//               getComponent={getImportMasterDataScreen}
//               options={{ title: "Import Account Data" }}
//             />
//           </>
//         ) : (
//           <>
//             <RootStack.Screen
//               name="Login"
//               getComponent={getLoginScreen}
//               options={{ headerShown: false }}
//             />
//             <RootStack.Screen
//               name="Register"
//               getComponent={getRegisterScreen}
//               options={{ headerShown: false }}
//             />
//             <RootStack.Screen
//               name="ImportMasterData"
//               getComponent={getImportMasterDataScreen}
//               options={{ title: "Import Account Data" }}
//             />
//           </>
//         )}
//       </RootStack.Navigator>
//     </NavigationContainer>
//   );
// }
