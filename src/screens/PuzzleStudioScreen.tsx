import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { Stepper } from '@/components/ui/Stepper';
import { PuzzleGrid } from '@/features/puzzle/components/PuzzleGrid';
import { ChainStudioPanel } from '@/features/chain/components/ChainStudioPanel';
import { BatchSummaryCard } from '@/features/puzzle/components/studio/BatchSummaryCard';
import { QualityReportCard } from '@/features/puzzle/components/studio/QualityReportCard';
import { THEMES } from '@/features/puzzle/data/themes';
import { generateBatchItem, summarizeBatch, type BatchItem } from '@/features/puzzle/engine/batch';
import { getDifficultyConfig, MAX_GRID_SIZE, MIN_GRID_SIZE } from '@/features/puzzle/engine/difficultyConfig';
import { normalizeSeed, randomSeed } from '@/features/puzzle/engine/random';
import { DIFFICULTIES, type Difficulty, type GeneratePuzzleOptions } from '@/features/puzzle/engine/types';
import { createWordHistory } from '@/features/puzzle/game/wordHistory';
import { useCellSize } from '@/features/puzzle/hooks/useCellSize';
import { colors, difficultyColors, radius, spacing } from '@/theme/tokens';

const THEME_OPTIONS = THEMES.map((t) => ({ value: t.id, label: `${t.icon ?? ''} ${t.name}`.trim() }));
const DIFFICULTY_OPTIONS = DIFFICULTIES.map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1), accent: difficultyColors[d] }));
const SCOPE_OPTIONS = [
  { value: 'current', label: 'Current' },
  { value: 'all', label: 'All' },
] as const;
const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'issues', label: 'With issues' },
  { value: 'mismatch', label: 'Difficulty mismatch' },
  { value: 'invalid', label: 'Invalid' },
] as const;

const HISTORY_OPTIONS = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
] as const;

type Scope = (typeof SCOPE_OPTIONS)[number]['value'];
type Filter = (typeof FILTER_OPTIONS)[number]['value'];

const BATCH_CHUNK = 5;
const PADDING = spacing.lg;

