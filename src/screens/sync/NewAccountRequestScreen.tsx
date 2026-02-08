import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useApp } from '../../app/AppProvider';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScrollScreen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { createAccountOpenRequest } from '../../db/repo';
import type { RootStackParamList } from '../../navigation/types';
import type { AccountType, Frequency } from '../../models/types';
import { rupeesToPaise } from '../../utils/money';
import { theme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NewAccountRequest'>;

function ChipRow<T extends string>(props: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.chips}>
        {props.options.map((o) => {
          const active = o.value === props.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => props.onChange(o.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function NewAccountRequestScreen({ navigation }: Props) {
  const { db, society, agent } = useApp();
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('PIGMY');
  const [frequency, setFrequency] = useState<Frequency>('DAILY');
  const [installmentText, setInstallmentText] = useState('50');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!db || !society || !agent) return;
    if (!clientName.trim()) {
      Alert.alert('Missing info', 'Client name is required.');
      return;
    }
    const amountPaise = rupeesToPaise(Number(installmentText));
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      Alert.alert('Invalid installment', 'Enter a valid installment amount.');
      return;
    }

    setBusy(true);
    try {
      await createAccountOpenRequest({
        db,
        societyId: society.id,
        agentId: agent.id,
        clientName: clientName.trim(),
        phone: phone.trim() ? phone.trim() : null,
        address: address.trim() ? address.trim() : null,
        accountType,
        frequency,
        installmentPaise: amountPaise,
        notes: notes.trim() ? notes.trim() : null,
      });
      Alert.alert('Saved', 'Account opening request added to pending export.');
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollScreen>
      <Card>
        <Text style={styles.title}>New Account Opening Request</Text>
        <Text style={styles.hint}>Saved on mobile and exported to Society computer for approval & passbook.</Text>
      </Card>

      <Card>
        <View style={{ gap: 12 }}>
          <TextField label="Client Name" value={clientName} onChangeText={setClientName} placeholder="Full name" />
          <TextField
            label="Phone (optional)"
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/[^0-9+]/g, ''))}
            keyboardType="number-pad"
            placeholder="10-digit mobile"
          />
          <TextField label="Address (optional)" value={address} onChangeText={setAddress} placeholder="Village / City" />

          <ChipRow
            label="Account Type"
            value={accountType}
            onChange={setAccountType}
            options={[
              { label: 'Pigmy', value: 'PIGMY' },
              { label: 'Savings', value: 'SAVINGS' },
              { label: 'Loan', value: 'LOAN' },
            ]}
          />

          <ChipRow
            label="Collection Frequency"
            value={frequency}
            onChange={setFrequency}
            options={[
              { label: 'Daily', value: 'DAILY' },
              { label: 'Weekly', value: 'WEEKLY' },
              { label: 'Monthly', value: 'MONTHLY' },
            ]}
          />

          <TextField
            label="Installment (₹)"
            value={installmentText}
            onChangeText={(v) => setInstallmentText(v.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            placeholder="e.g. 50"
          />
          <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any remarks…" />

          <Button title={busy ? 'Saving…' : 'Save Request'} onPress={save} disabled={busy} />
          <Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} disabled={busy} />
        </View>
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  hint: { marginTop: 6, fontSize: 13, color: theme.colors.muted },
  label: { fontSize: 14, fontWeight: '800', color: theme.colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 13, color: theme.colors.text, fontWeight: '800' },
  chipTextActive: { color: theme.colors.textOnDark },
});
