import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

type Props = {
  label: string;
  /** `undefined` displays "Auto". */
  value: number | undefined;
  min: number;
  max: number;
  /** Value to start from when leaving "Auto". */
  autoValue: number;
  onChange: (value: number | undefined) => void;
};

/** Numeric stepper with an "Auto" state (falls back to the difficulty default). */
export function Stepper({ label, value, min, max, autoValue, onChange }: Props) {
  const current = value ?? autoValue;
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, current + delta)));
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={() => step(-1)} style={styles.button} hitSlop={6}>
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ?? 'auto'}. Tap to reset to auto`}
          onPress={() => onChange(undefined)}
          style={styles.valueBox}
        >
          <Text style={[styles.value, value === undefined && styles.auto]}>{value ?? `Auto (${autoValue})`}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={() => step(1)} style={styles.button} hitSlop={6}>
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.xs },
  label: { fontSize: 12, fontWeight: '700', color: colors.inkMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  button: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  valueBox: { flex: 1, alignItems: 'center' },
  value: { fontSize: 15, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  auto: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
});
