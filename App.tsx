import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/appState/AppProvider';
import { ThemedStatusBar } from './src/components/ThemedStatusBar';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { getDb } from './src/db/db';

export default function App() {



async function checkAgentsTable() {
  const db = await getDb();

  const result = await db.getAllAsync("PRAGMA table_info(agents);");

  console.log("Agents Table Columns:", result);
}

checkAgentsTable();

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
