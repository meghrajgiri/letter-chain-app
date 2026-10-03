import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

type Props = {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Level-1 surface: white, 20px radius, hairline border and soft violet shadow. */
export function Card({ title, right, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {(title || right) && (
        <View style={styles.header}>
          {title ? (
            <AppText variant="labelMd" color={colors.inkMuted} style={styles.title} accessibilityRole="header">
              {title}
            </AppText>
          ) : (
            <View />
          )}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm + 4,
    boxShadow: shadows.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { textTransform: 'uppercase', letterSpacing: 0.8 },
});
