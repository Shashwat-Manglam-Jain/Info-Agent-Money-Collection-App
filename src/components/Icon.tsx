import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

export type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 20, color, style }: Props) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
