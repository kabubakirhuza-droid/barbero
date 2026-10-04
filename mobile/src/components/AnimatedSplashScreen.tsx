import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { Scissors } from 'lucide-react-native';
import { COLOR_PRIMARY } from '../theme/theme';

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const scissorsRotateLeft = useRef(new Animated.Value(0)).current;
  const scissorsRotateRight = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setReduceMotion(true);
      }
    } else {
      AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    }
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(onFinish, 900);
      });
      return;
    }

    // 1. Initial fade and scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Scissors snip animation (2 quick snips)
      Animated.sequence([
        // Snip 1: Close
        Animated.parallel([
          Animated.timing(scissorsRotateLeft, {
            toValue: 1,
            duration: 160,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scissorsRotateRight, {
            toValue: 1,
            duration: 160,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
        // Open
        Animated.parallel([
          Animated.timing(scissorsRotateLeft, {
            toValue: 0,
            duration: 140,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scissorsRotateRight, {
            toValue: 0,
            duration: 140,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
        // Snip 2: Close
        Animated.parallel([
          Animated.timing(scissorsRotateLeft, {
            toValue: 1,
            duration: 150,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scissorsRotateRight, {
            toValue: 1,
            duration: 150,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
        // Open back
        Animated.parallel([
          Animated.timing(scissorsRotateLeft, {
            toValue: 0,
            duration: 140,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scissorsRotateRight, {
            toValue: 0,
            duration: 140,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // 3. Smooth exit fade out
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(onFinish);
        }, 200);
      });
    });
  }, [fadeAnim, scaleAnim, scissorsRotateLeft, scissorsRotateRight, reduceMotion, onFinish]);

  const leftBladeRotation = scissorsRotateLeft.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-22deg'],
  });

  const rightBladeRotation = scissorsRotateRight.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '22deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.contentCard, { transform: [{ scale: scaleAnim }] }]}>
        {/* Animated Scissors Logo Emblem */}
        <View style={styles.iconCircle}>
          <Animated.View style={[styles.blade, { transform: [{ rotate: leftBladeRotation }] }]}>
            <Scissors size={44} color={COLOR_PRIMARY} strokeWidth={2.2} />
          </Animated.View>
        </View>

        {/* Brand Name */}
        <Text style={styles.brandTitle}>BARBERO</Text>
        <Text style={styles.brandSubtitle}>Sartaroshlar va mijozlar uchun qulay platforma</Text>

        {/* Gold Accent Bar */}
        <View style={styles.accentBar} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FBF8F4',
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FAF6F0',
    borderWidth: 2,
    borderColor: '#EFE9DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: COLOR_PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  blade: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E1B18',
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B645A',
    textAlign: 'center',
    marginTop: -4,
  },
  accentBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLOR_PRIMARY,
    marginTop: 6,
  },
});
