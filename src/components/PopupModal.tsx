import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import type { Theme } from '../theme';
import { Button } from './Button';

export type PopupAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  actions?: PopupAction[];
  onDismiss?: () => void;
};

export function PopupModal({ visible, title, message, actions, onDismiss }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {actions && actions.length > 0 ? (
            <View style={styles.actions}>
              {actions.map((action, index) => (
                <Button
                  key={`${action.label}-${index}`}
                  title={action.label}
                  onPress={action.onPress}
                  variant={action.variant ?? 'primary'}
                  style={{ width: '100%' }}
                />
              ))}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
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
      maxWidth: 420,
      padding: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadow.card,
    },
    title: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
    message: { marginTop: 8, fontSize: 13, lineHeight: 18, color: theme.colors.muted },
    actions: { marginTop: 14, gap: 10 },
  });
