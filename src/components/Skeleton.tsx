import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import type { Theme } from '../theme';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 12, radius, style }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const opacity = useRef(new Animated.Value(0.55)).current;
  const borderRadius = radius ?? theme.radii.sm;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.base, { width, height, borderRadius, opacity }, style]}
      accessibilityLabel="Loading"
    />
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      backgroundColor: theme.colors.surfaceTint,
    },
  });
