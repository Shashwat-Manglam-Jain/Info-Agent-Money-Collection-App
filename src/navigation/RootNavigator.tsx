import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../app/AppProvider';
import { theme } from '../theme';
import type { MainTabParamList, RootStackParamList } from './types';
import { AccountsScreen } from '../screens/accounts/AccountsScreen';
import { AppSplashScreen } from '../screens/auth/AppSplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { AccountDetailScreen } from '../screens/collections/AccountDetailScreen';
import { CollectScreen } from '../screens/collections/CollectScreen';
import { ReportsScreen } from '../screens/collections/ReportsScreen';
import { ImportMasterDataScreen } from '../screens/sync/ImportMasterDataScreen';
import { NewAccountRequestScreen } from '../screens/sync/NewAccountRequestScreen';
import { PendingRequestsScreen } from '../screens/sync/PendingRequestsScreen';
import { SyncScreen } from '../screens/sync/SyncScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
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

  if (!ready) return <AppSplashScreen />;

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.appBg,
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
              options={{ title: 'Import Data' }}
            />
            <RootStack.Screen
              name="NewAccountRequest"
              component={NewAccountRequestScreen}
              options={{ title: 'New Request' }}
            />
            <RootStack.Screen
              name="PendingRequests"
              component={PendingRequestsScreen}
              options={{ title: 'Pending Requests' }}
            />
          </>
        ) : (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <RootStack.Screen
              name="ImportMasterData"
              component={ImportMasterDataScreen}
              options={{ title: 'Import Data' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
