import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { StreakChip } from '@/components/ui/StreakChip';
import { difficultyLabel, openDaily, startAutoGame } from '@/features/play/autoPlay';
import { difficultyForLevel, type GameMode, type LevelInfo } from '@/features/progress';
import { useProgress } from '@/features/progress/ProgressProvider';
import { getTheme } from '@/features/puzzle/data/themes';
import { msUntilNextDaily } from '@/features/daily/daily';
import { useDaily } from '@/features/daily/dailyStore';
import { formatElapsed } from '@/features/puzzle/hooks/usePuzzleTimer';
import { StreakSaveCard } from '@/features/streakSave/StreakSaveCard';
import { LIP, colors, fonts, radius, shadows, spacing } from '@/theme/tokens';

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

/** Decorative letter tiles scattered behind the daily card's text, spelling the theme. */
const TILE_SPOTS = [
  { top: 14, right: 18, rotate: '12deg', size: 44 },
  { top: 64, right: 58, rotate: '-9deg', size: 36 },
  { top: 118, right: 22, rotate: '6deg', size: 32 },
  { top: 34, right: 112, rotate: '-14deg', size: 28 },
] as const;

function FloatingTiles({ word }: { word: string }) {
  const letters = word.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, TILE_SPOTS.length).split('');
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {letters.map((letter, i) => {
        const spot = TILE_SPOTS[i];
        return (
          <View
            key={i}
            style={[
              styles.floatTile,
              { top: spot.top, right: spot.right, width: spot.size, height: spot.size, borderRadius: spot.size * 0.26, transform: [{ rotate: spot.rotate }] },
            ]}
          >
            <AppText style={{ fontFamily: fonts.extrabold, fontSize: spot.size * 0.55, lineHeight: spot.size * 0.7 }} color={colors.primaryDark}>
              {letter}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

/** A mode with its own level: a chunky tile that starts a game at the matching difficulty. */
function ModeTile({
  mode,
  level,
  icon,
  accent,
  accentSoft,
  accentInk,
  lip,
  title,
  description,
  onPress,
}: {
  mode: GameMode;
  level: LevelInfo;
  icon: IconName;
  accent: string;
  accentSoft: string;
  accentInk: string;
  lip: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  const difficulty = difficultyLabel(difficultyForLevel(mode, level.level));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${title}. Level ${level.level}, ${difficulty}. ${description}`}
      style={({ pressed }) => [styles.modeTile, { borderBottomColor: lip }, pressed && styles.modeTilePressed]}
    >
      <View style={styles.modeTop}>
        <View style={[styles.modeIcon, { backgroundColor: accent }]}>
          <Icon name={icon} size={26} color={accentInk} />
        </View>
        <View style={[styles.levelTag, { backgroundColor: accentSoft }]}>
          <AppText variant="labelBadge" color={colors.ink}>
            Lv {level.level}
          </AppText>
        </View>
      </View>
      <AppText variant="headlineSm">{title}</AppText>
      <AppText variant="bodySm" color={colors.inkMuted} style={styles.modeDesc}>
        {description}
      </AppText>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(4, Math.round(level.progress * 100))}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.modeAction}>
        <AppText variant="labelBadge" color={colors.inkMuted}>
          {difficulty}
        </AppText>
        <View style={[styles.playPill, { backgroundColor: accent }]}>
          <Icon name="play-arrow" size={18} color={accentInk} />
          <AppText variant="labelMd" color={accentInk}>
            Play
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

export function HomeScreen() {
  const { summary, results, dailyKey } = useProgress();
  const daily = useDaily(dailyKey);
  const dailyTheme = getTheme(daily.theme);
  const dailyModeName = daily.mode === 'chain' ? 'Chain' : 'Classic';
  const { streak, todayDaily, levels } = summary;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <AppLogo size={40} />
            <AppText variant="headlineSm" style={styles.wordmark}>
              Letter Chain
            </AppText>
          </View>
          <View style={styles.brand}>
            <StreakChip days={streak.current} />
            <IconButton icon="emoji-events" label="Trophies" size={42} onPress={() => router.push('/progress')} />
            <IconButton icon="settings" label="Profile and settings" size={42} onPress={() => router.push('/profile')} />
          </View>
        </View>

        {/* Only the day after a missed daily: watch an ad to keep the streak. */}
        <StreakSaveCard />

        {/* Daily challenge: today's state (done + time + countdown) lives here, so Home needs no second daily card. */}
        <LinearGradient colors={['#8A7BF5', colors.primary, '#4A36C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dailyCard}>
          <FloatingTiles word={daily.themeName} />
          <View style={styles.dailyTag}>
            <Icon name="bolt" size={14} color={colors.ink} />
            <AppText variant="labelBadge" color={colors.ink}>
              {todayDaily ? 'Daily · Done' : 'Daily Challenge'}
            </AppText>
          </View>
          <View style={styles.dailyTitle}>
            <AppText style={styles.themeEmoji}>{dailyTheme?.icon ?? '🧩'}</AppText>
            <AppText variant="displayHero" color={colors.primaryInk} numberOfLines={2} style={styles.dailyName} accessibilityRole="header">
              {daily.themeName}
            </AppText>
          </View>
          <View style={styles.dailyChips}>
            {(
              [
                [daily.mode === 'chain' ? 'gesture' : 'grid-on', dailyModeName],
                ...(daily.source === 'trending' ? ([['trending-up', 'Trending']] as const) : []),
                ['spellcheck', `${daily.words.length} words`],
              ] as const
            ).map(([icon, label]) => (
              <View key={label} style={styles.dailyChip}>
                <Icon name={icon} size={14} color={colors.primaryInk} />
                <AppText variant="labelMd" color={colors.primaryInk}>
                  {label}
                </AppText>
              </View>
            ))}
          </View>
          {todayDaily ? (
            <View style={styles.doneRow}>
              <View style={styles.doneBadge}>
                <Icon name="check-circle" size={18} color={colors.greenInk} />
                <AppText variant="labelMd" color={colors.greenInk}>
                  Solved in {formatElapsed(todayDaily.durationMs)}
                </AppText>
              </View>
              <NextDailyCountdown nextMode={daily.mode === 'chain' ? 'Classic' : 'Chain'} />
            </View>
          ) : (
            <AppText variant="bodySm" color={colors.primaryInk} style={styles.dailyBlurb}>
              {streak.current > 0 ? `Keep your ${streak.current}-day streak alive.` : 'Solve it to start a streak.'}
            </AppText>
          )}
          <Button
            label={todayDaily ? 'Play Again' : 'Play Today'}
            icon={todayDaily ? 'replay' : 'play-arrow'}
            variant="yellow"
            size="lg"
            onPress={() => openDaily(dailyKey)}
            style={styles.playToday}
          />
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <AppText variant="headlineSm">Pick a game</AppText>
          <AppText variant="labelMd" color={colors.inkMuted}>
            New theme every round
          </AppText>
        </View>
        <View style={styles.modes}>
          <ModeTile
            mode="classic"
            level={levels.classic}
            icon="grid-on"
            accent={colors.primary}
            accentSoft={colors.primarySoft}
            accentInk={colors.primaryInk}
            lip={colors.primary}
            title="Classic"
            description="Find words in straight lines"
            onPress={() => startAutoGame('classic', results)}
          />
          <ModeTile
            mode="chain"
            level={levels.chain}
            icon="gesture"
            accent={colors.yellow}
            accentSoft={colors.yellowSoft}
            accentInk={colors.ink}
            lip={colors.yellow}
            title="Chain"
            description="Trace paths that fill the grid"
            onPress={() => startAutoGame('chain', results)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 60 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { letterSpacing: -0.4 },
  dailyCard: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: 10,
    boxShadow: shadows.primaryGlow,
    overflow: 'hidden',
    borderBottomWidth: LIP.lg,
    borderBottomColor: '#3A2A9E',
  },
  floatTile: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.card,
  },
  dailyTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.yellow,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    boxShadow: shadows.yellowGlow,
  },
  dailyTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, paddingRight: 72 },
  themeEmoji: { fontSize: 34, lineHeight: 42 },
  dailyName: { flexShrink: 1, fontSize: 34, lineHeight: 40 },
  dailyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dailyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    // Dark overlay keeps white chip text above 4.5:1 on the violet card.
    backgroundColor: 'rgba(32,32,42,0.26)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dailyBlurb: { opacity: 0.92 },
  doneRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.greenSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  playToday: { marginTop: 6 },
  tabular: { fontVariant: ['tabular-nums'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  modes: { flexDirection: 'row', gap: 12 },
  modeTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 14,
    gap: 4,
    boxShadow: shadows.card,
    borderBottomWidth: LIP.lg,
  },
  modeTilePressed: { borderBottomWidth: 0, marginTop: LIP.lg, opacity: 0.92 },
  modeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  modeIcon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  levelTag: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  modeDesc: { minHeight: 40 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 4 },
  modeAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  playPill: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 8, paddingRight: 12, paddingVertical: 5, borderRadius: radius.pill },
});
