import { PropsWithChildren, ReactNode, useMemo } from 'react';
import { Image, type ImageSourcePropType, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { images } from '../assets/images';
import { useTheme } from '../theme';
import type { Theme } from '../theme';

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  heroImage?: ImageSourcePropType;
  heroImageLabel?: string;
}>;

export function AuthScreen({ title, subtitle, children, footer, heroImage, heroImageLabel }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <LinearGradient colors={[theme.colors.bg, theme.colors.bg2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.glowA} pointerEvents="none" />
        <View style={styles.glowB} pointerEvents="none" />
        <Image source={images.uiLogo} style={styles.watermark} resizeMode="contain" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brand}>
              <Image source={images.uiLogo} style={styles.logo} resizeMode="contain" />
              <Text style={styles.brandTitle}>Info Agent</Text>
              <Text style={styles.brandSub}>Money Collection</Text>
            </View>
            {heroImage ? (
              <View style={styles.heroImageWrap}>
                <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
                {heroImageLabel ? <Text style={styles.heroImageLabel}>{heroImageLabel}</Text> : null}
              </View>
            ) : null}
            <View style={styles.hero}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            <View style={styles.body}>{children}</View>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1 },
    safe: { flex: 1 },
    watermark: {
      position: 'absolute',
      right: -35,
      top: 24,
      width: 210,
      height: 210,
      opacity: 0.07,
      transform: [{ rotate: '10deg' }],
    },
    glowA: {
      position: 'absolute',
      top: -100,
      right: -80,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(109,186,255,0.20)',
    },
    glowB: {
      position: 'absolute',
      left: -90,
      bottom: -120,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: 'rgba(59,217,239,0.17)',
    },
    container: { flexGrow: 1, padding: theme.spacing.xl, gap: 16 },
    brand: { alignItems: 'center', gap: 6, marginTop: 6 },
    logo: { width: 50, height: 50 },
    brandTitle: { color: theme.colors.textOnDark, fontSize: 18, fontWeight: '900', letterSpacing: 0.45 },
    brandSub: { color: theme.colors.mutedOnDark, fontSize: 12, fontWeight: '700', letterSpacing: 1.3 },
    heroImageWrap: {
      borderRadius: theme.radii.lg + 2,
      overflow: 'hidden',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    heroImage: { width: '100%', height: 165 },
    heroImageLabel: {
      position: 'absolute',
      left: 10,
      bottom: 10,
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '800',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.3)',
      overflow: 'hidden',
    },
    hero: { alignItems: 'center', gap: 6, marginTop: 3 },
    title: { color: theme.colors.textOnDark, fontSize: 25, fontWeight: '900', textAlign: 'center' },
    subtitle: { color: theme.colors.mutedOnDark, fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
    body: { flexGrow: 1, justifyContent: 'center', gap: theme.spacing.md },
    footer: { paddingTop: 8 },
  });
