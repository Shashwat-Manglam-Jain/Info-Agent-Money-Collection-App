import { useMemo } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { images } from '../../assets/images';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

export function AppSplashScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const overlayColors = theme.isDark
    ? (['rgba(11,18,32,0.20)', 'rgba(11,18,32,0.92)'] as const)
    : (['rgba(248,250,252,0.35)', 'rgba(226,232,240,0.92)'] as const);
  return (
    <View style={styles.root}>
      <Image source={images.splash} resizeMode="cover" style={styles.bg} />
      <LinearGradient
        colors={overlayColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.logoWrap}>
            <Image source={images.uiLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Infopath Solutions</Text>
          <Text style={styles.subtitle}>to innovate your business process</Text>
          <Text style={styles.tagline}>Smart collections and reporting for cooperative societies.</Text>
          <Text style={styles.poweredBy}>Powered by Infopath Solutions</Text>
          <View style={{ height: 18 }} />
          <ActivityIndicator color={theme.colors.primary2} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.appBg },
    bg: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: 8 },
    logoWrap: {
      width: 92,
      height: 92,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.18)' : theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: { width: 60, height: 60 },
    title: {
      marginTop: 8,
      color: theme.colors.primary,
      fontSize: 22,
      fontWeight: '900',
      textAlign: 'center',
    },
    subtitle: {
      marginTop: -2,
      color: theme.isDark ? theme.colors.textOnDark : theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textAlign: 'center',
    },
    tagline: {
      marginTop: 10,
      color: theme.isDark ? theme.colors.mutedOnDark : theme.colors.muted,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
    },
    poweredBy: {
      marginTop: 4,
      color: theme.isDark ? theme.colors.mutedOnDark : theme.colors.muted,
      fontSize: 11,
      textAlign: 'center',
    },
  });
