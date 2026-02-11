import { useMemo } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import type { Theme } from '../theme';
import { Skeleton } from './Skeleton';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
};

export function LoadingModal({ visible, title = 'Working…', message = 'Please wait a moment.' }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.skeletons}>
            <Skeleton height={10} width="80%" />
            <Skeleton height={10} width="65%" />
            <Skeleton height={10} width="90%" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      padding: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadow.card,
    },
    title: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
    message: { marginTop: 4, fontSize: 13, color: theme.colors.muted },
    skeletons: { marginTop: 14, gap: 10 },
  });
