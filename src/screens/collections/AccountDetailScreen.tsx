import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../../app/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScrollScreen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { TextField } from '../../components/TextField';
import type { RootStackParamList } from '../../navigation/types';
import type { Account, CollectionEntry } from '../../models/types';
import { getAccountById, getCollectionForAccountDate, upsertCollectionForToday } from '../../db/repo';
import { toISODate } from '../../utils/dates';
import { formatINR, paiseToRupees, rupeesToPaise } from '../../utils/money';
import { theme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountDetail'>;

function paiseToRupeesText(paise: number): string {
  const r = paiseToRupees(paise);
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

export function AccountDetailScreen({ route, navigation }: Props) {
  const { accountId } = route.params;
  const { db, society, agent } = useApp();
  const [account, setAccount] = useState<Account | null>(null);
  const [todayEntry, setTodayEntry] = useState<CollectionEntry | null>(null);
  const [amountText, setAmountText] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const today = useMemo(() => toISODate(new Date()), []);

  const load = useCallback(async () => {
    if (!db || !agent) return;
    const a = await getAccountById(db, accountId);
    setAccount(a);
    if (a) {
      navigation.setOptions({ title: a.accountNo });
      setAmountText((prev) => (prev ? prev : paiseToRupeesText(a.installmentPaise)));
      const e = await getCollectionForAccountDate({ db, agentId: agent.id, accountId: a.id, collectionDate: today });
      setTodayEntry(e);
      setRemarks(e?.remarks ?? '');
    }
  }, [accountId, agent, db, navigation, today]);

  useEffect(() => {
    void load();
  }, [load]);

  const projectedBalance = useMemo(() => {
    if (!account) return null;
    const amount = rupeesToPaise(Number(amountText));
    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (account.accountType === 'LOAN') return account.balancePaise - amount;
    return account.balancePaise + amount;
  }, [account, amountText]);

  const save = async () => {
    if (!db || !society || !agent || !account) return;
    const amount = rupeesToPaise(Number(amountText));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid received amount.');
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
      Alert.alert('Saved', `Recorded ${formatINR(entry.collectedPaise)} for ${account.accountNo}.`);
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.kv}>Installment: {formatINR(account.installmentPaise)}</Text>
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
        <Button title={saving ? 'Saving…' : 'Save Collection'} iconLeft="save-outline" onPress={save} disabled={saving} />
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  sub: { marginTop: 2, fontSize: 13, color: theme.colors.muted },
  kv: { marginTop: 4, fontSize: 13, color: theme.colors.text },
  projected: { marginTop: 8, fontSize: 13, color: theme.colors.muted },
});
