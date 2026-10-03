import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TAB_BAR_SPACE } from '@/components/ui/FloatingTabBar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { StreakChip } from '@/components/ui/StreakChip';
import { useAccount } from '@/features/account/AccountProvider';
import { useProgress } from '@/features/progress/ProgressProvider';
import { formatElapsed } from '@/features/puzzle/hooks/usePuzzleTimer';
import { getTheme } from '@/features/puzzle/data/themes';
import { getDailyPuzzle, msUntilNextDaily } from '@/features/puzzle/game/daily';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/** Ticks on its own so the rest of Home doesn't re-render every second. */
function NextDailyCountdown() {
  const [ms, setMs] = useState(() => msUntilNextDaily());
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextDaily()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.countdown} accessibilityLabel={`Next puzzle in ${formatCountdown(ms)}`}>
      <Icon name="hourglass-empty" size={16} color={colors.inkMuted} />
      <AppText variant="labelMd" color={colors.inkMuted} style={styles.tabular}>
        {formatCountdown(ms)}
      </AppText>
    </View>
  );
}

function StatCard({ icon, iconBg, iconColor, value, label }: { icon: IconName; iconBg: string; iconColor: string; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <AppText variant="headlineMd">{value}</AppText>
      <AppText variant="bodySm" color={colors.inkMuted} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

function ModeCard({
  icon,
  iconBg,
  iconColor,
  duration,
  title,
  description,
  action,
  actionColor,
  onPress,
}: {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  duration: string;
  title: string;
  description: string;
  action: string;
  actionColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}: ${description}`} style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}>
      <View style={styles.modeTop}>
        <View style={[styles.modeIcon, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={26} color={iconColor} />
        </View>
        <View style={styles.durationTag}>
          <AppText variant="labelMd" color={colors.inkMuted}>
            {duration}
          </AppText>
        </View>
      </View>
      <AppText variant="headlineSm">{title}</AppText>
      <AppText variant="bodyMd" color={colors.inkMuted} style={styles.modeDesc}>
        {description}
      </AppText>
      <View style={styles.modeAction}>
        <AppText variant="labelLg" color={actionColor} style={styles.upper}>
          {action}
        </AppText>
        <Icon name="chevron-right" size={20} color={actionColor} />
      </View>
    </Pressable>
  );
}

export function HomeScreen() {
  const now = new Date();
  const daily = getDailyPuzzle(now);
  const dailyTheme = getTheme(daily.theme);
  const { summary } = useProgress();
  const { user } = useAccount();
  const { streak, stats, todayDaily } = summary;
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const playDaily = () =>
    router.push({
      pathname: '/puzzle',
      params: {
        mode: 'daily',
        theme: daily.theme,
        difficulty: daily.difficulty,
        seed: daily.seed,
        wordCount: String(daily.wordCount),
        date: daily.date,
      },
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <AppLogo size={32} />
            <AppText variant="headlineSm">Letter Chain</AppText>
          </View>
          <View style={styles.brand}>
            <StreakChip days={streak.current} />
            <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Profile">
              <Avatar size={36} uri={user?.avatarUrl} />
            </Pressable>
          </View>
        </View>

        <View style={styles.greeting}>
          <View style={styles.greetingRow}>
            <AppText variant="bodyLg" color={colors.inkMuted}>
              {greeting(now.getHours())} 👋
            </AppText>
            <AppText variant="labelLg" color={colors.inkMuted}>
              {dateLabel}
            </AppText>
          </View>
          <AppText variant="headlineLg" accessibilityRole="header">
            Ready for today’s puzzle?
          </AppText>
        </View>

        <LinearGradient
          colors={['#7B6CF0', colors.primary, '#4A36C4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dailyCard}
        >
          <View style={styles.dailyTop}>
            <View style={styles.streakTag}>
              <AppText variant="labelBadge" color={colors.ink}>
                {streak.current > 0 ? `🔥 ${streak.current} Day Streak` : '🔥 Start your streak'}
              </AppText>
            </View>
            <View style={styles.themeSquare} accessibilityLabel={`Today's theme: ${dailyTheme?.name ?? daily.theme}`}>
              <AppText style={styles.themeEmoji}>{dailyTheme?.icon ?? '🧩'}</AppText>
            </View>
          </View>
          <AppText variant="displayHero" color={colors.primaryInk}>
            Daily Puzzle
          </AppText>
          <AppText variant="bodyMd" color="rgba(255,255,255,0.88)">
            Today’s theme: {dailyTheme?.name}.{' '}
            {todayDaily ? 'Done for today — play it again any time.' : 'Keep your streak alive and sharpen your mind!'}
          </AppText>
          <View style={styles.dailyChips}>
            {(
              [
                ['schedule', '2–3 min'],
                ['spellcheck', `${daily.wordCount} words`],
                ['bolt', daily.difficulty],
              ] as const
            ).map(([icon, label]) => (
              <View key={label} style={styles.dailyChip}>
                <Icon name={icon} size={16} color={colors.primaryInk} />
                <AppText variant="labelMd" color={colors.primaryInk} style={styles.upper}>
                  {label}
                </AppText>
              </View>
            ))}
          </View>
          <Button label={todayDaily ? 'Play Again' : 'Play Today'} icon="play-circle-outline" iconPosition="right" variant="white" size="lg" onPress={playDaily} style={styles.playToday} />
        </LinearGradient>

        <View style={styles.stats}>
          <StatCard icon="local-fire-department" iconBg={colors.yellowSoft} iconColor={colors.yellowInk} value={String(streak.current)} label="Day Streak" />
          <StatCard icon="stars" iconBg={colors.primarySoft} iconColor={colors.primary} value={summary.xp.toLocaleString('en-US')} label="Total XP" />
          <StatCard icon="emoji-events" iconBg={colors.greenSoft} iconColor={colors.greenInk} value={String(stats.bestScore)} label="Best Score" />
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.brand}>
              <View style={[styles.checkCircle, !todayDaily && styles.pendingCircle]}>
                <Icon name={todayDaily ? 'check' : 'today'} size={18} color={todayDaily ? colors.greenInk : colors.primary} />
              </View>
              <AppText variant="labelLg">Daily Progress</AppText>
            </View>
            <AppText variant="labelLg" color={colors.primary}>
              {todayDaily ? `${todayDaily.wordCount} / ${todayDaily.wordCount} found` : 'Not played yet'}
            </AppText>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: todayDaily ? '100%' : '0%' }]} />
          </View>
          <View style={styles.progressHeader}>
            {todayDaily ? (
              <AppText variant="labelLg" color={colors.greenInk}>
                Completed in {formatElapsed(todayDaily.durationMs)}
              </AppText>
            ) : (
              <Pressable onPress={playDaily} accessibilityRole="button" hitSlop={8}>
                <AppText variant="labelLg" color={colors.primary}>
                  Play today’s puzzle →
                </AppText>
              </Pressable>
            )}
            <NextDailyCountdown />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="headlineSm">More Game Modes</AppText>
          <Pressable onPress={() => router.push('/play')} accessibilityRole="link" hitSlop={8}>
            <AppText variant="labelMd" color={colors.primary} style={styles.upper}>
              Free Play
            </AppText>
          </Pressable>
        </View>
        <View style={styles.modes}>
          <ModeCard
            icon="self-improvement"
            iconBg={colors.primarySoft}
            iconColor={colors.primary}
            duration="5–7m"
            title="Classic"
            description="Relax & solve at your pace"
            action="Start"
            actionColor={colors.primary}
            onPress={() => router.push({ pathname: '/play', params: { mode: 'classic' } })}
          />
          <ModeCard
            icon="gesture"
            iconBg={colors.yellowSoft}
            iconColor={colors.yellowInk}
            duration="4–6m"
            title="Chain"
            description="Trace winding words that fill the grid"
            action="Play"
            actionColor={colors.yellowInk}
            onPress={() => router.push({ pathname: '/play', params: { mode: 'chain' } })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingBottom: TAB_BAR_SPACE, gap: spacing.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { gap: 4 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dailyCard: { borderRadius: radius.xxl, padding: spacing.lg, gap: 10, boxShadow: shadows.primaryGlow },
  dailyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  streakTag: {
    backgroundColor: colors.yellow,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    boxShadow: shadows.yellowGlow,
  },
  themeSquare: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeEmoji: { fontSize: 26, lineHeight: 32 },
  dailyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  dailyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  upper: { textTransform: 'uppercase' },
  playToday: { marginTop: 12 },
  stats: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: 8,
    boxShadow: shadows.card,
  },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 12,
    boxShadow: shadows.card,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  pendingCircle: { backgroundColor: colors.primarySoft },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabular: { fontVariant: ['tabular-nums'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  modes: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 14,
    gap: 4,
    boxShadow: shadows.card,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  modeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  modeIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  durationTag: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  modeDesc: { minHeight: 48 },
  modeAction: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
});
