import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import type { Theme } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
  iconLeft?: IconName;
  iconRight?: IconName;
  iconSize?: number;
};

export function Button({ title, onPress, disabled, loading, variant = 'primary', style, iconLeft, iconRight, iconSize }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isDisabled = disabled || loading;
  const tint = variant === 'ghost' || variant === 'secondary' ? theme.colors.primary : theme.colors.textOnDark;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        pressed && !isDisabled && variant === 'primary' && styles.pressedPrimary,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : (
        <View style={styles.content}>
          {iconLeft ? <Icon name={iconLeft} size={iconSize ?? 18} color={tint} /> : null}
          <Text style={[styles.text, (variant === 'ghost' || variant === 'secondary') && styles.textGhost]}>{title}</Text>
          {iconRight ? <Icon name={iconRight} size={iconSize ?? 18} color={tint} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: 48,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    primary: {
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(7,43,94,0.1)',
      ...theme.shadow.card,
    },
    secondary: {
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    danger: {
      backgroundColor: theme.colors.danger,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(120,24,24,0.12)',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
    pressedPrimary: { opacity: 0.95 },
    disabled: { opacity: 0.55 },
    text: { color: theme.colors.textOnDark, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
    textGhost: { color: theme.colors.primary },
  });
