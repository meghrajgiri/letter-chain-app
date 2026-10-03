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
import { difficultyLabel, openDaily, startAutoGame } from '@/features/play/autoPlay';
import { difficultyForLevel, type GameMode, type LevelInfo } from '@/features/progress';
import { useProgress } from '@/features/progress/ProgressProvider';
import { getTheme } from '@/features/puzzle/data/themes';
import { msUntilNextDaily } from '@/features/daily/daily';
import { useDaily } from '@/features/daily/dailyStore';
import { formatElapsed } from '@/features/puzzle/hooks/usePuzzleTimer';
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
function NextDailyCountdown({ nextMode }: { nextMode: string }) {
  const [ms, setMs] = useState(() => msUntilNextDaily());
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextDaily()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <AppText variant="labelMd" color={colors.primaryInk} style={styles.tabular} accessibilityLabel={`Next puzzle, ${nextMode}, in ${formatCountdown(ms)}`}>
      Next: {nextMode} in {formatCountdown(ms)}
    </AppText>
  );
}

/** A mode with its own level: tapping starts a game at the matching difficulty. */
function ModeCard({
  mode,
  level,
  icon,
  iconBg,
  iconColor,
  title,
  description,
  action,
  actionColor,
  onPress,
}: {
  mode: GameMode;
  level: LevelInfo;
  icon: IconName;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  action: string;
  actionColor: string;
  onPress: () => void;
}) {
  const difficulty = difficultyLabel(difficultyForLevel(mode, level.level));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${title}. Level ${level.level}, ${difficulty}. ${description}`}
      android_ripple={{ color: colors.primarySoft }}
      style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}
    >
      <View style={styles.modeTop}>
        <View style={[styles.modeIcon, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={26} color={iconColor} />
        </View>
        <View style={styles.levelTag}>
          <AppText variant="labelMd" color={colors.primaryDark}>
            Lv {level.level}
          </AppText>
        </View>
      </View>
      <AppText variant="headlineSm">{title}</AppText>
      <AppText variant="bodyMd" color={colors.inkMuted} style={styles.modeDesc}>
        {description}
      </AppText>
      <AppText variant="labelMd" color={colors.inkMuted}>
        {difficulty} puzzles
      </AppText>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(level.progress * 100)}%` }]} />
      </View>
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
  const { summary, results, dailyKey } = useProgress();
  const daily = useDaily(dailyKey);
  const dailyTheme = getTheme(daily.theme);
  const dailyModeName = daily.mode === 'chain' ? 'Chain' : 'Classic';
  const { user } = useAccount();
  const { streak, todayDaily, levels } = summary;
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

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
            <Pressable
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              hitSlop={4}
              style={({ pressed }) => pressed && styles.pressedLink}
            >
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
            {todayDaily ? 'Today’s puzzle is done' : 'Ready for today’s puzzle?'}
          </AppText>
        </View>

        {/* Daily card: carries today's state (done + time + countdown) so Home needs no second daily card. */}
        <LinearGradient colors={['#7B6CF0', colors.primary, '#4A36C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dailyCard}>
          <View style={styles.dailyTop}>
            <View style={styles.streakTag}>
              <Icon name="local-fire-department" size={16} color={colors.ink} />
              <AppText variant="labelBadge" color={colors.ink}>
                {streak.current > 0 ? `${streak.current} day streak` : 'Start your streak'}
              </AppText>
            </View>
            <View style={styles.themeSquare} accessibilityLabel={`Today's theme: ${daily.themeName}`}>
              <AppText style={styles.themeEmoji}>{dailyTheme?.icon ?? '🧩'}</AppText>
            </View>
          </View>
          <AppText variant="displayHero" color={colors.primaryInk}>
            Daily Puzzle
          </AppText>
          <AppText variant="bodyMd" color={colors.primaryInk}>
            {daily.source === 'trending' ? 'Trending today' : 'Today’s theme'}: {daily.themeName}. {todayDaily ? 'Play it again any time.' : 'Keep your streak alive and sharpen your mind!'}
          </AppText>
          {todayDaily ? (
            <View style={styles.doneRow}>
              <View style={styles.doneBadge}>
                <Icon name="check-circle" size={18} color={colors.greenInk} />
                <AppText variant="labelMd" color={colors.greenInk}>
                  Done in {formatElapsed(todayDaily.durationMs)}
                </AppText>
              </View>
              <NextDailyCountdown nextMode={daily.mode === 'chain' ? 'Classic' : 'Chain'} />
            </View>
          ) : (
            <View style={styles.dailyChips}>
              {(
                [
                  [daily.mode === 'chain' ? 'gesture' : 'grid-on', dailyModeName],
                  ...(daily.source === 'trending' ? ([['trending-up', 'Trending']] as const) : []),
                  ['spellcheck', `${daily.words.length} words`],
                  ['schedule', '2–3 min'],
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
          )}
          <Button
            label={todayDaily ? 'Play Again' : 'Play Today'}
            icon={todayDaily ? 'replay' : 'play-circle-outline'}
            iconPosition="right"
            variant="white"
            size="lg"
            onPress={() => openDaily(dailyKey)}
            style={styles.playToday}
          />
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <AppText variant="headlineSm">Free Play</AppText>
          <Pressable
            onPress={() => router.push('/play')}
            accessibilityRole="link"
            hitSlop={{ top: 13, bottom: 13, left: 8, right: 8 }}
            style={({ pressed }) => pressed && styles.pressedLink}
          >
            <AppText variant="labelMd" color={colors.primary} style={styles.upper}>
              Modes
            </AppText>
          </Pressable>
        </View>
        <View style={styles.modes}>
          <ModeCard
            mode="classic"
            level={levels.classic}
            icon="self-improvement"
            iconBg={colors.primarySoft}
            iconColor={colors.primary}
            title="Classic"
            description="Relax & solve at your pace"
            action="Play"
            actionColor={colors.primary}
            onPress={() => startAutoGame('classic', results)}
          />
          <ModeCard
            mode="chain"
            level={levels.chain}
            icon="gesture"
            iconBg={colors.yellowSoft}
            iconColor={colors.yellowInk}
            title="Chain"
            description="Trace words that fill the grid"
            action="Play"
            actionColor={colors.yellowInk}
            onPress={() => startAutoGame('chain', results)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingBottom: TAB_BAR_SPACE, gap: spacing.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { gap: 4 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dailyCard: { borderRadius: radius.xxl, padding: spacing.lg, gap: 10, boxShadow: shadows.primaryGlow },
  dailyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  streakTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    // Dark overlay keeps white chip text above 4.5:1 on the violet card.
    backgroundColor: 'rgba(32,32,42,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  doneRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.greenSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  upper: { textTransform: 'uppercase' },
  playToday: { marginTop: 12 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
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
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  pressedLink: { opacity: 0.55 },
  modeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  modeIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  levelTag: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  modeDesc: { minHeight: 48 },
  modeAction: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
});
