import { memo, useMemo } from 'react';
import { StyleSheet, View, type GestureResponderHandlers } from 'react-native';

import { colors, foundPalette, radius } from '@/theme/tokens';
import { cellKey } from '../engine/gridScan';
import { getCellsBetween } from '../engine/getCellsBetween';
import type { Cell, Grid, WordPlacement } from '../engine/types';
import type { FoundWord } from '../hooks/usePuzzle';
import type { Selection } from '../hooks/usePuzzleSelection';
import { HighlightPill } from './HighlightPill';
import { PuzzleCell } from './PuzzleCell';

type Props = {
  grid: Grid;
  cellSize: number;
  found?: readonly FoundWord[];
  selection?: Selection | null;
  /** Studio: highlight every placement and fade filler letters. */
  answers?: readonly WordPlacement[];
  panHandlers?: GestureResponderHandlers;
  accessibilityLabel?: string;
};

type LetterLayerProps = {
  grid: Grid;
  cellSize: number;
  emphasized: ReadonlySet<string>;
  dimFiller: boolean;
};

/** All letters. Memoised so drag updates (selection only) never re-render it. */
const LetterLayer = memo(function LetterLayer({ grid, cellSize, emphasized, dimFiller }: LetterLayerProps) {
  return (
    <View style={{ pointerEvents: 'none' }}>
      {grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((letter, c) => {
            const isWord = emphasized.has(`${r},${c}`);
            return (
              <PuzzleCell key={c} letter={letter} size={cellSize} emphasized={isWord} dimmed={dimFiller && !isWord} />
            );
          })}
        </View>
      ))}
    </View>
  );
});

function cellsOf(start: Cell, end: Cell): Cell[] {
  return getCellsBetween(start, end) ?? [];
}

export const PuzzleGrid = memo(function PuzzleGrid({
  grid,
  cellSize,
  found = [],
  selection,
  answers,
  panHandlers,
  accessibilityLabel,
}: Props) {
  const size = grid.length * cellSize;

  const emphasized = useMemo(() => {
    const keys = new Set<string>();
    if (answers) answers.forEach((p) => p.cells.forEach((c) => keys.add(cellKey(c))));
    found.forEach((f) => cellsOf(f.start, f.end).forEach((c) => keys.add(cellKey(c))));
    return keys;
  }, [answers, found]);

  return (
    <View
      style={[styles.board, { width: size + 2, height: size + 2 }]}
      accessibilityLabel={accessibilityLabel}
    >
      {/* box-only: this view is the touch target, so locationX/Y are grid-relative. */}
      <View style={{ width: size, height: size, pointerEvents: 'box-only' }} {...panHandlers}>
        {answers?.map((p, i) => (
          <HighlightPill key={p.word} start={p.start} end={p.end} cellSize={cellSize} color={foundPalette[i % foundPalette.length]} />
        ))}
        {found.map((f) => (
          <HighlightPill
            key={f.word}
            start={f.start}
            end={f.end}
            cellSize={cellSize}
            color={foundPalette[f.colorIndex % foundPalette.length]}
          />
        ))}
        {selection && (
          <HighlightPill
            start={selection.start}
            end={selection.end}
            cellSize={cellSize}
            color={colors.selection}
            borderColor={colors.selectionBorder}
          />
        )}
        <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
          <LetterLayer grid={grid} cellSize={cellSize} emphasized={emphasized} dimFiller={!!answers} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row' },
});
