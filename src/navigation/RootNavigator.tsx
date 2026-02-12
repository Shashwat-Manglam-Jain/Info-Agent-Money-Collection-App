import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useApp } from '../appState/AppProvider';
import { useTheme } from '../theme';
import type { MainTabParamList, RootStackParamList } from './types';
import { Icon } from '../components/Icon';
import { AppSplashScreen } from '../screens/auth/AppSplashScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const Tab = createBottomTabNavigator<MainTabParamList>();

const getCollectScreen = () => require('../screens/collections/CollectScreen').CollectScreen;
const getAccountsScreen = () => require('../screens/accounts/AccountsScreen').AccountsScreen;
const getReportsScreen = () => require('../screens/collections/ReportsScreen').ReportsScreen;
const getSyncScreen = () => require('../screens/sync/SyncScreen').SyncScreen;

const getLoginScreen = () => require('../screens/auth/LoginScreen').LoginScreen;
const getRegisterScreen = () => require('../screens/auth/RegisterScreen').RegisterScreen;
const getAccountDetailScreen = () => require('../screens/collections/AccountDetailScreen').AccountDetailScreen;
const getImportMasterDataScreen = () => require('../screens/sync/ImportMasterDataScreen').ImportMasterDataScreen;

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
        tabBarIcon: ({ size, color, focused }) => (
          <Icon name={`tab-${route.name}${focused ? '-active' : ''}`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Collect" getComponent={getCollectScreen} options={{ title: 'Collect' }} />
      <Tab.Screen name="Accounts" getComponent={getAccountsScreen} options={{ title: 'Clients' }} />
      <Tab.Screen name="Reports" getComponent={getReportsScreen} options={{ title: 'Reports' }} />
      <Tab.Screen name="Sync" getComponent={getSyncScreen} options={{ title: 'Sync' }} />
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
            <RootStack.Screen name="AccountDetail" getComponent={getAccountDetailScreen} options={{ title: 'Account' }} />
            <RootStack.Screen
              name="ImportMasterData"
              getComponent={getImportMasterDataScreen}
              options={{ title: 'Import Daily Data' }}
            />
          </>
        ) : (
          <>
            <RootStack.Screen name="Login" getComponent={getLoginScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="Register" getComponent={getRegisterScreen} options={{ headerShown: false }} />
            <RootStack.Screen
              name="ImportMasterData"
              getComponent={getImportMasterDataScreen}
              options={{ title: 'Import Daily Data' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
