import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '../theme';
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
  const [revealed, setRevealed] = useState(false);
  const canReveal = Boolean(allowReveal && secureTextEntry);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null, disabled ? styles.inputRowDisabled : null]}>
        {leftIcon ? (
          <View style={styles.leftIcon}>
            <Icon name={leftIcon} size={18} color={theme.colors.muted} />
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
          style={styles.input}
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

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  inputRow: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputRowError: { borderColor: theme.colors.danger },
  inputRowDisabled: { opacity: 0.7 },
  leftIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  rightIcon: { marginLeft: 10, padding: 4 },
  hint: { fontSize: 12, color: theme.colors.muted },
  error: { fontSize: 12, color: theme.colors.danger, fontWeight: '700' },
});
