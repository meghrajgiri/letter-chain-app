import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TAB_BAR_SPACE } from '@/components/ui/FloatingTabBar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { difficultyLabel, startAutoGame } from '@/features/play/autoPlay';
import { difficultyForLevel, nextDifficultyStep, type GameMode, type LevelInfo } from '@/features/progress';
import { useProgress } from '@/features/progress/ProgressProvider';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

const MODES: { mode: GameMode; title: string; description: string; icon: IconName; iconBg: string; iconColor: string }[] = [
  {
    mode: 'classic',
    title: 'Classic',
    description: 'Find the listed words in straight lines.',
    icon: 'self-improvement',
    iconBg: colors.primarySoft,
    iconColor: colors.primary,
  },
  {
    mode: 'chain',
    title: 'Chain',
    description: 'Every letter belongs to a hidden word. Trace them up, down and sideways.',
    icon: 'gesture',
    iconBg: colors.yellowSoft,
    iconColor: colors.yellowInk,
  },
];

function ModeOption({
  option,
  level,
  selected,
  onSelect,
}: {
  option: (typeof MODES)[number];
  level: LevelInfo;
  selected: boolean;
  onSelect: () => void;
}) {
  const difficulty = difficultyLabel(difficultyForLevel(option.mode, level.level));
  const next = nextDifficultyStep(option.mode, level.level);
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.title}. Level ${level.level}, ${difficulty} puzzles. ${option.description}`}
      android_ripple={{ color: colors.primarySoft }}
      style={({ pressed }) => [styles.mode, selected && styles.modeSelected, pressed && styles.pressed]}
    >
      <View style={styles.modeTop}>
        <View style={[styles.modeIcon, { backgroundColor: option.iconBg }]}>
          <Icon name={option.icon} size={28} color={option.iconColor} />
        </View>
        <View style={styles.flex}>
          <AppText variant="headlineSm">{option.title}</AppText>
          <AppText variant="labelMd" color={colors.primaryDark}>
            Level {level.level} · {difficulty}
          </AppText>
        </View>
        <Icon name={selected ? 'radio-button-checked' : 'radio-button-unchecked'} size={24} color={selected ? colors.primary : colors.inkSubtle} />
      </View>
      <AppText variant="bodyMd" color={colors.inkMuted}>
        {option.description}
      </AppText>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(level.progress * 100)}%` }]} />
      </View>
      <AppText variant="bodySm" color={colors.inkMuted}>
        {level.xp - level.levelStartXp} / {level.nextLevelXp - level.levelStartXp} XP to level {level.level + 1}
        {next ? ` · ${difficultyLabel(next.difficulty)} from level ${next.fromLevel}` : ' · Top difficulty'}
      </AppText>
    </Pressable>
  );
}

/** Free play: pick Classic or Chain. The theme and difficulty are chosen for the player. */
export function PlayMenuScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { results, summary } = useProgress();
  const [mode, setMode] = useState<GameMode>(params.mode === 'chain' ? 'chain' : 'classic');
  // Home's mode cards open this tab with a preselected mode (adjust state when the param changes).
  const [modeParam, setModeParam] = useState(params.mode);
  if (params.mode !== modeParam) {
    setModeParam(params.mode);
    if (params.mode === 'chain' || params.mode === 'classic') setMode(params.mode);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <AppText variant="headlineLg" accessibilityRole="header">
            Free Play
          </AppText>
          <AppText variant="bodyMd" color={colors.inkMuted}>
            Pick a mode. Each game brings a new theme, and puzzles get harder as you level up.
          </AppText>
        </View>

        <View style={styles.modes} accessibilityRole="radiogroup" accessibilityLabel="Mode">
          {MODES.map((option) => (
            <ModeOption
              key={option.mode}
              option={option}
              level={summary.levels[option.mode]}
              selected={mode === option.mode}
              onSelect={() => setMode(option.mode)}
            />
          ))}
        </View>

        <View style={styles.note}>
          <Icon name="auto-awesome" size={20} color={colors.primary} />
          <AppText variant="bodySm" color={colors.inkMuted} style={styles.flex}>
            Every game has 4–6 words of different lengths. Classic and Chain levels grow separately.
          </AppText>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={`Play ${mode === 'chain' ? 'Chain' : 'Classic'}`}
          icon="play-arrow"
          size="lg"
          onPress={() => startAutoGame(mode, results)}
          style={styles.flex}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: TAB_BAR_SPACE + 80, gap: spacing.lg },
  titleBlock: { gap: 4, paddingTop: spacing.sm },
  modes: { gap: 12 },
  mode: {
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  modeSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceLow },
  pressed: { opacity: 0.85 },
  modeTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modeIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    // Background runs under the floating tab bar so content never peeks through.
    paddingBottom: TAB_BAR_SPACE,
    backgroundColor: colors.background,
    boxShadow: shadows.card,
  },
  flex: { flex: 1 },
});