export function PuzzleStudioScreen() {
  const [theme, setTheme] = useState(THEMES[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [wordCount, setWordCount] = useState<number | undefined>();
  const [gridSize, setGridSize] = useState<number | undefined>();
  const [seedText, setSeedText] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [current, setCurrent] = useState<BatchItem | null>(null);

  const [themeScope, setThemeScope] = useState<Scope>('all');
  const [difficultyScope, setDifficultyScope] = useState<Scope>('current');
  const [avoidRecent, setAvoidRecent] = useState<'on' | 'off'>('on');
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [batchSeed, setBatchSeed] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const cancelled = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => () => {
    cancelled.current = true;
  }, []);

  const config = getDifficultyConfig(difficulty);
  const previewGrid = current?.puzzle?.gridSize ?? config.gridSize;
  const cellSize = useCellSize(previewGrid, { horizontalPadding: PADDING * 4 + 4, maxHeightRatio: 0.7 });

  const buildOptions = useCallback(
    (overrides: Partial<GeneratePuzzleOptions> = {}): GeneratePuzzleOptions => ({
      theme,
      difficulty,
      wordCount,
      gridSize,
      ...overrides,
    }),
    [theme, difficulty, wordCount, gridSize],
  );

  const generateOne = () => {
    const seed = seedText.trim() ? normalizeSeed(seedText) : randomSeed();
    setCurrent(generateBatchItem(0, buildOptions({ seed })));
  };

  const runBatch = async (count: number) => {
    if (progress) return;
    const base = seedText.trim() ? normalizeSeed(seedText) : randomSeed();
    setBatchSeed(base);
    setBatch([]);
    setFilter('all');
    const items: BatchItem[] = [];
    // Simulates one player generating these puzzles in order, like the play screen does.
    const history = createWordHistory();
    setProgress({ done: 0, total: count });
    for (let i = 0; i < count; i++) {
      if (cancelled.current) return;
      const d = difficultyScope === 'all' ? DIFFICULTIES[i % DIFFICULTIES.length] : difficulty;
      const themeId = themeScope === 'all' ? THEMES[i % THEMES.length].id : theme;
      const options: GeneratePuzzleOptions = {
        theme: themeId,
        difficulty: d,
        seed: (base + i) >>> 0,
        // Size/count overrides only make sense for a single difficulty.
        ...(difficultyScope === 'current' ? { wordCount, gridSize } : {}),
        ...(avoidRecent === 'on' ? { avoidWords: history.recentWords(themeId) } : {}),
      };
      const item = generateBatchItem(i, options);
      if (item.puzzle) history.record(themeId, item.puzzle.id, item.puzzle.words);
      items.push(item);
      if ((i + 1) % BATCH_CHUNK === 0 || i === count - 1) {
        setProgress({ done: i + 1, total: count });
        // Yield so the UI stays responsive during large batches.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    setBatch(items);
    setProgress(null);
  };

  const summary = useMemo(() => (batch.length > 0 ? summarizeBatch(batch) : null), [batch]);

  const visibleBatch = useMemo(() => {
    switch (filter) {
      case 'issues':
        return batch.filter((b) => b.puzzle && b.puzzle.quality.penalty > 0);
      case 'mismatch':
        return batch.filter((b) => b.puzzle && b.puzzle.difficultyBreakdown.rated !== b.puzzle.difficulty);
      case 'invalid':
        return batch.filter((b) => !b.validation.valid);
      default:
        return batch;
    }
  }, [batch, filter]);

  const inspect = (item: BatchItem) => {
    setCurrent(item);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const playCurrent = () => {
    const p = current?.puzzle;
    if (!p || !current) return;
    router.push({
      pathname: '/puzzle',
      params: {
        theme: p.theme,
        difficulty: p.difficulty,
        seed: String(p.seed),
        ...(current.options.gridSize ? { gridSize: String(current.options.gridSize) } : {}),
        ...(current.options.wordCount ? { wordCount: String(current.options.wordCount) } : {}),
        ...(current.options.avoidWords?.length ? { avoid: current.options.avoidWords.join(',') } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card title="Generate">
          <Text style={styles.label}>Theme</Text>
          <ChipGroup options={THEME_OPTIONS} value={theme} onChange={setTheme} scroll accessibilityLabel="Theme" />
          <Text style={styles.label}>Difficulty</Text>
          <ChipGroup options={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} accessibilityLabel="Difficulty" />
          <View style={styles.steppers}>
            <Stepper label="Word count" value={wordCount} min={3} max={30} autoValue={config.wordCount.max} onChange={setWordCount} />
            <Stepper label="Grid size" value={gridSize} min={MIN_GRID_SIZE} max={MAX_GRID_SIZE} autoValue={config.gridSize} onChange={setGridSize} />
          </View>
          <Text style={styles.label}>Seed</Text>
          <TextInput
            value={seedText}
            onChangeText={setSeedText}
            placeholder="Random"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Seed. Leave empty for random"
          />
          <Button label="Generate Puzzle" onPress={generateOne} />
        </Card>

        {current && (
          <>
            {current.puzzle ? (
              <Card
                title={`${current.puzzle.themeName} · ${current.puzzle.difficulty}`}
                right={
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Answers</Text>
                    <Switch value={showAnswers} onValueChange={setShowAnswers} accessibilityLabel="Show answers" />
                  </View>
                }
              >
                <View style={styles.center}>
                  <PuzzleGrid
                    grid={current.puzzle.grid}
                    cellSize={cellSize}
                    answers={showAnswers ? current.puzzle.placements : undefined}
                  />
                </View>
                <Text style={styles.words}>{current.puzzle.words.join(' · ')}</Text>
                <View style={styles.row}>
                  <Text style={styles.seed} selectable>
                    Seed {current.puzzle.seed}
                  </Text>
                  <Button label="Use seed" size="sm" variant="ghost" onPress={() => setSeedText(String(current.puzzle!.seed))} />
                  <Button label="Play" size="sm" onPress={playCurrent} />
                </View>
              </Card>
            ) : (
              <Card title="Generation failed">
                <Text style={{ color: colors.fail }}>{current.error}</Text>
              </Card>
            )}
            {current.puzzle && <QualityReportCard puzzle={current.puzzle} validation={current.validation} />}
          </>
        )}

        <ChainStudioPanel theme={theme} themeIds={THEMES.map((t) => t.id)} />

        <Card title="Batch generation">
          <View style={styles.scopeRow}>
            <View style={styles.flex}>
              <Text style={styles.label}>Themes</Text>
              <ChipGroup options={SCOPE_OPTIONS} value={themeScope} onChange={setThemeScope} accessibilityLabel="Theme scope" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Difficulties</Text>
              <ChipGroup options={SCOPE_OPTIONS} value={difficultyScope} onChange={setDifficultyScope} accessibilityLabel="Difficulty scope" />
            </View>
          </View>
          <Text style={styles.label}>Avoid recent words (simulates consecutive play)</Text>
          <ChipGroup options={HISTORY_OPTIONS} value={avoidRecent} onChange={setAvoidRecent} accessibilityLabel="Avoid recent words" />
          <Text style={styles.label}>Generate</Text>
          <View style={styles.row}>
            {[10, 50, 100].map((n) => (
              <Button key={n} label={String(n)} accessibilityHint={`Generate ${n} puzzles`} size="sm" variant="secondary" style={styles.flex} disabled={!!progress} onPress={() => runBatch(n)} />
            ))}
          </View>
          {progress && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(progress.done / progress.total) * 100}%` }]} />
              <Text style={styles.progressText}>
                {progress.done} / {progress.total}
              </Text>
            </View>
          )}
          {batchSeed !== null && !progress && <Text style={styles.seed}>Batch base seed {batchSeed} (puzzle i uses base + i)</Text>}
        </Card>

        {summary && <BatchSummaryCard summary={summary} />}

        {batch.length > 0 && (
          <Card title={`Puzzles (${visibleBatch.length})`}>
            <ChipGroup options={FILTER_OPTIONS} value={filter} onChange={setFilter} scroll accessibilityLabel="Filter puzzles" />
            {visibleBatch.map((item) => {
              const p = item.puzzle;
              const selected = current === item;
              return (
                <Pressable
                  key={item.index}
                  onPress={() => inspect(item)}
                  style={({ pressed }) => [styles.item, selected && styles.itemSelected, pressed && styles.itemPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Inspect puzzle ${item.index + 1}`}
                >
                  <Text style={styles.itemIndex}>#{item.index + 1}</Text>
                  {p ? (
                    <>
                      <Text style={styles.itemTheme} numberOfLines={1}>
                        {p.themeName}
                      </Text>
                      <Text style={[styles.itemDiff, { color: difficultyColors[p.difficulty] }]}>{p.difficulty[0].toUpperCase()}</Text>
                      <Text style={styles.arrow}>→</Text>
                      <Text style={[styles.itemDiff, { color: difficultyColors[p.difficultyBreakdown.rated] }]}>
                        {p.difficultyBreakdown.rated[0].toUpperCase()}
                      </Text>
                      <Text style={styles.itemScore}>{p.difficultyScore}</Text>
                      <Text style={[styles.itemFlags, { color: p.quality.failCount ? colors.fail : p.quality.warnCount ? colors.warn : colors.pass }]}>
                        {item.validation.valid ? '✓' : '✗'} {p.quality.failCount ? `${p.quality.failCount}✗ ` : ''}
                        {p.quality.warnCount ? `${p.quality.warnCount}!` : ''}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.itemTheme, { color: colors.fail }]}>Failed: {item.error}</Text>
                  )}
                </Pressable>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: PADDING, gap: spacing.lg, paddingBottom: spacing.xxl },
  label: { fontSize: 12, fontWeight: '700', color: colors.inkMuted, marginBottom: -4 },
  steppers: { flexDirection: 'row', gap: spacing.lg },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  center: { alignItems: 'center' },
  words: { fontSize: 13, color: colors.inkMuted, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scopeRow: { flexDirection: 'row', gap: spacing.lg },
  flex: { flex: 1, gap: spacing.sm },
  seed: { flex: 1, fontSize: 12, color: colors.inkMuted },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  switchLabel: { fontSize: 13, color: colors.inkMuted },
  progressTrack: { height: 22, borderRadius: 11, backgroundColor: colors.surfaceMuted, overflow: 'hidden', justifyContent: 'center' },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.primarySoft },
  progressText: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.primary },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  itemSelected: { backgroundColor: colors.primarySoft },
  itemPressed: { backgroundColor: colors.surfaceMuted },
  itemIndex: { width: 40, fontSize: 13, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
  itemTheme: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  itemDiff: { fontSize: 13, fontWeight: '900', width: 14, textAlign: 'center' },
  arrow: { fontSize: 12, color: colors.inkMuted },
  itemScore: { width: 28, fontSize: 13, fontWeight: '700', color: colors.ink, textAlign: 'right', fontVariant: ['tabular-nums'] },
  itemFlags: { width: 56, fontSize: 13, fontWeight: '800', textAlign: 'right' },
});
