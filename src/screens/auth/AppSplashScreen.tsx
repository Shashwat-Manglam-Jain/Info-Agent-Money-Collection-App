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
  return (
    <View style={styles.root}>
      <Image source={images.splash} resizeMode="cover" style={styles.bg} />
      <LinearGradient
        colors={['rgba(11,18,32,0.20)', 'rgba(11,18,32,0.92)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.logoWrap}>
            <Image source={images.appIcon} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Info Agent</Text>
          <Text style={styles.subtitle}>Money Collection</Text>
          <Text style={styles.tagline}>Fast daily / weekly / monthly collections for cooperative societies.</Text>
          <View style={{ height: 18 }} />
          <ActivityIndicator color={theme.colors.primary2} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.bg },
    bg: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: 8 },
    logoWrap: {
      width: 86,
      height: 86,
      borderRadius: theme.radii.lg,
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: { width: 56, height: 56 },
    title: { marginTop: 8, color: theme.colors.textOnDark, fontSize: 20, fontWeight: '900', textAlign: 'center' },
    subtitle: { marginTop: -2, color: theme.colors.mutedOnDark, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textAlign: 'center' },
    tagline: { marginTop: 10, color: theme.colors.mutedOnDark, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  });
