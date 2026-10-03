import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { TAB_BAR_SPACE } from '@/components/ui/FloatingTabBar';
import { CHAIN_CONFIGS } from '@/features/chain/engine/config';
import { CHAIN_DIFFICULTIES, type ChainDifficulty } from '@/features/chain/engine/types';
import { THEMES } from '@/features/puzzle/data/themes';
import { getDifficultyConfig } from '@/features/puzzle/engine/difficultyConfig';
import { DIFFICULTIES, type Difficulty } from '@/features/puzzle/engine/types';
import { colors, difficultyColors, radius, shadows, spacing } from '@/theme/tokens';

const DIFFICULTY_OPTIONS = DIFFICULTIES.map((d) => ({
  value: d,
  label: d[0].toUpperCase() + d.slice(1),
  accent: difficultyColors[d],
}));

type Mode = 'classic' | 'chain';

const MODE_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'chain', label: 'Chain' },
] as const;

const CHAIN_DIFFICULTY_OPTIONS = CHAIN_DIFFICULTIES.map((d) => ({
  value: d,
  label: d[0].toUpperCase() + d.slice(1),
  accent: difficultyColors[d],
}));

/** Free play: pick a mode, theme and difficulty. */
export function PlayMenuScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'chain' ? 'chain' : 'classic');
  // Home's mode cards open this tab with a preselected mode (adjust state when the param changes).
  const [modeParam, setModeParam] = useState(params.mode);
  if (params.mode !== modeParam) {
    setModeParam(params.mode);
    if (params.mode === 'chain' || params.mode === 'classic') setMode(params.mode);
  }
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [chainDifficulty, setChainDifficulty] = useState<ChainDifficulty>('medium');
  const [theme, setTheme] = useState(THEMES[0].id);
  const config = getDifficultyConfig(difficulty);
  const chainConfig = CHAIN_CONFIGS[chainDifficulty];
  const selected = THEMES.find((t) => t.id === theme)!;

  const play = (themeId: string) =>
    mode === 'chain'
      ? router.push({ pathname: '/chain', params: { theme: themeId, difficulty: chainDifficulty } })
      : router.push({ pathname: '/puzzle', params: { theme: themeId, difficulty } });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <AppText variant="headlineLg" accessibilityRole="header">
            Free Play
          </AppText>
          <AppText variant="bodyMd" color={colors.inkMuted}>
            {mode === 'chain'
              ? 'Every letter belongs to one hidden word. Trace them up, down and sideways.'
              : 'Find the listed words in straight lines. Relax and solve at your own pace.'}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="labelMd" color={colors.inkMuted} style={styles.label}>
            Mode
          </AppText>
          <ChipGroup options={MODE_OPTIONS} value={mode} onChange={setMode} accessibilityLabel="Mode" />
        </View>

        <View style={styles.section}>
          <AppText variant="labelMd" color={colors.inkMuted} style={styles.label}>
            Difficulty
          </AppText>
          {mode === 'chain' ? (
            <>
              <ChipGroup options={CHAIN_DIFFICULTY_OPTIONS} value={chainDifficulty} onChange={setChainDifficulty} accessibilityLabel="Difficulty" />
              <AppText variant="bodySm" color={colors.inkMuted}>
                {chainConfig.rows}×{chainConfig.cols} grid · {chainConfig.wordCount.min}–{chainConfig.wordCount.max} hidden words · 3 hints
              </AppText>
            </>
          ) : (
            <>
              <ChipGroup options={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} accessibilityLabel="Difficulty" />
              <AppText variant="bodySm" color={colors.inkMuted}>
                {config.gridSize}×{config.gridSize} grid · {config.wordCount.min}–{config.wordCount.max} words
                {difficulty === 'easy' ? ' · forwards only' : difficulty === 'medium' ? ' · some backwards' : ' · all 8 directions'}
              </AppText>
            </>
          )}
        </View>

        <View style={styles.section}>
          <AppText variant="labelMd" color={colors.inkMuted} style={styles.label}>
            Theme
          </AppText>
          <View style={styles.themes} accessibilityRole="radiogroup">
            {THEMES.map((t) => {
              const isSelected = t.id === theme;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTheme(t.id)}
                  onLongPress={() => play(t.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={t.name}
                  style={({ pressed }) => [styles.theme, isSelected && styles.themeSelected, pressed && styles.pressed]}
                >
                  <AppText style={styles.themeIcon}>{t.icon}</AppText>
                  <AppText variant="labelMd" color={isSelected ? colors.primary : colors.ink} numberOfLines={1}>
                    {t.name}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={`Play ${selected.name}`} icon="play-arrow" size="lg" onPress={() => play(theme)} style={styles.flex} />
        <Button
          label="Surprise"
          icon="casino"
          variant="secondary"
          size="lg"
          onPress={() => play(THEMES[Math.floor(Math.random() * THEMES.length)].id)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: TAB_BAR_SPACE + 80, gap: spacing.xl },
  titleBlock: { gap: 4, paddingTop: spacing.sm },
  section: { gap: 12 },
  label: { textTransform: 'uppercase', letterSpacing: 0.8 },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  theme: {
    width: '30%',
    flexGrow: 1,
    minHeight: 84,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderBottomWidth: 3,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: spacing.sm,
  },
  themeSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.85 },
  themeIcon: { fontSize: 26, lineHeight: 32 },
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
