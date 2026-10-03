import { Text, type TextProps } from 'react-native';

import { colors, type, type TypeVariant } from '@/theme/tokens';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: string;
};

/** Text with the design system's Plus Jakarta Sans presets. */
export function AppText({ variant = 'bodyMd', color = colors.ink, style, ...rest }: Props) {
  return <Text {...rest} style={[type[variant], { color }, style]} />;
}
