import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StreakChip } from '@/components/ui/StreakChip';
import { useProgress } from '@/features/progress/ProgressProvider';
import { formatElapsed } from '@/features/puzzle/hooks/usePuzzleTimer';
import { openDaily } from '@/features/play/autoPlay';
import { LIP, colors, radius, shadows, spacing } from '@/theme/tokens';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function StatBox({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  unit,
  note,
  noteIcon,
  noteColor,
}: {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  unit?: string;
  note: string;
  noteIcon: IconName;
  noteColor: string;
}) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <AppText variant="bodySm" color={colors.inkMuted} style={styles.statLabel}>
        {label}
      </AppText>
      <AppText variant="headlineMd">
        {value}
        {unit ? (
          <AppText variant="bodyMd" color={colors.inkMuted}>
            {' '}
            {unit}
          </AppText>
        ) : null}
      </AppText>
      <View style={styles.noteRow}>
        <Icon name={noteIcon} size={14} color={noteColor} />
        <AppText variant="labelMd" color={noteColor}>
          {note}
        </AppText>
      </View>
    </View>
  );
}

function formatPlaytime(ms: number): string {
  if (ms > 0 && ms < 60000) return '<1m';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function streakLabel(days: number): string {
  if (days >= 7) return 'Unstoppable';
  if (days >= 3) return 'On fire';
  if (days >= 1) return 'Warming up';
  return 'Start today';
}

/** "Your Progress": everything here is derived from the player's finished games. */
export function ProgressScreen() {
  const { summary } = useProgress();
  const { streak, stats: s, levels, badges } = summary;
  const earned = badges.filter((b) => b.earned).length;
  const maxWords = Math.max(1, ...s.weeklyWords);
  const isNewPlayer = s.puzzlesSolved === 0;
  const playedThisWeek = s.solvedThisWeek > 0;

  const playDaily = () => openDaily();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Trophies" right={<StreakChip days={streak.current} />} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <AppText variant="bodyMd" color={colors.inkMuted}>
              Streaks, stats and badges
            </AppText>
          </View>
          <View style={styles.levelPills}>
            {(['classic', 'chain'] as const).map((m) => (
              <View key={m} style={styles.levelPill} accessibilityLabel={`${m === 'chain' ? 'Chain' : 'Classic'} level ${levels[m].level}`}>
                <Icon name={m === 'chain' ? 'gesture' : 'stars'} size={16} color={colors.primary} />
                <AppText variant="labelMd" color={colors.primary} style={styles.upper}>
                  {m === 'chain' ? 'Chain' : 'Classic'} {levels[m].level}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <LinearGradient colors={['#7B6CF0', colors.primary, '#4A36C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.streakCard}>
          <View style={styles.rowBetween}>
            <View style={styles.glassTag}>
              <AppText variant="labelBadge" color={colors.primaryInk}>
                {streakLabel(streak.current)}
              </AppText>
            </View>
            <View style={styles.noteRow}>
              <Icon name="emoji-events" size={18} color={colors.primaryInk} />
              <AppText variant="labelMd" color={colors.primaryInk}>
                Best: {streak.longest} {streak.longest === 1 ? 'day' : 'days'}
              </AppText>
            </View>
          </View>
          <View style={styles.streakMain}>
            <View style={styles.flameTile}>
              <AppText style={styles.flame}>🔥</AppText>
            </View>
            <View>
              <AppText variant="displayHero" color={colors.primaryInk}>
                {streak.current} {streak.current === 1 ? 'Day' : 'Days'}
              </AppText>
              <AppText variant="bodyMd" color={colors.primaryInk}>
                {streak.todayDone ? 'Today’s daily is done ✓' : 'Play today’s daily to keep it going'}
              </AppText>
            </View>
          </View>
          <View style={styles.weekBar}>
            {WEEK_DAYS.map((d, i) => {
              const isToday = i === streak.todayIndex;
              return (
                <View key={i} style={styles.weekDay}>
                  <AppText variant="labelBadge" color={isToday ? colors.yellow : colors.primaryInk}>
                    {isToday ? 'Today' : d}
                  </AppText>
                  {streak.week[i] ? (
                    <View style={styles.weekDone}>
                      <Icon name="check" size={18} color={colors.greenInk} />
                    </View>
                  ) : (
                    <View style={[styles.weekEmpty, isToday && styles.weekToday]} />
                  )}
                </View>
              );
            })}
          </View>
        </LinearGradient>

        {isNewPlayer ? (
          // One welcoming card instead of a wall of zeros.
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon name="insights" size={28} color={colors.primary} />
            </View>
            <AppText variant="headlineSm" style={styles.center}>
              Your stats start here
            </AppText>
            <AppText variant="bodyMd" color={colors.inkMuted} style={styles.center}>
              Solve your first puzzle to see your words, best times and weekly rhythm.
            </AppText>
            <Button label="Play today’s puzzle" icon="play-circle-outline" iconPosition="right" onPress={playDaily} style={styles.emptyButton} />
          </View>
        ) : (
          <>
            <View style={styles.rowBetween}>
              <AppText variant="headlineSm">Overall Stats</AppText>
              <AppText variant="labelMd" color={colors.inkMuted}>
                Lifetime
              </AppText>
            </View>
            <View style={styles.statGrid}>
              <StatBox
                icon="extension"
                iconBg={colors.primarySoft}
                iconColor={colors.primary}
                label="Solved"
                value={String(s.puzzlesSolved)}
                unit="puzzles"
                note={playedThisWeek ? `+${s.solvedThisWeek} this week` : 'None this week'}
                noteIcon={playedThisWeek ? 'arrow-upward' : 'event'}
                noteColor={playedThisWeek ? colors.greenInk : colors.inkMuted}
              />
              <StatBox icon="spellcheck" iconBg={colors.greenInk} iconColor={colors.surface} label="Found" value={String(s.wordsFound)} unit="words" note={`${s.avgWordsPerPuzzle.toFixed(1)} avg/grid`} noteIcon="bolt" noteColor={colors.greenInk} />
              <StatBox
                icon="timer"
                iconBg={colors.yellow}
                iconColor={colors.ink}
                label="Best Time"
                value={s.bestTime ? formatElapsed(s.bestTime.durationMs) : '—'}
                note={s.bestTime ? `${s.bestTime.mode === 'chain' ? 'Chain' : 'Classic'} · ${s.bestTime.difficulty}` : 'No solves yet'}
                noteIcon="emoji-events"
                noteColor={colors.yellowInk}
              />
              <StatBox
                icon="hourglass-empty"
                iconBg={colors.surfaceMuted}
                iconColor={colors.inkMuted}
                label="Playtime"
                value={formatPlaytime(s.totalPlaytimeMs)}
                note={s.avgPlaytimePerDayMs > 0 ? `~${formatPlaytime(s.avgPlaytimePerDayMs)} per day` : 'Across all games'}
                noteIcon="history"
                noteColor={colors.inkMuted}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <AppText variant="headlineSm" style={styles.flex}>
                  Weekly Words Rhythm
                </AppText>
                {s.weeklyWordsChange !== null && (
                  <View style={styles.changeTag}>
                    <AppText variant="labelMd" color={colors.greenInk}>
                      {s.weeklyWordsChange >= 0 ? '+' : ''}
                      {Math.round(s.weeklyWordsChange * 100)}% vs last week
                    </AppText>
                  </View>
                )}
              </View>
              <View style={styles.bars}>
                {s.weeklyWords.map((words, i) => {
                  const v = words / maxWords;
                  const isToday = i === streak.todayIndex;
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { height: `${Math.max(v > 0 ? 8 : 0, v * 100)}%` }, isToday && styles.barToday]} />
                      </View>
                      <AppText variant="labelMd" color={isToday ? colors.primary : colors.inkMuted}>
                        {WEEK_DAYS[i]}
                      </AppText>
                    </View>
                  );
                })}
              </View>
              {!playedThisWeek && (
                <AppText variant="bodySm" color={colors.inkMuted} style={styles.center}>
                  No words yet this week — any puzzle fills a bar.
                </AppText>
              )}
            </View>
          </>
        )}

        <View style={styles.rowBetween}>
          <View style={styles.noteRow}>
            <AppText variant="headlineSm">Badge Showcase</AppText>
            <View style={styles.countTag}>
              <AppText variant="labelMd" color={colors.inkMuted}>
                {earned}/{badges.length}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.badges}>
          {badges.map((b) => {
            // Unstarted badges read as goals ("0/7"), not as locked content.
            const unstarted = !b.earned && b.progress === 0;
            return (
              <View key={b.id} style={styles.badgeCard}>
                <View style={styles.badgeRow}>
                  <View style={[styles.badgeIcon, { backgroundColor: b.earned ? colors.yellowSoft : colors.surfaceMuted }]}>
                    <Icon name={b.icon as IconName} size={24} color={b.earned ? colors.yellowInk : unstarted ? colors.inkSubtle : colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="headlineSm">{b.title}</AppText>
                    <AppText variant="bodySm" color={colors.inkMuted}>
                      {b.description}
                    </AppText>
                  </View>
                  {b.earned ? (
                    <View style={styles.claimed}>
                      <AppText variant="labelBadge" color={colors.greenInk}>
                        Earned
                      </AppText>
                    </View>
                  ) : (
                    <AppText variant="labelLg" color={unstarted ? colors.inkMuted : colors.primary} accessibilityLabel={`${b.progress} of ${b.goal}`}>
                      {b.progress}/{b.goal}
                    </AppText>
                  )}
                </View>
                {!b.earned && b.goal > 1 && b.progress > 0 && (
                  <View style={styles.badgeProgress}>
                    <View style={styles.track}>
                      <View style={[styles.trackFill, { width: `${(b.progress / b.goal) * 100}%` }]} />
                    </View>
                    <AppText variant="labelMd" style={styles.right}>
                      {b.goal - b.progress} to go
                    </AppText>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {!isNewPlayer && (
          <View style={styles.cta}>
            <View style={styles.ctaIcon}>
              <Icon name="psychology" size={24} color={colors.greenInk} />
            </View>
            <View style={styles.flex}>
              <AppText variant="labelLg">{streak.todayDone ? 'Daily complete' : 'Daily Challenge Ready'}</AppText>
              <AppText variant="bodySm" color={colors.inkMuted}>
                {streak.todayDone ? 'Come back tomorrow for a new puzzle' : 'Keep the flame burning today'}
              </AppText>
            </View>
            <Button label={streak.todayDone ? 'Replay' : 'Play'} size="sm" onPress={playDaily} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingTop: 4, paddingBottom: spacing.xxl, gap: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  upper: { textTransform: 'uppercase' },
  center: { textAlign: 'center' },
  levelPills: { gap: 6, alignItems: 'flex-end' },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  streakCard: { borderRadius: radius.xxl, padding: spacing.lg, gap: 16, boxShadow: shadows.primaryGlow, borderBottomWidth: LIP.lg, borderBottomColor: '#3A2A9E' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  glassTag: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakMain: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flameTile: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flame: { fontSize: 32, lineHeight: 40 },
  weekBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.lg,
    padding: 10,
  },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDone: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#7FFAB6', alignItems: 'center', justifyContent: 'center' },
  weekEmpty: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)' },
  // Pending today: outlined ring (filled + check only once done).
  weekToday: { backgroundColor: 'transparent', borderWidth: 2.5, borderColor: colors.yellow, borderStyle: 'dashed' },
  emptyCard: { alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, boxShadow: shadows.card, borderBottomWidth: LIP.md, borderBottomColor: colors.lip },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyButton: { marginTop: 8, alignSelf: 'stretch' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 2,
    boxShadow: shadows.card,
    borderBottomWidth: LIP.md,
    borderBottomColor: colors.lip,
  },
  statIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statLabel: { marginBottom: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, gap: 16, boxShadow: shadows.card, borderBottomWidth: LIP.md, borderBottomColor: colors.lip },
  changeTag: { backgroundColor: colors.greenSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  bars: { flexDirection: 'row', justifyContent: 'space-between', height: 96 },
  barCol: { alignItems: 'center', gap: 6, flex: 1 },
  barTrack: { flex: 1, width: 30, borderRadius: 15, backgroundColor: colors.surfaceMuted, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 15, backgroundColor: '#B4A9F5' },
  barToday: { backgroundColor: colors.primary },
  countTag: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4 },
  badges: { gap: 10 },
  badgeCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, gap: 12, boxShadow: shadows.card, borderBottomWidth: LIP.md, borderBottomColor: colors.lip },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badgeIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  claimed: { backgroundColor: colors.greenSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeProgress: { gap: 6 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  right: { textAlign: 'right' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  ctaIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
});
