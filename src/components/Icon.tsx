import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

export type IconName = string;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

const ICON_ALIASES: Record<string, string> = {
  add: 'add-circle-outline',
  'tab-Collect': 'cash-outline',
  'tab-Collect-active': 'cash',
  'tab-Accounts': 'people-outline',
  'tab-Accounts-active': 'people',
  'tab-Reports': 'bar-chart-outline',
  'tab-Reports-active': 'bar-chart',
  'tab-Sync': 'sync-outline',
  'tab-Sync-active': 'sync',
};

const ION_GLYPHS = Ionicons.glyphMap as Record<string, number>;

export function Icon({ name, size = 20, color, style }: Props) {
  const resolvedName = ICON_ALIASES[name] ?? name;
  const iconName = ION_GLYPHS[resolvedName] ? resolvedName : 'ellipse-outline';

  return (
    <Ionicons
      name={iconName as never}
      size={size}
      color={color ?? '#475569'}
      style={style}
      accessibilityLabel={name}
    />
  );
}
