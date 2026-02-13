import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme';
import type { Theme } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'numeric';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  hint?: string;
  error?: string;
  leftIcon?: IconName;
  allowReveal?: boolean;
  disabled?: boolean;
  autoCorrect?: boolean;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry,
  autoCapitalize = 'none',
  hint,
  error,
  leftIcon,
  allowReveal,
  disabled,
  autoCorrect = true,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const canReveal = Boolean(allowReveal && secureTextEntry);
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, focused && styles.labelFocused, disabled && styles.labelDisabled]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused ? styles.inputRowFocused : null,
          error ? styles.inputRowError : null,
          disabled ? styles.inputRowDisabled : null,
        ]}
      >
        {leftIcon ? (
          <View style={styles.leftIcon}>
            <Icon name={leftIcon} size={18} color={focused ? theme.colors.primary : theme.colors.muted} />
          </View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.muted}
          keyboardType={keyboardType}
          secureTextEntry={Boolean(secureTextEntry && !revealed)}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={!disabled}
          selectionColor={theme.colors.primary}
          style={[styles.input, disabled && styles.inputDisabled]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {canReveal ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide PIN' : 'Show PIN'}
            onPress={() => setRevealed((v) => !v)}
            style={styles.rightIcon}
            hitSlop={10}
          >
            <Icon name={revealed ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { gap: 7 },
    label: { fontSize: 12, fontWeight: '800', color: theme.colors.muted, letterSpacing: 0.35 },
    labelFocused: { color: theme.colors.primary },
    labelDisabled: { opacity: 0.7 },
    inputRow: {
      backgroundColor: theme.colors.surfaceTint,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.sm + 2,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputRowFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    inputRowError: { borderColor: theme.colors.danger },
    inputRowDisabled: { opacity: 0.68 },
    leftIcon: { marginRight: 10 },
    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.colors.text,
    },
    inputDisabled: { color: theme.colors.muted },
    rightIcon: { marginLeft: 10, padding: 4 },
    hint: { fontSize: 12, color: theme.colors.muted, lineHeight: 16 },
    error: { fontSize: 12, color: theme.colors.danger, fontWeight: '700', lineHeight: 16 },
  });
