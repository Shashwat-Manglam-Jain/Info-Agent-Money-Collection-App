import { PropsWithChildren, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme';
import type { Theme } from '../theme';

export function Screen({ children }: PropsWithChildren) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[theme.colors.appBg, theme.colors.appBg2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.container}>
        <View style={styles.content}>{children}</View>
        <Text style={styles.footer}>Powered by Infopath Solutions</Text>
      </View>
    </SafeAreaView>
  );
}

export function ScrollScreen({ children }: PropsWithChildren) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const scrollStyles = useMemo(() => makeScrollStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[theme.colors.appBg, theme.colors.appBg2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={scrollStyles.content}>
        {children}
        <Text style={scrollStyles.footer}>Powered by Infopath Solutions</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.appBg },
    container: { flex: 1, padding: theme.spacing.lg },
    content: { flex: 1, gap: 12 },
    footer: { marginTop: theme.spacing.md, textAlign: 'center', color: theme.colors.muted, fontSize: 11 },
  });

const makeScrollStyles = (theme: Theme) =>
  StyleSheet.create({
    content: { padding: theme.spacing.lg, gap: 12, backgroundColor: 'transparent' },
    footer: { marginTop: theme.spacing.md, textAlign: 'center', color: theme.colors.muted, fontSize: 11 },
  });
