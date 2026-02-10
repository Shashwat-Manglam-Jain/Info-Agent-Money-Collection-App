import { StatusBar } from 'expo-status-bar';

import { useTheme } from '../theme';

export function ThemedStatusBar() {
  const theme = useTheme();
  return <StatusBar style={theme.isDark ? 'light' : 'dark'} />;
}
