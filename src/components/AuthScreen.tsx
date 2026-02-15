import { PropsWithChildren, ReactNode, useMemo } from "react";
import {
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { images } from "../assets/images";
import { useTheme } from "../theme";
import type { Theme } from "../theme";

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  heroImage?: ImageSourcePropType;
  heroImageLabel?: string;
}>;

export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  heroImage,
  heroImageLabel,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <LinearGradient
      colors={[theme.colors.bg, theme.colors.bg2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.glowA} pointerEvents="none" />
        <View style={styles.glowB} pointerEvents="none" />
        <Image
          source={images.uiLogo}
          style={styles.watermark}
          resizeMode="contain"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Remove the empty brand View completely */}

            {heroImage ? (
              <View style={styles.heroImageContainer}>
                <Image
                  source={heroImage}
                  style={styles.heroImage}
                  resizeMode="contain"
                />

                {heroImageLabel ? (
                  <Text style={styles.heroImageLabel}>{heroImageLabel}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.hero}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : null}
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
    root: {
      flex: 1,
    },
    safe: {
      flex: 1,
    },
    watermark: {
      position: "absolute",
      right: -35,
      top: 24,
      width: 210,
      height: 210,
      opacity: 0.07,
      transform: [{ rotate: "10deg" }],
    },
    glowA: {
      position: "absolute",
      top: -100,
      right: -80,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: "rgba(109,186,255,0.20)",
    },
    glowB: {
      position: "absolute",
      left: -90,
      bottom: -120,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: "rgba(59,217,239,0.17)",
    },
    container: {
      flexGrow: 1,
      padding: theme.spacing.xl,
      gap: 16,
      // Add paddingTop to control spacing from top
      paddingTop: theme.spacing.md, // Adjust this value as needed
    },
    // Remove brand style completely
    heroImageContainer: {
      // Add any container styles if needed
      marginTop: 0, // Ensure no top margin
    },
    heroImage: {
      width: "100%",
      height: 80,
    },
    heroImageLabel: {
      position: "absolute",
      left: 12,
      bottom: 12,
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "800",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.3)",
      overflow: "hidden",
    },
    hero: {
      alignItems: "center",
      gap: 8,
    },
    title: {
      color: theme.colors.textOnDark,
      fontSize: 32,
      fontWeight: "900",
      textAlign: "center",
    },
    subtitle: {
      color: theme.colors.mutedOnDark,
      fontSize: 16,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 12,
    },
    body: {
      flexGrow: 1,
      justifyContent: "center",
      gap: theme.spacing.lg,
    },
    footer: {
      paddingTop: 16,
    },
  });
