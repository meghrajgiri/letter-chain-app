import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { colors, difficultyColors } from '@/theme/tokens';
import { randomSeed } from '../../puzzle/engine/random';
import { getTileLayout } from '../../puzzle/game/tileLayout';
import { generateChainPuzzle } from '../engine/generateChainPuzzle';
import { pathShape } from '../engine/grid';
import { CHAIN_DIFFICULTIES, type ChainDifficulty, type ChainPuzzle } from '../engine/types';
import { validateChainPuzzle } from '../engine/validateChain';
import { ChainGrid } from './ChainGrid';

type Inspected = { puzzle: ChainPuzzle; ms: number; valid: boolean; errors: string[] };

type BatchStats = {
  count: number;
  valid: number;
  failed: number;
  avgMs: number;
  maxMs: number;
  avgAttempts: number;
  avgTurns: number;
  shapes: { straight: number; zigzag: number; snake: number };
};

const OPTIONS = CHAIN_DIFFICULTIES.map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1), accent: difficultyColors[d] }));

function shapeShare(puzzles: ChainPuzzle[]) {
  const counts = { straight: 0, zigzag: 0, snake: 0 };
  let total = 0;
  for (const p of puzzles) for (const pl of p.placements) {
    counts[pathShape(pl.cells)]++;
    total++;
  }
  return {
    straight: total ? counts.straight / total : 0,
    zigzag: total ? counts.zigzag / total : 0,
    snake: total ? counts.snake / total : 0,
  };
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Studio tools for Chain mode: inspect one puzzle with its solution, or batch-test generation. */
export function ChainStudioPanel({ theme, themeIds }: { theme: string; themeIds: readonly string[] }) {
  const { width } = useWindowDimensions();
  const [difficulty, setDifficulty] = useState<ChainDifficulty>('medium');
  const [inspected, setInspected] = useState<Inspected | null>(null);
  const [batch, setBatch] = useState<BatchStats | null>(null);
  const [running, setRunning] = useState(false);

  const generateOne = () => {
    const t0 = Date.now();
    const puzzle = generateChainPuzzle({ theme, difficulty, seed: randomSeed() });
    const v = validateChainPuzzle(puzzle);
    setInspected({ puzzle, ms: Date.now() - t0, valid: v.valid, errors: v.errors });
  };

  const runBatch = async (count: number) => {
    setRunning(true);
    const base = randomSeed();
    const puzzles: ChainPuzzle[] = [];
    let failed = 0;
    let totalMs = 0;
    let maxMs = 0;
    let valid = 0;
    for (let i = 0; i < count; i++) {
      const t0 = Date.now();
      try {
        const p = generateChainPuzzle({ theme: themeIds[i % themeIds.length], difficulty, seed: (base + i) >>> 0 });
        if (validateChainPuzzle(p).valid) valid++;
        puzzles.push(p);
      } catch {
        failed++;
      }
      const ms = Date.now() - t0;
      totalMs += ms;
      maxMs = Math.max(maxMs, ms);
      if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0));
    }
    setBatch({
      count,
      valid,
      failed,
      avgMs: totalMs / count,
      maxMs,
      avgAttempts: puzzles.reduce((s, p) => s + p.generationAttempts, 0) / Math.max(1, puzzles.length),
      avgTurns: puzzles.reduce((s, p) => s + p.turnsPerWord, 0) / Math.max(1, puzzles.length),
      shapes: shapeShare(puzzles),
    });
    setRunning(false);
  };

  const p = inspected?.puzzle;
  const layout = p ? getTileLayout(p.cols, Math.min(width - 96, 420), 6) : null;
  const shapes = p ? shapeShare([p]) : null;

  return (
    <Card title="Chain mode">
      <ChipGroup options={OPTIONS} value={difficulty} onChange={setDifficulty} accessibilityLabel="Chain difficulty" />
      <View style={styles.row}>
        <Button label="Generate Chain" size="sm" style={styles.flex} onPress={generateOne} />
        <Button label="Batch 50" size="sm" variant="secondary" disabled={running} onPress={() => runBatch(50)} />
      </View>

      {p && layout && (
        <View style={styles.block}>
          <View style={styles.center}>
            <ChainGrid
              grid={p.grid}
              layout={layout}
              found={p.placements.map((pl, i) => ({ word: pl.word, cells: pl.cells, colorIndex: i }))}
              path={[]}
              hintCells={[]}
            />
          </View>
          <Text style={[styles.line, { color: inspected.valid ? colors.pass : colors.fail }]}>
            {inspected.valid ? '✓ Valid, exactly one solution' : `✗ ${inspected.errors.join('; ')}`}
          </Text>
          <Text style={styles.line}>{p.words.join(' · ')}</Text>
          <Text style={styles.line}>
            {p.rows}×{p.cols} · {p.words.length} words · {p.generationAttempts} attempt(s) · {inspected.ms} ms
          </Text>
          <Text style={styles.line}>
            Turns/word {p.turnsPerWord.toFixed(1)} · snake {pct(shapes!.snake)} · zigzag {pct(shapes!.zigzag)} · straight {pct(shapes!.straight)}
          </Text>
          <Button
            label="Play this Chain"
            size="sm"
            variant="secondary"
            onPress={() => router.push({ pathname: '/chain', params: { theme: p.theme, difficulty: p.difficulty, seed: String(p.seed) } })}
          />
        </View>
      )}

      {running && <Text style={styles.line}>Generating…</Text>}
      {batch && !running && (
        <View style={styles.block}>
          <Text style={styles.line}>
            Batch {batch.count}: {batch.valid} valid & unique · {batch.failed} failed
          </Text>
          <Text style={styles.line}>
            {batch.avgMs.toFixed(1)} ms avg ({batch.maxMs} max) · {batch.avgAttempts.toFixed(1)} attempts avg
          </Text>
          <Text style={styles.line}>
            Turns/word {batch.avgTurns.toFixed(2)} · snake {pct(batch.shapes.snake)} · zigzag {pct(batch.shapes.zigzag)} · straight{' '}
            {pct(batch.shapes.straight)}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex: { flex: 1 },
  block: { gap: 6 },
  center: { alignItems: 'center' },
  line: { fontSize: 13, color: colors.ink, lineHeight: 19 },
});
