import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../appState/AppProvider';
import { listAgentProfiles } from '../db/repo';
import { useTheme } from '../theme';
import type { Theme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { Card } from './Card';
import { Icon } from './Icon';
import { PopupModal, type PopupAction } from './PopupModal';
import { SectionHeader } from './SectionHeader';

export function SocietySwitcherCard() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent, switchProfile } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);

  const closePopup = () => setPopup(null);

  const handleSwitch = useCallback(
    async (societyId: string, agentId: string) => {
      closePopup();
      const ok = await switchProfile({ societyId, agentId });
      if (!ok) {
        setPopup({
          title: 'Switch failed',
          message: 'Could not switch to the selected society/agent. Please try again.',
          actions: [{ label: 'OK', onPress: closePopup }],
        });
      }
    },
    [closePopup, switchProfile]
  );

  const openSwitcher = useCallback(async () => {
    if (!db || !society || !agent) return;
    const profiles = await listAgentProfiles(db);
    const options = profiles.filter((p) => !(p.agent.id === agent.id && p.society.id === society.id));
    if (options.length === 0) {
      setPopup({
        title: 'No other societies',
        message: 'Import another society/agent file to switch.',
        actions: [{ label: 'OK', onPress: closePopup }],
      });
      return;
    }
    setPopup({
      title: 'Switch Society',
      message: 'Select a society and agent to continue.',
      actions: [
        { label: 'Cancel', variant: 'ghost', onPress: closePopup },
        ...options.map((p) => ({
          label: `${p.society.name} (${p.society.code})\nAgent: ${p.agent.code} • ${p.agent.name}`,
          onPress: () => handleSwitch(p.society.id, p.agent.id),
        })),
      ],
    });
  }, [agent, closePopup, db, handleSwitch, society]);

  return (
    <Card>
      <SectionHeader
        title="Company & Agent"
        subtitle="Current working profile"
        icon="business-outline"
        right={(
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => nav.navigate('ImportMasterData', { mode: 'replace' })}
              style={styles.switchButton}
              accessibilityLabel="Add society"
            >
              <Icon name="add-circle-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.switchText}>Add</Text>
            </Pressable>
            <Pressable onPress={openSwitcher} style={styles.switchButton} accessibilityLabel="Change society">
              <Icon name="swap-horizontal-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.switchText}>Change</Text>
            </Pressable>
          </View>
        )}
      />
      <View style={styles.identityCard}>
        <View style={styles.identityIconWrap}>
          <Icon name="company" size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.identityBody}>
          <Text style={styles.identityLabel}>Company</Text>
          <Text style={styles.identityName} numberOfLines={1}>
            {society?.name ?? '—'}
          </Text>
        </View>
        <View style={styles.codeChip}>
          <Text style={styles.codeChipText}>{society?.code ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.identityCard}>
        <View style={styles.identityIconWrap}>
          <Icon name="agent" size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.identityBody}>
          <Text style={styles.identityLabel}>Agent</Text>
          <Text style={styles.identityName} numberOfLines={1}>
            {agent?.name ?? '—'}
          </Text>
        </View>
        <View style={styles.codeChip}>
          <Text style={styles.codeChipText}>{agent?.code ?? '—'}</Text>
        </View>
      </View>

      <PopupModal
        visible={!!popup}
        title={popup?.title ?? ''}
        message={popup?.message}
        actions={popup?.actions}
        onDismiss={closePopup}
      />
    </Card>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    switchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    switchText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary, letterSpacing: 0.2 },
    identityCard: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.sm + 2,
      backgroundColor: theme.colors.surfaceTint,
      paddingHorizontal: 11,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    identityIconWrap: {
      width: 30,
      height: 30,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    identityBody: { flex: 1, minWidth: 0 },
    identityLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    identityName: {
      marginTop: 2,
      fontSize: 14,
      fontWeight: '900',
      color: theme.colors.text,
    },
    codeChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    codeChipText: {
      fontSize: 12,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: 0.2,
    },
  });
