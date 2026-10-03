import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { colors, difficultyColors, spacing } from '@/theme/tokens';
import { DIFFICULTY_FACTORS } from '../../engine/calculateDifficulty';
import { DIRECTION_ARROWS, DIRECTION_NAMES } from '../../engine/directions';
import type { QualityStatus } from '../../engine/qualityReport';
import type { DifficultyFactorKey, Puzzle, ValidationResult } from '../../engine/types';

type Props = {
  puzzle: Puzzle;
  validation: ValidationResult;
};

const pct = (v: number) => `${Math.round(v * 100)}%`;

const STATUS_ICON: Record<QualityStatus, string> = { pass: '✓', warn: '!', fail: '✗' };
const STATUS_COLOR: Record<QualityStatus, string> = { pass: colors.pass, warn: colors.warn, fail: colors.fail };

const FACTOR_LABELS: Record<DifficultyFactorKey, string> = {
  gridSize: 'Grid size',
  wordCount: 'Word count',
  wordLength: 'Word length',
  diagonalWords: 'Diagonals',
  reverseWords: 'Reverse',
  overlap: 'Overlap',
  density: 'Filler noise',
  distribution: 'Spread',
  visualNoise: 'Decoys/similarity',
};

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

/** The per-puzzle "PUZZLE QUALITY" report from the brief. */
export const QualityReportCard = memo(function QualityReportCard({ puzzle, validation }: Props) {
  const m = puzzle.metrics;
  const b = puzzle.difficultyBreakdown;
  return (
    <Card title="Puzzle quality" right={<Text style={styles.id} selectable>{puzzle.id}</Text>}>
      <Row
        label="Validity"
        value={validation.valid ? '✓ Valid' : `✗ ${validation.errors.length} error(s)`}
        color={validation.valid ? colors.pass : colors.fail}
      />
      {validation.errors.map((e) => (
        <Text key={e} style={[styles.note, { color: colors.fail }]}>
          {e}
        </Text>
      ))}
      {validation.warnings.map((w) => (
        <Text key={w} style={[styles.note, { color: colors.warn }]}>
          {w}
        </Text>
      ))}
      <Row label="Grid" value={`${puzzle.gridSize} × ${puzzle.gridSize}`} />
      <Row label="Words" value={`${m.wordCount}  (avg ${m.averageWordLength.toFixed(1)} letters, ${m.distinctWordLengths} lengths)`} />

      <View style={styles.block}>
        <Text style={styles.subhead}>Directions</Text>
        <View style={styles.dirGrid}>
          <Text style={styles.dirStat}>Horizontal {m.directions.horizontal}</Text>
          <Text style={styles.dirStat}>Vertical {m.directions.vertical}</Text>
          <Text style={styles.dirStat}>Diagonal {m.directions.diagonal}</Text>
          <Text style={styles.dirStat}>Reverse {m.directions.reverse}</Text>
        </View>
        <Text style={styles.arrows}>
          {DIRECTION_NAMES.filter((d) => m.directions.byDirection[d] > 0)
            .map((d) => `${DIRECTION_ARROWS[d]} ${m.directions.byDirection[d]}`)
            .join('   ')}
        </Text>
      </View>

      <Row label="Overlap" value={`${pct(m.overlapScore)} of words  (${m.sharedCells} shared cells)`} />
      <Row label="Density" value={pct(m.density)} />
      <Row label="Largest empty block" value={`${m.largestEmptySquare} × ${m.largestEmptySquare}`} />
      <Row label="Spread evenness" value={pct(m.distributionEvenness)} />
      <Row label="False starts / word" value={m.falseStartsPerWord.toFixed(2)} />

      <View style={styles.block}>
        <View style={styles.row}>
          <Text style={styles.subhead}>Difficulty</Text>
          <Text style={[styles.score, { color: difficultyColors[b.rated] }]}>
            {b.total} / 100 · {b.rated}
          </Text>
        </View>
        {(Object.keys(b.factors) as DifficultyFactorKey[]).map((key) => (
          <View key={key} style={styles.factor}>
            <Text style={styles.factorLabel}>{FACTOR_LABELS[key]}</Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${(b.factors[key] / DIFFICULTY_FACTORS[key].max) * 100}%` }]} />
            </View>
            <Text style={styles.factorValue}>
              {b.factors[key].toFixed(1)}/{DIFFICULTY_FACTORS[key].max}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.block}>
        <Text style={styles.subhead}>Potential issues</Text>
        {puzzle.quality.checks.map((check) => (
          <View key={check.id} style={styles.check}>
            <Text style={[styles.checkIcon, { color: STATUS_COLOR[check.status] }]}>{STATUS_ICON[check.status]}</Text>
            <Text style={styles.checkText}>
              <Text style={styles.checkLabel}>{check.label}</Text>
              <Text style={styles.checkDetail}> — {check.detail}</Text>
            </Text>
          </View>
        ))}
      </View>

      {puzzle.generationNotes.length > 0 && (
        <View style={styles.block}>
          <Text style={styles.subhead}>Generation notes (attempts: {puzzle.generationAttempts})</Text>
          {puzzle.generationNotes.map((n) => (
            <Text key={n} style={styles.note}>
              • {n}
            </Text>
          ))}
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  id: { fontSize: 11, color: colors.inkSubtle, flexShrink: 1, marginLeft: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  rowLabel: { fontSize: 14, color: colors.inkMuted },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.ink, flexShrink: 1, textAlign: 'right' },
  block: { gap: 6, paddingTop: spacing.xs },
  subhead: { fontSize: 14, fontWeight: '800', color: colors.ink },
  dirGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg, rowGap: 2 },
  dirStat: { fontSize: 14, color: colors.ink, fontVariant: ['tabular-nums'] },
  arrows: { fontSize: 14, color: colors.inkMuted },
  score: { fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  factor: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  factorLabel: { width: 120, fontSize: 12, color: colors.inkMuted },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary },
  factorValue: { width: 52, fontSize: 12, color: colors.ink, textAlign: 'right', fontVariant: ['tabular-nums'] },
  check: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  checkIcon: { width: 14, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  checkText: { flex: 1, fontSize: 13, lineHeight: 18 },
  checkLabel: { fontWeight: '700', color: colors.ink },
  checkDetail: { color: colors.inkMuted },
  note: { fontSize: 12, color: colors.inkMuted },
});
