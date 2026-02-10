import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import type { Theme } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  title: string;
  message?: string;
};

export function EmptyState({ icon, title, message }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Icon name={icon} size={22} color={theme.colors.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 18, paddingHorizontal: 10 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 10, fontSize: 14, fontWeight: '900', color: theme.colors.text, textAlign: 'center' },
  message: { marginTop: 6, fontSize: 13, color: theme.colors.muted, textAlign: 'center', lineHeight: 18 },
});
