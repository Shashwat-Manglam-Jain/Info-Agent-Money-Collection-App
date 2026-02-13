import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/appState/AppProvider';
import { ThemedStatusBar } from './src/components/ThemedStatusBar';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <RootNavigator />
          <ThemedStatusBar />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
