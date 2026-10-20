import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Pop } from '@/components/ui/Pop';
import { difficultyForLevel, levelForXp, type CompletionSummary, type GameMode } from '@/features/progress';
import { LIP, colors, radius, shadows, spacing } from '@/theme/tokens';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { formatElapsed } from '../hooks/usePuzzleTimer';

type Props = {
  elapsedMs: number;
  wordCount: number;
  hintsUsed: number;
  /** Mode of the finished game: the level card shows that mode's level. */
  mode: GameMode;
  completion: CompletionSummary | null;
  isDaily: boolean;
  continueLabel: string;
  onContinue: () => void;
  onShare: () => void;
  onReview: () => void;
  /** Optional card shown after the game overview (e.g. the guest sign-in prompt). */
  promo?: ReactNode;
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Decorative confetti dots around the badge (static, like the design). */
const CONFETTI = [
  { top: 8, left: 40, size: 12, color: colors.yellow, round: true },
  { top: 40, left: 96, size: 14, color: colors.primarySoft, round: false },
  { top: 76, left: 62, size: 10, color: '#B4A9F5', round: true },
  { top: 16, right: 56, size: 12, color: colors.green, round: true },
  { top: 56, right: 92, size: 10, color: colors.yellow, round: true },
  { top: 64, right: 36, size: 13, color: colors.greenInk, round: false },
] as const;

/** 3 stars for a clean solve, 2 with one hint, 1 otherwise: the classic end-of-level rating. */
export function starsForHints(hintsUsed: number): number {
  return hintsUsed === 0 ? 3 : hintsUsed === 1 ? 2 : 1;
}

function StarRow({ stars }: { stars: number }) {
  return (
    <View style={styles.stars} accessibilityLabel={`${stars} of 3 stars`}>
      {[0, 1, 2].map((i) => {
        const lit = i < stars;
        return (
          <Pop key={i} delay={220 + i * 140} style={[styles.starSlot, i === 1 && styles.starMiddle]}>
            <View style={[styles.star, lit ? styles.starLit : styles.starDim]}>
              <Icon name="star" size={i === 1 ? 34 : 28} color={lit ? colors.yellowInk : colors.inkSubtle} />
            </View>
          </Pop>
        );
      })}
    </View>
  );
}

function StatTile({ icon, label, value, note, noteColor }: { icon: IconName; label: string; value: string; note: string; noteColor: string }) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statLabel}>
        <Icon name={icon} size={18} color={colors.inkMuted} />
        <AppText variant="bodySm" color={colors.inkMuted}>
          {label}
        </AppText>
      </View>
      <AppText variant="headlineMd">{value}</AppText>
      <AppText variant="labelMd" color={noteColor}>
        {note}
      </AppText>
    </View>
  );
}

