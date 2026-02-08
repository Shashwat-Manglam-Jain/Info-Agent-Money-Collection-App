import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../theme';

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.appBg },
  container: { flex: 1, padding: 16 },
});

export function ScrollScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={scrollStyles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const scrollStyles = StyleSheet.create({
  content: { padding: 16, gap: 12, backgroundColor: theme.colors.appBg },
});
