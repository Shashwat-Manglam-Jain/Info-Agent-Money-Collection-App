import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { images } from '../../assets/images';
import { theme } from '../../theme';

export function AppSplashScreen() {
  return (
    <LinearGradient colors={[theme.colors.bg, theme.colors.bg2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <Image source={images.splashIcon} style={styles.watermark} resizeMode="contain" />
        <View style={styles.center}>
          <View style={styles.logoWrap}>
            <Image source={images.appIcon} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Info Agent Money Collection</Text>
          <Text style={styles.subtitle}>Fast daily / weekly / monthly collections for cooperative societies.</Text>
          <View style={{ height: 18 }} />
          <ActivityIndicator color={theme.colors.primary2} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  watermark: {
    position: 'absolute',
    left: -60,
    bottom: -80,
    width: 300,
    height: 300,
    opacity: 0.12,
    transform: [{ rotate: '-10deg' }],
  },
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
  title: { marginTop: 6, color: theme.colors.textOnDark, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  subtitle: { marginTop: 2, color: theme.colors.mutedOnDark, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
