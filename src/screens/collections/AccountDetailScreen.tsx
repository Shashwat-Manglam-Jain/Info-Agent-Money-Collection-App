import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../../appState/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PopupModal, type PopupAction } from '../../components/PopupModal';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { Skeleton } from '../../components/Skeleton';
import { TextField } from '../../components/TextField';
import type { RootStackParamList } from '../../navigation/types';
import type { Account, CollectionEntry } from '../../models/types';
import { getAccountById, getCollectionForAccountDate, upsertCollectionForToday } from '../../db/repo';
import { toISODate } from '../../utils/dates';
import { formatINR, paiseToRupees, rupeesToPaise } from '../../utils/money';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountDetail'>;

function paiseToRupeesText(paise: number): string {
  const r = paiseToRupees(paise);
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

export function AccountDetailScreen({ route, navigation }: Props) {
  const { accountId } = route.params;
  const { db, society, agent } = useApp();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [todayEntry, setTodayEntry] = useState<CollectionEntry | null>(null);
  const [amountText, setAmountText] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popup, setPopup] = useState<{ title: string; message?: string; actions?: PopupAction[] } | null>(null);

  const today = useMemo(() => toISODate(new Date()), []);

  const load = useCallback(async () => {
    if (!db || !agent || !society) {
      setAccount(null);
      setTodayEntry(null);
      setLoadingAccount(false);
      return;
    }
    setLoadingAccount(true);
    try {
      const a = await getAccountById({
        db,
        accountId,
        societyId: society.id,
        agentId: agent.id,
      });
      setAccount(a);
      if (!a) {
        setTodayEntry(null);
        setRemarks('');
        return;
      }
      navigation.setOptions({ title: a.accountNo });
      setAmountText((prev) => (prev ? prev : a.installmentPaise > 0 ? paiseToRupeesText(a.installmentPaise) : ''));
      const e = await getCollectionForAccountDate({
        db,
        societyId: society.id,
        agentId: agent.id,
        accountId: a.id,
        collectionDate: today,
      });
      setTodayEntry(e);
      setRemarks(e?.remarks ?? '');
    } finally {
      setLoadingAccount(false);
    }
  }, [accountId, agent, db, navigation, society, today]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const projectedBalance = useMemo(() => {
    if (!account) return null;
    const amount = rupeesToPaise(Number(amountText));
    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (account.accountType === 'LOAN') return account.balancePaise - amount;
    return account.balancePaise + amount;
  }, [account, amountText]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const applyEdit = useCallback(() => {
    if (todayEntry) {
      setAmountText(paiseToRupeesText(todayEntry.collectedPaise));
      setRemarks(todayEntry.remarks ?? '');
    }
    setToastMessage(null);
  }, [todayEntry]);

  const closePopup = () => setPopup(null);

  const showMessage = (title: string, message?: string) => {
    setPopup({
      title,
      message,
      actions: [{ label: 'OK', onPress: closePopup }],
    });
  };

  const save = async () => {
    if (!db || !society || !agent || !account) return;
    const amount = rupeesToPaise(Number(amountText));
    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage('Invalid amount', 'Enter a valid received amount.');
      return;
    }
    setSaving(true);
    try {
      const entry = await upsertCollectionForToday({
        db,
        societyId: society.id,
        agentId: agent.id,
        account,
        amountPaise: amount,
        remarks: remarks.trim() ? remarks.trim() : null,
      });
      setTodayEntry(entry);
      setAmountText(paiseToRupeesText(entry.collectedPaise));
      setRemarks(entry.remarks ?? '');
      showToast(`Successfully paid ${formatINR(entry.collectedPaise)}.`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingAccount) {
    return (
      <ScrollScreen>
        <Card>
          <View style={{ gap: 10 }}>
            <Skeleton height={20} width="65%" />
            <Skeleton height={14} width="42%" />
            <Skeleton height={14} width="78%" />
            <Skeleton height={14} width="70%" />
            <Skeleton height={14} width="62%" />
          </View>
        </Card>
        <Card>
          <View style={{ gap: 10 }}>
            <Skeleton height={16} width="52%" />
            <Skeleton height={42} width="100%" />
            <Skeleton height={42} width="100%" />
            <Skeleton height={44} width="100%" />
          </View>
        </Card>
      </ScrollScreen>
    );
  }

  if (!account) {
    return (
      <ScrollScreen>
        <Card>
          <Text>Account not found.</Text>
        </Card>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <Card>
        <Text style={styles.title}>{account.clientName}</Text>
        <Text style={styles.sub}>
          {account.accountType} • {account.frequency}
        </Text>
        <View style={{ height: 10 }} />
        <Text style={styles.kv}>Account No: {account.accountNo}</Text>
        <Text style={styles.kv}>
          Account Head: {account.accountHead ?? '—'}
          {account.accountHeadCode ? ` (${account.accountHeadCode})` : ''}
        </Text>
        <Text style={styles.kv}>
          Installment: {account.installmentPaise > 0 ? formatINR(account.installmentPaise) : '—'}
        </Text>
        <Text style={styles.kv}>
          Balance: {formatINR(account.balancePaise)} {account.accountType === 'LOAN' ? '(outstanding)' : ''}
        </Text>
        <Text style={styles.kv}>Last Txn: {account.lastTxnAt ?? '—'}</Text>
        <Text style={styles.kv}>
          Opening: {account.openedAt ?? '—'} • Closing: {account.closesAt ?? '—'}
        </Text>
      </Card>

      <Card>
        <SectionHeader
          title={`Collect (${today})`}
          subtitle={
            todayEntry
              ? `Already saved today: ${formatINR(todayEntry.collectedPaise)} (${todayEntry.collectedAt})`
              : 'No entry saved today for this account.'
          }
          icon="cash-outline"
        />
        {todayEntry ? (
          <View style={styles.savedRow}>
            <Text style={styles.savedText}>Saved: {formatINR(todayEntry.collectedPaise)}</Text>
            <Pressable onPress={applyEdit} style={styles.editChip}>
              <Text style={styles.editChipText}>Edit</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={{ height: 10 }} />
        <TextField
          label="Received Amount (₹)"
          value={amountText}
          onChangeText={(v) => setAmountText(v.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
          placeholder="e.g. 50"
          leftIcon="cash-outline"
          autoCorrect={false}
        />
        <View style={{ height: 10 }} />
        <TextField
          label="Remarks (optional)"
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Cash / UPI / note…"
          leftIcon="chatbubble-ellipses-outline"
        />
        {projectedBalance !== null ? (
          <Text style={styles.projected}>Projected balance: {formatINR(projectedBalance)}</Text>
        ) : null}
        <View style={{ height: 12 }} />
        <Button
          title={saving ? 'Saving…' : todayEntry ? 'Update Collection' : 'Save Collection'}
          iconLeft="save-outline"
          onPress={save}
          disabled={saving}
        />
      </Card>
      {toastMessage ? (
        <Card style={styles.toastCard}>
          <View style={styles.toastRow}>
            <Text style={styles.toastText}>{toastMessage}</Text>
            <Pressable onPress={applyEdit} style={styles.toastAction}>
              <Text style={styles.toastActionText}>Edit</Text>
            </Pressable>
          </View>
        </Card>
      ) : null}
      <PopupModal
        visible={!!popup}
        title={popup?.title ?? ''}
        message={popup?.message}
        actions={popup?.actions}
        onDismiss={closePopup}
      />
    </ScrollScreen>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    title: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
    sub: { marginTop: 2, fontSize: 13, color: theme.colors.muted },
    kv: { marginTop: 4, fontSize: 13, color: theme.colors.text },
    projected: { marginTop: 8, fontSize: 13, color: theme.colors.muted },
    savedRow: {
      marginTop: 10,
      padding: 10,
      borderRadius: theme.radii.sm,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    savedText: { flex: 1, fontSize: 13, fontWeight: '700', color: theme.colors.text },
    editChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    editChipText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },
    toastCard: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
    },
    toastRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    toastText: { flex: 1, fontSize: 13, fontWeight: '700', color: theme.colors.text },
    toastAction: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    toastActionText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },
  });
