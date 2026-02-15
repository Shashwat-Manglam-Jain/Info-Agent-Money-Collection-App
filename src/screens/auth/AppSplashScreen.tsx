// import { useMemo } from 'react';
// import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import { images } from '../../assets/images';
// import { useTheme } from '../../theme';
// import type { Theme } from '../../theme';

// export function AppSplashScreen() {
//   const theme = useTheme();
//   const styles = useMemo(() => makeStyles(theme), [theme]);
//   const overlayColors = theme.isDark
//     ? (['rgba(11,18,32,0.20)', 'rgba(11,18,32,0.92)'] as const)
//     : (['rgba(248,250,252,0.35)', 'rgba(226,232,240,0.92)'] as const);
//   return (
//     <View style={styles.root}>
//       <Image source={images.splash} resizeMode="cover" style={styles.bg} />
//       <LinearGradient
//         colors={overlayColors}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={StyleSheet.absoluteFill}
//       />
//       <SafeAreaView style={styles.safe}>
//         <View style={styles.center}>
//           <View style={styles.logoWrap}>
//             <Image source={images.uiLogo} style={styles.logo} resizeMode="contain" />
//           </View>
//           <Text style={styles.title}>Infopath Solutions</Text>
//           <Text style={styles.subtitle}>to innovate your business process</Text>
//           <Text style={styles.tagline}>Smart collections and reporting for cooperative societies.</Text>
//           <Text style={styles.poweredBy}>Powered by Infopath Solutions</Text>
//           <View style={{ height: 18 }} />
//           <ActivityIndicator color={theme.colors.primary2} />
//         </View>
//       </SafeAreaView>
//     </View>
//   );
// }

// const makeStyles = (theme: Theme) =>
//   StyleSheet.create({
//     root: { flex: 1, backgroundColor: theme.colors.appBg },
//     bg: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
//     safe: { flex: 1 },
//     center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: 8 },
//     logoWrap: {
//       width: 92,
//       height: 92,
//       borderRadius: theme.radii.lg,
//       backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : theme.colors.surface,
//       borderWidth: 1,
//       borderColor: theme.isDark ? 'rgba(255,255,255,0.18)' : theme.colors.border,
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     logo: { width: 60, height: 60 },
//     title: {
//       marginTop: 8,
//       color: theme.colors.primary,
//       fontSize: 22,
//       fontWeight: '900',
//       textAlign: 'center',
//     },
//     subtitle: {
//       marginTop: -2,
//       color: theme.isDark ? theme.colors.textOnDark : theme.colors.text,
//       fontSize: 12,
//       fontWeight: '700',
//       letterSpacing: 0.8,
//       textAlign: 'center',
//     },
//     tagline: {
//       marginTop: 10,
//       color: theme.isDark ? theme.colors.mutedOnDark : theme.colors.muted,
//       fontSize: 13,
//       textAlign: 'center',
//       lineHeight: 18,
//     },
//     poweredBy: {
//       marginTop: 4,
//       color: theme.isDark ? theme.colors.mutedOnDark : theme.colors.muted,
//       fontSize: 11,
//       textAlign: 'center',
//     },
//   });




import { useMemo, useEffect, useRef } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { images } from '../../assets/images';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

