import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../app/AppProvider';
import { useTheme } from '../theme';
import type { MainTabParamList, RootStackParamList } from './types';
import { AccountsScreen } from '../screens/accounts/AccountsScreen';
import { AppSplashScreen } from '../screens/auth/AppSplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { AccountDetailScreen } from '../screens/collections/AccountDetailScreen';
import { CollectScreen } from '../screens/collections/CollectScreen';
import { ReportsScreen } from '../screens/collections/ReportsScreen';
import { ImportMasterDataScreen } from '../screens/sync/ImportMasterDataScreen';
import { SyncScreen } from '../screens/sync/SyncScreen';
import { RegisterScreen } from './../screens/auth/RegisterScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: { fontWeight: '700' },
        tabBarIcon: ({ color, size }) => {
          type IconName = keyof typeof Ionicons.glyphMap;
          const name: IconName =
            route.name === 'Collect'
              ? 'cash-outline'
              : route.name === 'Accounts'
                ? 'people-outline'
                : route.name === 'Reports'
                  ? 'stats-chart-outline'
                  : 'sync-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Collect" component={CollectScreen} options={{ title: 'Collect' }} />
      <Tab.Screen name="Accounts" component={AccountsScreen} options={{ title: 'Clients' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Tab.Screen name="Sync" component={SyncScreen} options={{ title: 'Sync' }} />
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
          headerTitleStyle: { fontWeight: '900' },
          headerTintColor: theme.colors.text,
        }}
      >
        {agent ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <RootStack.Screen name="AccountDetail" component={AccountDetailScreen} options={{ title: 'Account' }} />
            <RootStack.Screen
              name="ImportMasterData"
              component={ImportMasterDataScreen}
              options={{ title: 'Import Daily Data' }}
            />
          </>
        ) : (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <RootStack.Screen
              name="ImportMasterData"
              component={ImportMasterDataScreen}
              options={{ title: 'Import Daily Data' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
