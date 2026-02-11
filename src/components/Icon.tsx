import { Image } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';

import { images } from '../assets/images';

export type IconName = string;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
};

export function Icon({ name, size = 20, color, style }: Props) {
  const label = color ? `${name}-${color}` : name;
  return (
    <Image
      source={images.uiLogo}
      accessibilityLabel={label}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
    />
  );
}
