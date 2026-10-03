import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { colors, difficultyColors, spacing } from '@/theme/tokens';
import type { BatchSummary } from '../../engine/batch';
import { DIFFICULTIES } from '../../engine/types';

const pct = (v: number) => `${Math.round(v * 100)}%`;

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export const BatchSummaryCard = memo(function BatchSummaryCard({ summary: s }: { summary: BatchSummary }) {
  const maxBand = Math.max(1, ...DIFFICULTIES.map((d) => s.ratedDifficulty[d]));
  const issues = Object.entries(s.qualityIssues).filter(([, c]) => c.warn + c.fail > 0);

  return (
    <Card title="Batch summary">
      <View style={styles.stats}>
        <Stat label="Generated" value={String(s.generated)} />
        <Stat label="Valid" value={String(s.valid)} color={colors.pass} />
        <Stat label="Failed" value={String(s.failed)} color={s.failed > 0 ? colors.fail : undefined} />
        <Stat label="Clean" value={String(s.cleanPuzzles)} />
      </View>

      <View style={styles.block}>
        <Text style={styles.subhead}>Measured difficulty</Text>
        {DIFFICULTIES.map((d) => (
          <View key={d} style={styles.band}>
            <Text style={styles.bandLabel}>{d}</Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${(s.ratedDifficulty[d] / maxBand) * 100}%`, backgroundColor: difficultyColors[d] }]} />
            </View>
            <Text style={styles.bandValue}>{s.ratedDifficulty[d]}</Text>
          </View>
        ))}
        <Text style={styles.line}>
          Average score {s.averageScore.toFixed(1)} (range {s.minScore}–{s.maxScore}) · matches request {pct(s.difficultyMatchRate)}
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.subhead}>Structure</Text>
        <Text style={styles.line}>
          Avg words {s.averageWordCount.toFixed(1)} · overlap {pct(s.averageOverlap)} · density {pct(s.averageDensity)}
        </Text>
        <Text style={styles.line}>
          Directions: H {pct(s.directionShare.horizontal)} · V {pct(s.directionShare.vertical)} · D {pct(s.directionShare.diagonal)} · reverse{' '}
          {pct(s.directionShare.reverse)}
        </Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.subhead}>Variety</Text>
        <Text style={styles.line}>
          Layout similarity {s.layoutSimilarity.toFixed(2)} (random scatter ≈ {s.layoutSimilarityBaseline.toFixed(2)})
        </Text>
        <Text style={styles.line}>Same-theme word overlap {pct(s.wordSetSimilarity)}</Text>
        {s.repeatedFromPrevious.compared > 0 && (
          <Text style={styles.line}>
            Words repeated from previous puzzle (same theme + difficulty): {s.repeatedFromPrevious.averageWords.toFixed(2)} avg ·{' '}
            {s.repeatedFromPrevious.puzzlesWithRepeats}/{s.repeatedFromPrevious.compared} puzzles
          </Text>
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.subhead}>Quality issues</Text>
        {issues.length === 0 ? (
          <Text style={[styles.line, { color: colors.pass }]}>✓ None</Text>
        ) : (
          issues.map(([id, c]) => (
            <Text key={id} style={styles.line}>
              {id}: <Text style={{ color: colors.warn }}>{c.warn} warn</Text> · <Text style={{ color: colors.fail }}>{c.fail} fail</Text>
            </Text>
          ))
        )}
      </View>

      <Text style={styles.footnote}>
        {s.averageDurationMs.toFixed(1)} ms / puzzle · {s.averageAttempts.toFixed(1)} layout attempts avg
      </Text>
    </Card>
  );
});

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, color: colors.inkMuted },
  block: { gap: 6 },
  subhead: { fontSize: 14, fontWeight: '800', color: colors.ink },
  band: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bandLabel: { width: 60, fontSize: 13, color: colors.inkMuted, textTransform: 'capitalize' },
  bar: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  bandValue: { width: 32, fontSize: 13, fontWeight: '700', color: colors.ink, textAlign: 'right', fontVariant: ['tabular-nums'] },
  line: { fontSize: 13, color: colors.ink, lineHeight: 19 },
  footnote: { fontSize: 12, color: colors.inkMuted },
});
