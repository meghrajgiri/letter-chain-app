import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'white';
  size?: 'lg' | 'md' | 'sm';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  /** Extra content after the label, e.g. a count badge. */
  trailing?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const LIP = 3;

/**
 * Pill button. The primary variant has the design's tactile bottom lip that
 * collapses (and shifts the content down) while pressed.
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
  const ink =
    variant === 'primary' ? colors.primaryInk : variant === 'white' ? colors.primaryDark : colors.primary;
  const iconNode = icon ? <Icon name={icon} size={size === 'sm' ? 18 : 22} color={ink} /> : null;
  const height = size === 'lg' ? 56 : size === 'md' ? 48 : 44;

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
            { minHeight: height },
            size === 'sm' && styles.small,
            variant === 'primary' && [
              styles.primary,
              pressed ? { borderBottomWidth: 0, marginTop: LIP, backgroundColor: colors.primaryPressed } : null,
            ],
            variant === 'secondary' && [styles.secondary, pressed && styles.secondaryPressed],
            variant === 'ghost' && pressed && styles.secondaryPressed,
            variant === 'white' && [styles.white, pressed && styles.secondaryPressed],
            disabled && styles.disabled,
          ]}
        >
          {iconPosition === 'left' && iconNode}
          <AppText variant={size === 'sm' ? 'labelMd' : 'labelLg'} color={ink} style={size === 'lg' && styles.largeLabel}>
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
  primary: {
    backgroundColor: colors.primary,
    borderBottomWidth: LIP,
    borderBottomColor: colors.primaryDark,
  },
  secondary: { backgroundColor: colors.primarySoft },
  secondaryPressed: { opacity: 0.75 },
  white: { backgroundColor: colors.surface },
  disabled: { opacity: 0.45 },
  largeLabel: { fontSize: 17 },
});
