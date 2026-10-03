import { Text, type TextProps } from 'react-native';

import { colors, type, type TypeVariant } from '@/theme/tokens';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: string;
};

/**
 * Cap on system font scaling. Chrome (labels, badges, big display numbers) sits in
 * tight rows and chips, so it scales less; reading text scales further.
 */
const MAX_SCALE: Record<TypeVariant, number> = {
  displayHero: 1.2,
  headlineLg: 1.3,
  headlineMd: 1.3,
  headlineSm: 1.3,
  bodyLg: 1.6,
  bodyMd: 1.6,
  bodySm: 1.6,
  labelLg: 1.3,
  labelMd: 1.3,
  labelBadge: 1.3,
};

/** Text with the design system's Plus Jakarta Sans presets. */
export function AppText({ variant = 'bodyMd', color = colors.ink, style, maxFontSizeMultiplier, ...rest }: Props) {
  return <Text {...rest} maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_SCALE[variant]} style={[type[variant], { color }, style]} />;
}
