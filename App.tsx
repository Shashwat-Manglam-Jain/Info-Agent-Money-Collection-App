import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/appState/AppProvider';
import { ThemedStatusBar } from './src/components/ThemedStatusBar';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { I18nProvider } from './src/i18n';


export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <AppProvider>
            <RootNavigator />
            <ThemedStatusBar />
          </AppProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

