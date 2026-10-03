import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';

/** Flame streak counter with the yellow glow. */
export function StreakChip({ days }: { days: number }) {
  return (
    <View style={styles.chip} accessibilityLabel={`${days} day streak`}>
      <Icon name="local-fire-department" size={16} color={colors.yellowInk} />
      <AppText variant="labelBadge" color={colors.ink}>
        {days}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.yellowSoft,
    borderWidth: 1,
    borderColor: colors.yellow,
    boxShadow: shadows.yellowGlow,
  },
});
