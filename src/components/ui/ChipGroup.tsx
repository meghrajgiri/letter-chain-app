import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

export type ChipOption<T extends string> = {
  value: T;
  label: string;
  accent?: string;
};

type Props<T extends string> = {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Horizontal scrolling row instead of wrapping. */
  scroll?: boolean;
  accessibilityLabel: string;
};

/** Single-select pill tabs. */
export function ChipGroup<T extends string>({ options, value, onChange, scroll, accessibilityLabel }: Props<T>) {
  const chips = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={option.label}
        onPress={() => onChange(option.value)}
        hitSlop={4}
        android_ripple={{ color: colors.primarySoft }}
        style={({ pressed }) => [
          styles.chip,
          selected && { backgroundColor: option.accent ?? colors.primary, borderColor: option.accent ?? colors.primary },
          pressed && !selected && styles.pressed,
        ]}
      >
        <AppText variant="labelMd" color={selected ? colors.primaryInk : colors.ink}>
          {option.label}
        </AppText>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibilityLabel}
      >
        {chips}
      </ScrollView>
    );
  }
  return (
    <View style={[styles.row, styles.wrap]} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {chips}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  wrap: { flexWrap: 'wrap' },
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: { backgroundColor: colors.surfaceMuted },
});
