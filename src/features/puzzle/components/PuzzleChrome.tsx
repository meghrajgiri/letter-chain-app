import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { LIP, colors, radius, shadows, spacing } from '@/theme/tokens';
import { formatElapsed } from '../hooks/usePuzzleTimer';

/** Shared header for puzzle screens: round back button, theme as the title (with a caption), help. */
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
      <View style={styles.side}>
        <IconButton icon="arrow-back" label="Back" size={44} onPress={() => router.back()} />
      </View>
      <View style={styles.titleBlock} accessibilityRole="header">
        <View style={styles.titleRow}>
          {icon ? <AppText style={styles.titleEmoji}>{icon}</AppText> : null}
          <AppText variant="headlineSm" numberOfLines={1} style={styles.titleText}>
            {title}
          </AppText>
        </View>
        <AppText variant="labelBadge" color={colors.inkMuted}>
          {caption}
        </AppText>
      </View>
      <View style={[styles.side, styles.sideRight]}>{onHelp && <IconButton icon="question-mark" label="How to play" size={44} onPress={onHelp} />}</View>
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

/** The HUD strip: timer and progress in one chunky bar, pause beside it. */
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
      <View style={styles.hud}>
        <View style={styles.timer} accessibilityLabel={`Time ${formatElapsed(elapsedMs)}`}>
          <Icon name="timer" size={20} color={colors.primary} />
          <AppText variant="headlineSm" style={styles.tabular}>
            {formatElapsed(elapsedMs)}
          </AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.count} accessibilityLabel={countAccessibilityLabel}>
          <Icon name={countIcon} size={18} color={colors.greenInk} />
          <AppText variant="labelLg" color={colors.greenInk} numberOfLines={1}>
            {countLabel}
          </AppText>
        </View>
      </View>
      {showPause ? <IconButton icon="pause" label="Pause" onPress={onPause} size={48} variant="muted" /> : <View style={styles.pauseSpacer} />}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  // Both sides share a width so the title stays centred.
  side: { width: 48, alignItems: 'flex-start' },
  sideRight: { alignItems: 'flex-end' },
  titleBlock: { flex: 1, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  titleEmoji: { fontSize: 20, lineHeight: 26 },
  titleText: { flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hud: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderBottomWidth: LIP.md,
    borderBottomColor: colors.lip,
    paddingHorizontal: 6,
    minHeight: 52,
    boxShadow: shadows.card,
  },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
  tabular: { fontVariant: ['tabular-nums'] },
  divider: { width: 1, height: 24, backgroundColor: colors.border },
  count: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.greenSoft,
    marginLeft: 6,
    marginVertical: 5,
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: radius.pill,
  },
  pauseSpacer: { width: 48 },
});
