import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import type { Theme } from '../theme';
import { Icon, type IconName } from './Icon';

type Tone = 'error' | 'info';

type Props = {
  message: string;
  tone?: Tone;
  icon?: IconName;
};

export function InlineAlert({ message, tone = 'error', icon }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const tones = useMemo<Record<Tone, { border: string; bg: string; iconColor: string; defaultIcon: IconName }>>(
    () => ({
      error: {
        border: 'rgba(180,35,24,0.35)',
        bg: 'rgba(180,35,24,0.12)',
        iconColor: theme.colors.danger,
        defaultIcon: 'alert-circle-outline',
      },
      info: {
        border: 'rgba(56,189,248,0.35)',
        bg: 'rgba(56,189,248,0.12)',
        iconColor: theme.colors.primary,
        defaultIcon: 'information-circle-outline',
      },
    }),
    [theme]
  );
  const t = tones[tone];
  return (
    <View style={[styles.box, { borderColor: t.border, backgroundColor: t.bg }]}>
      <Icon name={icon ?? t.defaultIcon} size={18} color={t.iconColor} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: theme.radii.sm,
      borderWidth: StyleSheet.hairlineWidth,
    },
    text: { flex: 1, fontSize: 13, color: theme.colors.text, fontWeight: '700' },
  });
