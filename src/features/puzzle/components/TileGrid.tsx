import { memo, useMemo } from 'react';
import { StyleSheet, View, type GestureResponderHandlers } from 'react-native';

import { colors, radius } from '@/theme/tokens';
import { getCellsBetween } from '../engine/getCellsBetween';
import { cellKey } from '../engine/gridScan';
import type { Cell, Grid } from '../engine/types';
import type { TileLayout } from '../game/tileLayout';
import type { FoundWord } from '../hooks/usePuzzle';
import type { Selection } from '../hooks/usePuzzleSelection';
import { LetterTile, TILE_IDLE, TILE_SELECTED } from './LetterTile';

type Props = {
  grid: Grid;
  layout: TileLayout;
  found: readonly FoundWord[];
  selection: Selection | null;
  /** Hint markers: first letters of hinted words. */
  hintCells?: readonly Cell[];
  panHandlers?: GestureResponderHandlers;
  accessibilityLabel?: string;
};

/** Inner padding of the lavender well around the tiles. */
export const TILE_WELL_PADDING = 6;

/**
 * The playable letter grid. Tile states are derived once per render; each
 * LetterTile is memoised, so a drag only re-renders tiles whose state changed.
 */
export const TileGrid = memo(function TileGrid({ grid, layout, found, selection, hintCells, panHandlers, accessibilityLabel }: Props) {
  const foundColor = useMemo(() => {
    const map = new Map<string, number>();
    // Later finds paint over earlier ones where words cross.
    for (const f of found) for (const c of getCellsBetween(f.start, f.end) ?? []) map.set(cellKey(c), f.colorIndex);
    return map;
  }, [found]);

  const selected = useMemo(() => {
    const cells = selection ? getCellsBetween(selection.start, selection.end) : null;
    return new Set((cells ?? []).map(cellKey));
  }, [selection]);

  const rings = useMemo(() => new Set((hintCells ?? []).map(cellKey)), [hintCells]);

  return (
    <View style={styles.well} accessibilityLabel={accessibilityLabel}>
      {/* box-only: this view is the touch target, so locationX/Y are grid-relative. */}
      <View style={{ width: layout.size, height: layout.size, gap: layout.gap, pointerEvents: 'box-only' }} {...panHandlers}>
        {grid.map((row, r) => (
          <View key={r} style={[styles.row, { gap: layout.gap }]}>
            {row.map((letter, c) => {
              const key = `${r},${c}`;
              const state = selected.has(key) ? TILE_SELECTED : (foundColor.get(key) ?? TILE_IDLE);
              return <LetterTile key={c} letter={letter} size={layout.tile} state={state} ring={rings.has(key)} />;
            })}
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  well: {
    padding: TILE_WELL_PADDING,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceLow,
  },
  row: { flexDirection: 'row' },
});
