import MaterialIcons from '@react-native-vector-icons/material-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

/** Material icons, matching the Material Symbols used in the Stitch designs. */
export function Icon({ name, size = 20, color }: Props) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
