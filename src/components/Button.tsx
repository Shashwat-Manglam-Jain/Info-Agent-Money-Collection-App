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
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primary: { backgroundColor: theme.colors.primary, ...theme.shadow.card },
  secondary: {
    backgroundColor: theme.colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  danger: { backgroundColor: theme.colors.danger },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.5 },
  text: { color: theme.colors.textOnDark, fontSize: 16, fontWeight: '700' },
  textGhost: { color: theme.colors.primary },
});
