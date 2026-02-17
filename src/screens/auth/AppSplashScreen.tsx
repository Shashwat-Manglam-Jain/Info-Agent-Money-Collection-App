



// import { Image, StyleSheet, View, Animated, Easing } from 'react-native';
// import { useEffect, useRef } from 'react';

// import { images } from '../../assets/images';

// export function AppSplashScreen() {
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(0.9)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1000,
//         useNativeDriver: true,
//         easing: Easing.out(Easing.exp),
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         friction: 6,
//         tension: 50,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   return (
//     <View style={styles.root}>
//       {/* Background gradient (simulated with two overlapping views) */}
//       <View style={styles.gradientTop} />
//       <View style={styles.gradientBottom} />

//       {/* Animated Logo */}
//       <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
//         <View style={styles.logoContainer}>
//           <Image source={images.newlogoagent} style={styles.logo} resizeMode="contain" />
//         </View>
//       </Animated.View>

//       {/* Optional brand name */}
//       <Animated.Text style={[styles.brand, { opacity: fadeAnim }]}>Your App</Animated.Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: '#0B1120', // fallback color
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   gradientTop: {
//     position: 'absolute',
//     top: -100,
//     right: -50,
//     width: 300,
//     height: 300,
//     borderRadius: 150,
//     backgroundColor: '#3B82F6',
//     opacity: 0.1,
//     transform: [{ scale: 2 }],
//   },
//   gradientBottom: {
//     position: 'absolute',
//     bottom: -100,
//     left: -50,
//     width: 300,
//     height: 300,
//     borderRadius: 150,
//     backgroundColor: '#8B5CF6',
//     opacity: 0.1,
//     transform: [{ scale: 2 }],
//   },
//   logoContainer: {
//     width: 140,
//     height: 140,
//     borderRadius: 28,
//     backgroundColor: 'rgba(255,255,255,0.05)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#3B82F6',
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.5,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   logo: {
//     width: '70%',
//     height: '70%',
//   },
//   brand: {
//     marginTop: 20,
//     fontSize: 22,
//     fontWeight: '500',
//     color: '#FFFFFF',
//     letterSpacing: 1,
//     textShadowColor: 'rgba(59,130,246,0.5)',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 10,
//   },
// });






import { Image, StyleSheet, View, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

import { images } from '../../assets/images';

export function AppSplashScreen() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
    ]).start();

    // Continuous pulsing animation after entrance
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });

  return (
    <View style={styles.root}>
      {/* Animated Background Gradients */}
      <Animated.View 
        style={[
          styles.gradient1,
          {
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [1, 1.2],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View 
        style={[
          styles.gradient2,
          {
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [1.2, 1],
                }),
              },
            ],
          },
        ]}
      />

      {/* Floating Particles */}
      <Animated.View 
        style={[
          styles.particle1,
          {
            transform: [
              {
                translateY: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0, -15],
                }),
              },
              {
                translateX: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0, 10],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View 
        style={[
          styles.particle2,
          {
            transform: [
              {
                translateY: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0, 20],
                }),
              },
              {
                translateX: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0, -15],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View 
        style={[
          styles.particle3,
          {
            transform: [
              {
                translateY: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0, -20],
                }),
              },
            ],
          },
        ]}
      />

      {/* Main Logo with Multiple Animations */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate },
              { translateY: translateYAnim },
            ],
          },
        ]}>
        <Animated.View
          style={[
            styles.logoGlow,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}>
          <Image
            source={images.newlogoagent}
            resizeMode="contain"
            style={styles.logo}
          />
        </Animated.View>
      </Animated.View>

      {/* Animated Brand Text */}
      <Animated.View
        style={[
          styles.brandContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: translateYAnim.interpolate({
                  inputRange: [0, 30],
                  outputRange: [0, 30],
                }),
              },
            ],
          },
        ]}>
        <Animated.Text style={[styles.brandName]}>Infopath Solution</Animated.Text>
        <Animated.View style={styles.brandUnderline} />
      </Animated.View>

      {/* Animated Loading Dots */}
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        {[1, 2, 3].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.loadingDot,
              {
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: index === 1 ? [1, 1.3] : [0.8, 1.1],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: index === 1 ? [1, 0.8] : [0.6, 1],
                }),
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0F1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#6366F1',
    opacity: 0.15,
  },
  gradient2: {
    position: 'absolute',
    bottom: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#8B5CF6',
    opacity: 0.15,
  },
  particle1: {
    position: 'absolute',
    top: '20%',
    right: '20%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    opacity: 0.4,
  },
  particle2: {
    position: 'absolute',
    bottom: '30%',
    left: '15%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
    opacity: 0.3,
  },
  particle3: {
    position: 'absolute',
    top: '40%',
    left: '25%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EC4899',
    opacity: 0.3,
  },
  logoWrapper: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  logoGlow: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  logo: {
    width: '70%',
    height: '70%',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  brandUnderline: {
    width: 60,
    height: 2,
    backgroundColor: '#6366F1',
    marginTop: 8,
    borderRadius: 1,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
  },
});
