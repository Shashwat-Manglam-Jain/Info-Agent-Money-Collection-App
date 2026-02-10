import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AccountLot, ActiveLot } from '../models/types';
import { lotLabel } from '../utils/lots';
import { useTheme } from '../theme';
import type { Theme } from '../theme';

type Props = {
  lots: AccountLot[];
  activeLot: ActiveLot | null;
  onSelect: (lot: ActiveLot | null) => void;
};

export function LotSelector({ lots, activeLot, onSelect }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onSelect(null)}
        style={[styles.chip, !activeLot && styles.chipActive]}
      >
        <Text style={[styles.text, !activeLot && styles.textActive]}>All</Text>
      </Pressable>
      {lots.map((lot) => {
        const isActive = activeLot?.key === lot.key;
        return (
          <Pressable
            key={lot.key}
            onPress={() =>
              onSelect({
                key: lot.key,
                accountHead: lot.accountHead,
                accountHeadCode: lot.accountHeadCode,
                accountType: lot.accountType,
                frequency: lot.frequency,
              })
            }
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>
              {lotLabel({
                accountHead: lot.accountHead,
                accountHeadCode: lot.accountHeadCode,
                accountType: lot.accountType,
                frequency: lot.frequency,
              })} ({lot.count})
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: theme.radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceTint,
    },
    chipActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
    },
    text: { fontSize: 12, fontWeight: '700', color: theme.colors.muted },
    textActive: { color: theme.colors.primary },
  });
