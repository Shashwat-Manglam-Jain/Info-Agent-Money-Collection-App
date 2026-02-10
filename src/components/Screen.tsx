import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../theme';

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[theme.colors.appBg, theme.colors.appBg2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.appBg },
  container: { flex: 1, padding: theme.spacing.lg, gap: 12 },
});

export function ScrollScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[theme.colors.appBg, theme.colors.appBg2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={scrollStyles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const scrollStyles = StyleSheet.create({
  content: { padding: theme.spacing.lg, gap: 12, backgroundColor: 'transparent' },
});
