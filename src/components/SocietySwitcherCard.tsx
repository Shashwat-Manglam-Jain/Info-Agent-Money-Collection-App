import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../appState/AppProvider';
import { listAgentProfiles } from '../db/repo';
import type { AgentProfile } from '../models/types';
import { useTheme } from '../theme';
import type { Theme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { useClientNameLocalizer, useI18n } from '../i18n';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { PopupModal, type PopupAction } from './PopupModal';
import { SectionHeader } from './SectionHeader';

function profileKey(societyId: string, agentId: string): string {
  return `${societyId}:${agentId}`;
}

export function SocietySwitcherCard() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { db, society, agent, switchProfile } = useApp();
  const { t } = useI18n();
  const localizeName = useClientNameLocalizer();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [selectedProfileKey, setSelectedProfileKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const closePopup = () => setPopup(null);
  const closeSwitcher = useCallback(() => {
    setSwitcherVisible(false);
    setQuery('');
  }, []);

  const currentProfileKey = society && agent ? profileKey(society.id, agent.id) : null;

  const orderedProfiles = useMemo(() => {
    const list = [...profiles];
    list.sort((a, b) => {
      const aIsCurrent = currentProfileKey === profileKey(a.society.id, a.agent.id);
      const bIsCurrent = currentProfileKey === profileKey(b.society.id, b.agent.id);
      if (aIsCurrent !== bIsCurrent) return aIsCurrent ? -1 : 1;
      const societyCmp = a.society.name.localeCompare(b.society.name);
      if (societyCmp !== 0) return societyCmp;
      return a.agent.name.localeCompare(b.agent.name);
    });
    return list;
  }, [profiles, currentProfileKey]);

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orderedProfiles;
    return orderedProfiles.filter((p) =>
      `${p.society.name} ${p.society.code} ${p.agent.name} ${p.agent.code}`.toLowerCase().includes(q)
    );
  }, [orderedProfiles, query]);

  const canSwitch =
    Boolean(selectedProfileKey) &&
    Boolean(currentProfileKey) &&
    selectedProfileKey !== currentProfileKey;

  const openSwitcher = useCallback(async () => {
    if (!db || !society || !agent) return;
    const allProfiles = await listAgentProfiles(db);
    const hasAnother = allProfiles.some((p) => p.agent.id !== agent.id || p.society.id !== society.id);
    if (!hasAnother) {
      setPopup({
        title: 'No other societies',
        message: 'Import another society/agent file to switch.',
        actions: [{ label: 'OK', onPress: closePopup }],
      });
      return;
    }
    setProfiles(allProfiles);
    setSelectedProfileKey(profileKey(society.id, agent.id));
    setQuery('');
    setSwitcherVisible(true);
  }, [agent, closePopup, db, society]);

  const applySwitch = useCallback(async () => {
    if (!selectedProfileKey || !currentProfileKey || selectedProfileKey === currentProfileKey) {
      closeSwitcher();
      return;
    }
    const selected = profiles.find(
      (p) => profileKey(p.society.id, p.agent.id) === selectedProfileKey
    );
    if (!selected) return;
    closeSwitcher();
    const ok = await switchProfile({ societyId: selected.society.id, agentId: selected.agent.id });
    if (!ok) {
      setPopup({
        title: 'Switch failed',
        message: 'Could not switch to the selected society/agent. Please try again.',
        actions: [{ label: 'OK', onPress: closePopup }],
      });
    }
  }, [closePopup, closeSwitcher, currentProfileKey, profiles, selectedProfileKey, switchProfile]);

  const renderProfileItem = useCallback(
    ({ item }: { item: AgentProfile }) => {
      const key = profileKey(item.society.id, item.agent.id);
      const isCurrent = key === currentProfileKey;
      const isSelected = key === selectedProfileKey;
      return (
        <Pressable
          onPress={() => setSelectedProfileKey(key)}
          style={[
            styles.profileRow,
            isCurrent && styles.profileRowCurrent,
            isSelected && styles.profileRowSelected,
          ]}
        >
          <View style={styles.profileTextWrap}>
            <Text style={styles.profileTitle} numberOfLines={1}>
              {localizeName(item.society.name)} ({item.society.code})
            </Text>
            <Text style={styles.profileSub} numberOfLines={1}>
              {t('profile.item.agentLine', {
                agentCode: item.agent.code,
                agentName: localizeName(item.agent.name),
              })}
            </Text>
          </View>
          <View
            style={[
              styles.profileBadge,
              isCurrent && styles.profileBadgeCurrent,
              isSelected && styles.profileBadgeSelected,
            ]}
          >
            <Text
              style={[
                styles.profileBadgeText,
                isCurrent && styles.profileBadgeTextCurrent,
                isSelected && styles.profileBadgeTextSelected,
              ]}
            >
              {isCurrent ? 'Current' : isSelected ? 'Selected' : 'Tap'}
            </Text>
          </View>
        </Pressable>
      );
    },
    [currentProfileKey, selectedProfileKey, styles]
  );

  return (
    <Card>
      <SectionHeader
        title={t('profile.card.title')}
        subtitle={t('profile.card.subtitle')}
        icon="business-outline"
        right={(
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => nav.navigate('ImportMasterData', { mode: 'replace' })}
              style={styles.switchButton}
              accessibilityLabel="Add society"
            >
              <Icon name="add-circle-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.switchText}>{t('profile.button.add')}</Text>
            </Pressable>
            <Pressable onPress={openSwitcher} style={styles.switchButton} accessibilityLabel="Change society">
              <Icon name="swap-horizontal-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.switchText}>{t('profile.button.change')}</Text>
            </Pressable>
          </View>
        )}
      />
      <View style={styles.identityCard}>
        <View style={styles.identityIconWrap}>
          <Icon name="company" size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.identityBody}>
          <Text style={styles.identityLabel}>{t('labels.company')}</Text>
          <Text style={styles.identityName} numberOfLines={1}>
            {society?.name ? localizeName(society.name) : '—'}
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
          <Text style={styles.identityLabel}>{t('labels.agent')}</Text>
          <Text style={styles.identityName} numberOfLines={1}>
            {agent?.name ? localizeName(agent.name) : '—'}
          </Text>
        </View>
        <View style={styles.codeChip}>
          <Text style={styles.codeChipText}>{agent?.code ?? '—'}</Text>
        </View>
      </View>

      <Modal transparent animationType="fade" visible={switcherVisible} onRequestClose={closeSwitcher}>
        <View style={styles.switcherBackdrop}>
          <Pressable style={styles.switcherBackdropDismiss} onPress={closeSwitcher} />
          <View style={styles.switcherCard}>
            <Text style={styles.switcherTitle}>Switch Society</Text>
            <Text style={styles.switcherSubtitle}>
              Tap a profile to select. Selected row changes color.
            </Text>

            <View style={styles.searchRow}>
              <Icon name="search-outline" size={17} color={theme.colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search company or agent..."
                placeholderTextColor={theme.colors.muted}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.countText}>
              {filteredProfiles.length} / {profiles.length} profiles
            </Text>

            {filteredProfiles.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No profile found for this search.</Text>
              </View>
            ) : (
              <FlatList
                data={filteredProfiles}
                keyExtractor={(item) => profileKey(item.society.id, item.agent.id)}
                renderItem={renderProfileItem}
                style={styles.profileList}
                contentContainerStyle={styles.profileListContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                nestedScrollEnabled
                showsVerticalScrollIndicator
                initialNumToRender={12}
              />
            )}

            <View style={styles.switcherActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={closeSwitcher}
                style={styles.switcherActionButton}
              />
              <Button
                title={canSwitch ? 'Switch Select' : 'Already Select'}
                onPress={() => void applySwitch()}
                disabled={!canSwitch}
                iconLeft={canSwitch ? 'swap-horizontal-outline' : undefined}
                style={styles.switcherActionButton}
              />
            </View>
          </View>
        </View>
      </Modal>

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
      marginTop: 5,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.sm + 2,
      backgroundColor: theme.colors.surfaceTint,
      paddingHorizontal: 9,
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
    switcherBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    switcherBackdropDismiss: {
      ...StyleSheet.absoluteFillObject,
    },
    switcherCard: {
      width: '100%',
      maxWidth: 460,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      ...theme.shadow.card,
    },
    switcherTitle: {
      fontSize: 17,
      fontWeight: '900',
      color: theme.colors.text,
    },
    switcherSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.muted,
      lineHeight: 17,
    },
    searchRow: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radii.sm + 2,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.text,
    },
    countText: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.muted,
    },
    profileList: {
      marginTop: 8,
      maxHeight: 420,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    profileListContent: {
      padding: 8,
      gap: 8,
    },
    profileRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.sm + 2,
      paddingHorizontal: 10,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    profileRowCurrent: {
      borderColor: theme.colors.success,
      backgroundColor: theme.isDark ? 'rgba(67,217,161,0.12)' : 'rgba(22,163,74,0.08)',
    },
    profileRowSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 2,
    },
    profileTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    profileTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: theme.colors.text,
    },
    profileSub: {
      marginTop: 2,
      fontSize: 12,
      color: theme.colors.muted,
      lineHeight: 16,
    },
    profileBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    profileBadgeCurrent: {
      borderColor: theme.colors.success,
      backgroundColor: theme.isDark ? 'rgba(67,217,161,0.2)' : 'rgba(22,163,74,0.14)',
    },
    profileBadgeSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    profileBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.muted,
    },
    profileBadgeTextCurrent: {
      color: theme.colors.success,
    },
    profileBadgeTextSelected: {
      color: theme.colors.primary,
    },
    emptyState: {
      marginTop: 10,
      padding: 12,
      borderRadius: theme.radii.sm + 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    emptyStateText: {
      fontSize: 12,
      color: theme.colors.muted,
    },
    switcherActions: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    switcherActionButton: {
      flex: 1,
    },
  });
