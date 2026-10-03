import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  variant?: 'white' | 'muted';
  disabled?: boolean;
};

/** Circular icon button (48px default) for tools like pause, hint, reveal. */
export function IconButton({ icon, label, onPress, size = 48, variant = 'white', disabled }: Props) {
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
        { width: size, height: size, borderRadius: size / 2 },
        variant === 'white' ? styles.white : styles.muted,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.46)} color={colors.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  white: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  muted: { backgroundColor: colors.surfaceMuted },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.4 },
});
