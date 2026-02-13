import { PropsWithChildren, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme';
import type { Theme } from '../theme';

const MAX_CONTENT_WIDTH = 760;

export function Screen({ children }: PropsWithChildren) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.safe}>
      <BackgroundLayer />
      <View style={styles.container}>
        <View style={styles.screenContentWrap}>
          <View style={styles.screenContent}>{children}</View>
        </View>
        <Text style={styles.footer}>Powered by Infopath Solutions</Text>
      </View>
    </SafeAreaView>
  );
}

export function ScrollScreen({ children }: PropsWithChildren) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.safe}>
      <BackgroundLayer />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContentWrap}>
          <View style={styles.scrollInnerContent}>{children}</View>
        </View>
        <Text style={styles.footer}>Powered by Infopath Solutions</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function BackgroundLayer() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <>
      <LinearGradient
        colors={[theme.colors.appBg, theme.colors.appBg2, theme.colors.surfaceTint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bubbleA} pointerEvents="none" />
      <View style={styles.bubbleB} pointerEvents="none" />
    </>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.appBg,
    },
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    screenContentWrap: {
      flex: 1,
      width: '100%',
      alignSelf: 'center',
      maxWidth: MAX_CONTENT_WIDTH,
    },
    screenContent: {
      flex: 1,
      gap: 12,
    },
    scrollContentWrap: {
      width: '100%',
      alignSelf: 'center',
      maxWidth: MAX_CONTENT_WIDTH,
    },
    scrollInnerContent: {
      gap: 12,
    },
    footer: {
      marginTop: theme.spacing.md,
      textAlign: 'center',
      color: theme.colors.muted,
      fontSize: 11,
      fontWeight: '600',
      opacity: 0.88,
    },
    bubbleA: {
      position: 'absolute',
      top: -120,
      right: -80,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: theme.isDark ? 'rgba(105,184,255,0.15)' : 'rgba(15,106,246,0.12)',
    },
    bubbleB: {
      position: 'absolute',
      bottom: -120,
      left: -100,
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: theme.isDark ? 'rgba(59,217,239,0.11)' : 'rgba(0,178,212,0.10)',
    },
  });
