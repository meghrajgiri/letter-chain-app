import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import { formatElapsed } from '../hooks/usePuzzleTimer';

/** Shared header for puzzle screens: back, theme as the title (with a caption), logo. */
export const PuzzleHeader = memo(function PuzzleHeader({
  icon,
  title,
  caption,
  onHelp,
}: {
  icon?: string;
  title: string;
  caption: string;
  /** Shows a "How to play" button. */
  onHelp?: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} style={styles.back}>
        <Icon name="arrow-back-ios-new" size={22} color={colors.ink} />
      </Pressable>
      <View style={styles.titleBlock} accessibilityRole="header">
        <AppText variant="headlineSm" numberOfLines={1}>
          {icon ? `${icon} ` : ''}
          {title}
        </AppText>
        <AppText variant="labelBadge" color={colors.inkMuted}>
          {caption}
        </AppText>
      </View>
      <View style={styles.right}>
        {onHelp && (
          <Pressable onPress={onHelp} accessibilityRole="button" accessibilityLabel="How to play" hitSlop={8} style={styles.help}>
            <Icon name="help-outline" size={24} color={colors.inkMuted} />
          </Pressable>
        )}
        <AppLogo size={36} />
      </View>
    </View>
  );
});

type StatusRowProps = {
  elapsedMs: number;
  countIcon: IconName;
  countLabel: string;
  countAccessibilityLabel: string;
  showPause: boolean;
  onPause: () => void;
};

/** One compact row: timer, progress count, pause. */
export const PuzzleStatusRow = memo(function PuzzleStatusRow({
  elapsedMs,
  countIcon,
  countLabel,
  countAccessibilityLabel,
  showPause,
  onPause,
}: StatusRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.timer} accessibilityLabel={`Time ${formatElapsed(elapsedMs)}`}>
        <Icon name="timer" size={20} color={colors.primary} />
        <AppText variant="headlineSm" style={styles.tabular}>
          {formatElapsed(elapsedMs)}
        </AppText>
      </View>
      <View style={styles.count} accessibilityLabel={countAccessibilityLabel}>
        <Icon name={countIcon} size={18} color={colors.greenInk} />
        <AppText variant="labelLg" color={colors.greenInk} numberOfLines={1}>
          {countLabel}
        </AppText>
      </View>
      {showPause ? <IconButton icon="pause" label="Pause" onPress={onPause} size={44} /> : <View style={styles.pauseSpacer} />}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  // Same width as the right-hand group so the title stays centred.
  back: { width: 74, height: 36, justifyContent: 'center' },
  right: { width: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  help: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 44 },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: radius.pill,
    boxShadow: shadows.card,
  },
  tabular: { fontVariant: ['tabular-nums'] },
  count: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: radius.pill,
  },
  pauseSpacer: { width: 44 },
});
