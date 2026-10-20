import { Pressable, StyleSheet } from 'react-native';

import { LIP, colors } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  variant?: 'white' | 'muted' | 'primary';
  disabled?: boolean;
};

const LOOK = {
  white: { bg: colors.surface, lip: colors.lip, ink: colors.ink },
  muted: { bg: colors.primarySoft, lip: colors.lipSoft, ink: colors.primaryDark },
  primary: { bg: colors.primary, lip: colors.primaryDark, ink: colors.primaryInk },
} as const;

/** Round chunky icon button (48px default) for tools like back, pause, hint, reveal. */
export function IconButton({ icon, label, onPress, size = 48, variant = 'white', disabled }: Props) {
  const look = LOOK[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size + LIP.md, borderRadius: size / 2, backgroundColor: look.bg, borderBottomColor: look.lip },
        // The face drops onto its lip; total height stays size + lip so nothing around it moves.
        pressed && [styles.pressed, { height: size }],
        disabled && styles.disabled,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.46)} color={look.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderBottomWidth: LIP.md },
  pressed: { borderBottomWidth: 0, marginTop: LIP.md, opacity: 0.9 },
  disabled: { opacity: 0.4 },
});
