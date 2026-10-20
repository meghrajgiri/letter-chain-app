import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LIP, colors, radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'white' | 'yellow' | 'green';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'lg' | 'md' | 'sm';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  /** Extra content after the label, e.g. a count badge. */
  trailing?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

/** Face, bottom lip and text colour for each variant. */
const LOOK: Record<Variant, { bg: string; lip: string; ink: string; pressedBg?: string }> = {
  primary: { bg: colors.primary, lip: colors.primaryDark, ink: colors.primaryInk, pressedBg: colors.primaryPressed },
  secondary: { bg: colors.primarySoft, lip: colors.lipSoft, ink: colors.primaryDark },
  white: { bg: colors.surface, lip: colors.lip, ink: colors.primaryDark },
  yellow: { bg: colors.yellow, lip: colors.yellowLip, ink: colors.ink },
  green: { bg: colors.green, lip: colors.greenLip, ink: colors.primaryInk },
  ghost: { bg: 'transparent', lip: 'transparent', ink: colors.primary },
};

/**
 * Chunky pill button. Every solid variant stands on a tactile bottom lip that
 * collapses (and drops the face) while pressed, so taps feel physical.
 */
export const Button = memo(function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  trailing,
  disabled,
  style,
  accessibilityHint,
}: Props) {
  const look = LOOK[variant];
  const lip = variant === 'ghost' ? 0 : size === 'lg' ? LIP.lg : LIP.md;
  const iconNode = icon ? <Icon name={icon} size={size === 'sm' ? 18 : 22} color={look.ink} /> : null;
  const height = size === 'lg' ? 58 : size === 'md' ? 50 : 44;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={style}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.base,
            { minHeight: height, backgroundColor: look.bg, borderBottomColor: look.lip, borderBottomWidth: lip },
            size === 'sm' && styles.small,
            pressed && variant !== 'ghost' && { borderBottomWidth: 0, minHeight: height - lip, marginTop: lip, backgroundColor: look.pressedBg ?? look.bg, opacity: 0.92 },
            pressed && variant === 'ghost' && styles.ghostPressed,
            disabled && styles.disabled,
          ]}
        >
          {iconPosition === 'left' && iconNode}
          <AppText variant={size === 'sm' ? 'labelMd' : 'labelLg'} color={look.ink} style={size === 'lg' && styles.largeLabel}>
            {label}
          </AppText>
          {iconPosition === 'right' && iconNode}
          {trailing}
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  small: { paddingHorizontal: spacing.md },
  ghostPressed: { opacity: 0.6 },
  disabled: { opacity: 0.45 },
  largeLabel: { fontSize: 17 },
});
