import { PropsWithChildren, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../theme';
import type { Theme } from '../theme';

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function Card({ children, style }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return <View style={[styles.card, style]}>{children}</View>;
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.md + 2,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      ...theme.shadow.card,
    },
  });
