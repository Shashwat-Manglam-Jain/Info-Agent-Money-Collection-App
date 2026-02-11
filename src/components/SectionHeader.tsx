import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import type { Theme } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  right?: ReactNode;
};

export function SectionHeader({ title, subtitle, icon, right }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.row}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Icon name={icon} size={18} color={theme.colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  subtitle: { marginTop: 2, fontSize: 13, color: theme.colors.muted },
  right: { marginLeft: 10 },
});
