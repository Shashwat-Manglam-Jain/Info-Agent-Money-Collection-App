import { PropsWithChildren, ReactNode } from 'react';
import { Image, type ImageSourcePropType, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { images } from '../assets/images';
import { theme } from '../theme';

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  heroImage?: ImageSourcePropType;
  heroImageLabel?: string;
}>;

export function AuthScreen({ title, subtitle, children, footer}: Props) {
  return (
    <LinearGradient colors={[theme.colors.bg, theme.colors.bg2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>

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
         
                <Image source={images.logo} style={styles.logo} resizeMode="contain" />
            
              <Text style={styles.brandTitle}>Info Agent</Text>
              <Text style={styles.brandSub}>Money Collection</Text>
            </View>
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  watermark: {
    position: 'absolute',
    right: -60,
    top: 40,
    width: 240,
    height: 240,
    opacity: 0.12,
    transform: [{ rotate: '8deg' }],
  },
  container: { flexGrow: 1, padding: theme.spacing.xl, gap: 14 },
  brand: { alignItems: 'center', gap: 6, marginTop: 4 },
  logo: { width: 46, height: 46 },
  brandTitle: { color: theme.colors.textOnDark, fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  brandSub: { color: theme.colors.mutedOnDark, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  heroImageWrap: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroImage: { width: '100%', height: 170 },
  hero: { alignItems: 'center', gap: 6, marginTop: 2 },
  title: { color: theme.colors.textOnDark, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: theme.colors.mutedOnDark, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  body: { flexGrow: 1, justifyContent: 'center', gap: theme.spacing.md },
  footer: { paddingTop: 6 },
});