export function AppSplashScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const overlayColors = theme.isDark
    ? (['rgba(0,10,25,0.95)', 'rgba(25,45,70,0.85)', 'rgba(10,25,45,0.98)'] as const)
    : (['rgba(248,250,252,0.35)', 'rgba(226,232,240,0.92)'] as const);

  useEffect(() => {
    // Sequence animations
    Animated.sequence([
      // Initial fade in and scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      
      // Slide up text after logo appears
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
    ]).start();

    // Continuous pulse animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Cleanup animations on unmount
    return () => {
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
      slideUpAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };

  }, []);

  return (
    <View style={styles.root}>
      {/* Background image with fade animation */}
      <Animated.Image 
        source={images.splash} 
        resizeMode="cover" 
        style={[styles.bg, { opacity: fadeAnim }]} 
      />
      
      {/* Gradient overlay */}
      <LinearGradient
        colors={overlayColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {/* Animated logo with pulse effect */}
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) },
                ],
              },
            ]}
          >
            <View style={styles.logoInner}>
              <Image source={images.uiLogo} style={styles.logo} resizeMode="contain" />
            </View>
          </Animated.View>

          {/* Animated text elements */}
          <Animated.View style={{ transform: [{ translateY: slideUpAnim }], opacity: fadeAnim }}>
            <Text style={styles.title}>InfoPath Solutions</Text>
          </Animated.View>

          <Animated.View style={{ transform: [{ translateY: slideUpAnim }], opacity: fadeAnim }}>
            <Text style={styles.subtitle}>to innovate your business process</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.taglineContainer,
              { 
                transform: [{ translateY: slideUpAnim }], 
                opacity: fadeAnim,
              }
            ]}
          >
            <LinearGradient
              colors={['transparent', theme.isDark ? 'rgba(0,150,255,0.15)' : 'rgba(0,0,0,0.05)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.taglineGradient}
            >
              <Text style={styles.tagline}>
                Smart collections and reporting for cooperative societies.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Powered by */}
          <Animated.View 
            style={[
              styles.poweredByContainer,
              { 
                transform: [{ translateY: slideUpAnim }], 
                opacity: fadeAnim,
              }
            ]}
          >
            <Text style={styles.poweredBy}>Powered by </Text>
            <Text style={styles.infopathText}>InfoPath</Text>
          </Animated.View>

          <View style={{ height: 24 }} />
          
          {/* Loading indicator */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <ActivityIndicator size="large" color={theme.isDark ? '#00A3FF' : theme.colors.primary} />
          </Animated.View>

          {/* Loading text */}
          <Animated.View style={{ opacity: fadeAnim, marginTop: 12 }}>
            <Text style={styles.loadingText}>Loading amazing experience...</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { 
      flex: 1, 
      backgroundColor: theme.isDark ? '#0A0F1E' : theme.colors.appBg 
    },
    bg: { 
      ...StyleSheet.absoluteFillObject, 
      opacity: theme.isDark ? 0.4 : 0.35,
    },
    safe: { flex: 1 },
    center: { 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 24, 
      gap: 8 
    },
    logoWrap: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.isDark 
        ? 'rgba(0, 100, 255, 0.15)' 
        : 'rgba(255,255,255,0.10)',
      borderWidth: 2,
      borderColor: theme.isDark 
        ? 'rgba(0, 150, 255, 0.5)' 
        : 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.isDark ? '#0066FF' : '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: theme.isDark ? 0.8 : 0.3,
      shadowRadius: 20,
      elevation: 10,
      marginBottom: 16,
    },
    logoInner: {
      width: 80,
      height: 80,
      borderRadius: 40,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : 'transparent',
    },
    logo: { width: 50, height: 50 },
    title: {
      marginTop: 8,
      color: theme.isDark ? '#FFFFFF' : theme.colors.primary,
      fontSize: 28,
      fontWeight: '900',
      textAlign: 'center',
      letterSpacing: 1,
      textShadowColor: theme.isDark ? 'rgba(0,150,255,0.5)' : 'transparent',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    subtitle: {
      marginTop: -2,
      color: theme.isDark ? '#CCCCCC' : theme.colors.textOnDark,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 1.2,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    taglineContainer: {
      marginTop: 20,
      width: '100%',
      overflow: 'hidden',
    },
    taglineGradient: {
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    tagline: {
      color: theme.isDark ? '#E0E0E0' : theme.colors.mutedOnDark,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
      fontWeight: '400',
    },
    poweredByContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    poweredBy: {
      color: theme.isDark ? '#999999' : theme.colors.muted,
      fontSize: 13,
      textAlign: 'center',
    },
    infopathText: {
      color: theme.isDark ? '#00A3FF' : theme.colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    loadingText: {
      color: theme.isDark ? '#666666' : '#999999',
      fontSize: 12,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
  });