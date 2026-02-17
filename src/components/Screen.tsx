import { PropsWithChildren, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../theme";
import type { Theme } from "../theme";

const MAX_CONTENT_WIDTH = 760;

export function Screen({ children }: PropsWithChildren) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <BackgroundLayer />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <View style={styles.screenContentWrap}>
            <View style={styles.screenContent}>{children}</View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function ScrollScreen({ children }: PropsWithChildren) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <BackgroundLayer />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.scrollContentWrap}>
              <View style={styles.scrollInnerContent}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BackgroundLayer() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wave, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [wave]);

  const glowAScale = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const glowBScale = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [1.18, 1],
  });
  const glowATranslateY = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });
  const glowBTranslateY = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });

  const particle1TranslateY = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });
  const particle1TranslateX = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  const particle2TranslateY = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });
  const particle2TranslateX = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });
  const particle3TranslateY = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  return (
    <>
      <LinearGradient
        colors={[theme.colors.appBg, theme.colors.appBg2, theme.colors.surfaceTint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          theme.isDark ? styles.darkGlowA : styles.lightGlowA,
          { transform: [{ scale: glowAScale }, { translateY: glowATranslateY }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          theme.isDark ? styles.darkGlowB : styles.lightGlowB,
          { transform: [{ scale: glowBScale }, { translateY: glowBTranslateY }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.particleBase,
          theme.isDark ? styles.darkParticle1 : styles.lightParticle1,
          { transform: [{ translateY: particle1TranslateY }, { translateX: particle1TranslateX }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.particleBase,
          theme.isDark ? styles.darkParticle2 : styles.lightParticle2,
          { transform: [{ translateY: particle2TranslateY }, { translateX: particle2TranslateX }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.particleBase,
          theme.isDark ? styles.darkParticle3 : styles.lightParticle3,
          { transform: [{ translateY: particle3TranslateY }] },
        ]}
        pointerEvents="none"
      />
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
      paddingHorizontal: 8, // 👈 side spacing only
      paddingTop: 6, // 👈 reduce top gap
      paddingBottom: 0, // 👈 REMOVE bottom gap
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 8,
      paddingTop: 6,
      paddingBottom: 0, // 👈 REMOVE bottom gap
    },

    screenContentWrap: {
      flex: 1,
      width: "100%",
      alignSelf: "center",
      maxWidth: MAX_CONTENT_WIDTH,
    },
    screenContent: {
      flex: 1,
      gap: 12,
    },
    scrollContentWrap: {
      width: "100%",
      alignSelf: "center",
      maxWidth: MAX_CONTENT_WIDTH,
    },
    scrollInnerContent: {
      gap: 12,
    },
    footer: {
      marginTop: 8,
      marginBottom: 4,
      textAlign: "center",
      color: theme.colors.muted,
      fontSize: 11,
      fontWeight: "600",
      opacity: 0.88,
    },
    lightGlowA: {
      position: "absolute",
      top: -120,
      right: -80,
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: "rgba(15,106,246,0.16)",
    },
    lightGlowB: {
      position: "absolute",
      bottom: -140,
      left: -100,
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: "rgba(0,178,212,0.14)",
    },
    darkGlowA: {
      position: "absolute",
      top: -130,
      right: -70,
      width: 330,
      height: 330,
      borderRadius: 165,
      backgroundColor: "rgba(99,102,241,0.20)",
    },
    darkGlowB: {
      position: "absolute",
      bottom: -150,
      left: -100,
      width: 340,
      height: 340,
      borderRadius: 170,
      backgroundColor: "rgba(139,92,246,0.17)",
    },
    particleBase: {
      position: "absolute",
      borderRadius: 999,
    },
    lightParticle1: {
      top: "23%",
      right: "18%",
      width: 7,
      height: 7,
      backgroundColor: "rgba(15,106,246,0.28)",
    },
    lightParticle2: {
      bottom: "28%",
      left: "14%",
      width: 10,
      height: 10,
      backgroundColor: "rgba(0,178,212,0.26)",
    },
    lightParticle3: {
      top: "44%",
      left: "25%",
      width: 5,
      height: 5,
      backgroundColor: "rgba(15,106,246,0.22)",
    },
    darkParticle1: {
      top: "23%",
      right: "18%",
      width: 7,
      height: 7,
      backgroundColor: "rgba(129,140,248,0.45)",
    },
    darkParticle2: {
      bottom: "28%",
      left: "14%",
      width: 10,
      height: 10,
      backgroundColor: "rgba(139,92,246,0.37)",
    },
    darkParticle3: {
      top: "44%",
      left: "25%",
      width: 5,
      height: 5,
      backgroundColor: "rgba(236,72,153,0.32)",
    },
  });
