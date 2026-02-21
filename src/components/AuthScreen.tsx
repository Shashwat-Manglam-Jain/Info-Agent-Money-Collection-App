import { PropsWithChildren, ReactNode, useMemo, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { images } from "../assets/images";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";
import type { Theme } from "../theme";
import { PopupModal } from "../components/PopupModal";
import { Icon } from "../components/Icon";

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
  const { language, setLanguage, options, t } = useI18n();
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Get current language option
  const currentLanguageOption = options.find(opt => opt.language === language) || options[0];

  // Create actions for the PopupModal
  const languageActions = options.map((option) => {
    const isSelected = option.language === language;
    
    return {
      label: isSelected 
        ? `${t(option.labelKey)} (${t("common.selected")})` // Adds "(Selected)" text
        : t(option.labelKey),
      icon: option.icon,
      onPress: () => {
        setLanguage(option.language);
        setLanguageModalOpen(false);
      },
      isSelected: isSelected,
      // Style for selected item - green background
      style: isSelected ? { 
        backgroundColor: theme.colors.success, // Green background for selected
        borderColor: theme.colors.success,
      } : {
        backgroundColor: theme.isDark ? '#2A2A2A' : '#F5F5F5', // Dark grey for dark mode, light grey for light mode
        borderColor: theme.colors.border,
      },
      // Text style for selected item
      textStyle: isSelected ? {
        color: '#FFFFFF', // White text on green background
        fontWeight: '600',
      } : {
        color: theme.colors.text,
      },
    };
  });

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
            {/* Language Selector */}
            <View style={styles.languageRow}>
              <Pressable
                onPress={() => setLanguageModalOpen(true)}
                style={styles.trigger}
                accessibilityRole="button"
                accessibilityLabel={t("navigation.language.accessibilityLabel")}
              >
                <Icon 
                  name={currentLanguageOption.icon} 
                  size={16} 
                  color={theme.colors.primary} 
                />
                <Text style={styles.triggerText}>
                  {t(currentLanguageOption.labelKey)}
                </Text>
              </Pressable>

              <PopupModal
                visible={languageModalOpen}
                title={t("navigation.language.modalTitle")}
                message={t("navigation.language.modalMessage")}
                actions={languageActions}
                onDismiss={() => setLanguageModalOpen(false)}
              />
            </View>

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
      backgroundColor: theme.isDark
        ? "rgba(99,102,241,0.24)"
        : "rgba(109,186,255,0.20)",
    },
    glowB: {
      position: "absolute",
      left: -90,
      bottom: -120,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: theme.isDark
        ? "rgba(139,92,246,0.20)"
        : "rgba(59,217,239,0.17)",
    },
    container: {
      flexGrow: 1,
      padding: theme.spacing.md,
      gap: 1,
      paddingTop: 1,
    },
    languageRow: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    triggerText: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.colors.primary,
    },
    heroImageContainer: {
      marginTop: 0,
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