/** Puzzle Complete screen. Every number here comes from the player's real history. */
export function CompletionView({
  elapsedMs,
  wordCount,
  hintsUsed,
  mode,
  completion,
  isDaily,
  continueLabel,
  onContinue,
  onShare,
  onReview,
  promo,
}: Props) {
  const reduceMotion = useReduceMotion();
  const [appear] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion) appear.setValue(1);
    else Animated.spring(appear, { toValue: 1, useNativeDriver: true, friction: 6, tension: 70 }).start();
  }, [appear, reduceMotion]);
  const time = formatElapsed(elapsedMs);
  const streak = completion?.streak;
  const level = completion?.level ?? levelForXp(0);
  const leveledUp = completion ? completion.levelAfter > completion.levelBefore : false;
  const modeName = mode === 'chain' ? 'Chain' : 'Classic';
  const harderNow =
    completion && leveledUp && difficultyForLevel(mode, completion.levelAfter) !== difficultyForLevel(mode, completion.levelBefore)
      ? difficultyForLevel(mode, completion.levelAfter)
      : null;
  const badge = completion?.newBadges[0];
  const tag = completion?.isPersonalBest ? 'Personal best' : hintsUsed === 0 ? 'Perfect' : 'Solved';

  return (
    <View style={styles.flex1}>
    <ScrollView style={styles.flex1} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        {CONFETTI.map((c, i) => (
          <View
            key={i}
            style={[
              styles.confetti,
              { top: c.top, width: c.size, height: c.size, backgroundColor: c.color, borderRadius: c.round ? c.size / 2 : 3 },
              'left' in c ? { left: c.left } : { right: c.right },
              !c.round && { transform: [{ rotate: '35deg' }] },
            ]}
          />
        ))}
        <Animated.View style={[styles.badge, { transform: [{ scale: appear }] }]}>
          <AppText style={styles.badgeEmoji}>{completion?.isPersonalBest ? '🏆' : '🎉'}</AppText>
          <View style={styles.perfect}>
            <Icon name="star" size={14} color={colors.ink} />
            <AppText variant="labelBadge">{tag}</AppText>
          </View>
        </Animated.View>
      </View>
      <StarRow stars={starsForHints(hintsUsed)} />

      <View style={styles.titleBlock}>
        <AppText variant="headlineLg" style={styles.center} accessibilityRole="header">
          Puzzle Complete!
        </AppText>
        <AppText variant="bodyLg" color={colors.inkMuted} style={styles.center}>
          You found all {wordCount} words in{' '}
          <AppText variant="bodyLg" style={styles.bold}>
            {time}
          </AppText>
        </AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText variant="headlineSm" style={styles.cardTitle}>
            Your results
          </AppText>
          <View style={styles.modeTag}>
            <AppText variant="labelBadge" color={colors.primaryDark}>
              {isDaily ? 'Daily' : modeName}
            </AppText>
          </View>
        </View>
        <View style={styles.statGrid}>
          <StatTile
            icon="timer"
            label="Time"
            value={time}
            note={completion?.isPersonalBest ? 'Personal best!' : `Puzzle #${completion?.puzzlesSolved ?? 1}`}
            noteColor={completion?.isPersonalBest ? colors.greenInk : colors.inkMuted}
          />
          <StatTile icon="spellcheck" label="Words" value={`${wordCount} / ${wordCount}`} note="All found" noteColor={colors.primary} />
          <StatTile
            icon="lightbulb-outline"
            label="Hints"
            value={`${hintsUsed} used`}
            note={hintsUsed === 0 ? 'No penalty' : `−${hintsUsed * 15}% score`}
            noteColor={hintsUsed === 0 ? colors.greenInk : colors.inkMuted}
          />
          <StatTile icon="star-outline" label="Score" value={String(completion?.score ?? 0)} note={`+${completion?.xpGained ?? 0} XP`} noteColor={colors.yellowInk} />
        </View>
      </View>

      {promo}

      {streak && (isDaily || streak.current > 0) && (
        <View style={styles.streakCard}>
          <View style={styles.streakTop}>
            <View style={styles.flameBox}>
              <AppText style={styles.flame}>🔥</AppText>
            </View>
            <View style={styles.flex}>
              <View style={styles.streakTitleRow}>
                <AppText variant="headlineSm">{streak.current > 0 ? `${streak.current} Day Streak!` : 'Start a streak'}</AppText>
                {streak.todayDone && (
                  <View style={styles.activeTag}>
                    <AppText variant="labelBadge" color={colors.surface}>
                      Active
                    </AppText>
                  </View>
                )}
              </View>
              <AppText variant="bodySm" color={colors.yellowInk}>
                {streak.todayDone ? 'Come back tomorrow to keep your flame burning!' : 'Finish today’s daily puzzle to keep your streak.'}
              </AppText>
            </View>
          </View>
          <View style={styles.week}>
            {WEEKDAYS.map((d, i) => {
              const isToday = i === streak.todayIndex;
              const done = streak.week[i];
              const future = i > streak.todayIndex;
              return (
                <View key={i} style={styles.day}>
                  <AppText variant="labelMd" color={isToday ? colors.primary : colors.ink}>
                    {d}
                  </AppText>
                  <View style={[styles.dayDot, done ? (isToday ? styles.dayToday : styles.dayDone) : styles.dayEmpty]}>
                    {done ? (
                      <Icon name="check" size={18} color={colors.surface} />
                    ) : future && i === streak.todayIndex + 1 ? (
                      <AppText variant="labelBadge" color={colors.inkMuted}>
                        Next
                      </AppText>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.mastery}>
        <View style={styles.masteryIcon}>
          <Icon name={badge ? (badge.icon as IconName) : leveledUp ? 'trending-up' : 'stars'} size={26} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="headlineSm">{badge ? `New badge: ${badge.title}` : leveledUp ? `Level up! ${modeName} level ${level.level}` : `${modeName} level ${level.level}`}</AppText>
          {badge ? (
            <AppText variant="bodySm" color={colors.inkMuted}>
              {badge.description}
            </AppText>
          ) : (
            <View style={styles.levelBlock}>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${Math.round(level.progress * 100)}%` }]} />
              </View>
              <AppText variant="bodySm" color={colors.inkMuted}>
                {level.xp - level.levelStartXp} / {level.nextLevelXp - level.levelStartXp} XP to level {level.level + 1}
              </AppText>
              {harderNow && (
                <AppText variant="labelMd" color={colors.primaryDark}>
                  Next {modeName} puzzles are {harderNow[0].toUpperCase() + harderNow.slice(1)}
                </AppText>
              )}
            </View>
          )}
        </View>
      </View>

      <Pressable onPress={onReview} accessibilityRole="button" style={({ pressed }) => [styles.review, pressed && { opacity: 0.5 }]} hitSlop={8}>
          <Icon name="visibility" size={20} color={colors.inkMuted} />
          <AppText variant="labelLg" color={colors.inkMuted}>
          Review Puzzle Board
        </AppText>
      </Pressable>
    </ScrollView>
    {/* Primary actions stay on screen however long the results get. */}
    <View style={styles.bar}>
      <Button label="Share" icon="share" variant="secondary" size="lg" onPress={onShare} style={styles.barShare} />
      <Button label={continueLabel} icon="arrow-forward" iconPosition="right" size="lg" onPress={onContinue} style={styles.barContinue} />
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { height: 128, alignItems: 'center', justifyContent: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 6, marginTop: -8 },
  starSlot: { alignItems: 'center' },
  starMiddle: { marginBottom: 10 },
  star: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderBottomWidth: LIP.sm },
  starLit: { backgroundColor: colors.yellow, borderBottomColor: colors.yellowLip, boxShadow: shadows.yellowGlow },
  starDim: { backgroundColor: colors.surfaceMuted, borderBottomColor: colors.lip },
  confetti: { position: 'absolute' },
  badge: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.raised,
    borderBottomWidth: LIP.md,
    borderBottomColor: colors.lipSoft,
  },
  badgeEmoji: { fontSize: 46, lineHeight: 56 },
  perfect: {
    position: 'absolute',
    top: -14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    boxShadow: shadows.yellowGlow,
  },
  titleBlock: { gap: 6, marginTop: -4 },
  center: { textAlign: 'center' },
  bold: { fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.ink },
  card: { backgroundColor: colors.surface, borderRadius: radius.xxl, padding: spacing.md, gap: 14, boxShadow: shadows.card, borderBottomWidth: LIP.md, borderBottomColor: colors.lip },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, lineHeight: 24 },
  modeTag: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statTile: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.surfaceLow, borderRadius: radius.lg, padding: 14, gap: 2, borderBottomWidth: LIP.sm, borderBottomColor: colors.lipSoft },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  streakCard: { backgroundColor: '#FFE7A1', borderRadius: radius.xxl, padding: spacing.md, gap: 14, boxShadow: shadows.yellowGlow, borderBottomWidth: LIP.md, borderBottomColor: colors.yellow },
  streakTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  flameBox: { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  flame: { fontSize: 28, lineHeight: 34 },
  flex: { flex: 1, gap: 2 },
  streakTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  activeTag: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  day: { alignItems: 'center', gap: 6 },
  dayDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayDone: { backgroundColor: colors.greenInk },
  dayToday: { backgroundColor: colors.primary },
  dayEmpty: { backgroundColor: colors.surfaceMuted },
  mastery: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, borderBottomWidth: LIP.md, borderBottomColor: colors.lip, boxShadow: shadows.card },
  masteryIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  levelBlock: { gap: 6, marginTop: 4 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  flex1: { flex: 1 },
  bar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  barShare: { flex: 1 },
  barContinue: { flex: 1.6 },
  review: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
});
