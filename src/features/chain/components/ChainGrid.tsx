import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderHandlers } from 'react-native';

import { colors, radius, wordColors } from '@/theme/tokens';
import { LetterTile, TILE_IDLE, TILE_SELECTED, tileLabel } from '../../puzzle/components/LetterTile';
import { cellKey } from '../../puzzle/engine/gridScan';
import type { Cell } from '../../puzzle/engine/types';
import type { TileLayout } from '../../puzzle/game/tileLayout';
import type { FoundChainWord } from '../hooks/useChainPuzzle';

type Props = {
  grid: readonly (readonly string[])[];
  layout: TileLayout;
  found: readonly FoundChainWord[];
  path: readonly Cell[];
  hintCells: readonly Cell[];
  panHandlers?: GestureResponderHandlers;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Screen reader mode: every tile becomes a button that calls `onTileTap`. */
  screenReader?: boolean;
  onTileTap?: (cell: Cell) => void;
};

export const CHAIN_WELL_PADDING = 6;

type Connector = { key: string; a: Cell; b: Cell; color: string };

/** Bars in the gaps between consecutive path cells, so a word's route is visible. */
function connectorsFor(cells: readonly Cell[], color: string, prefix: string): Connector[] {
  const out: Connector[] = [];
  for (let i = 1; i < cells.length; i++) out.push({ key: `${prefix}-${i}`, a: cells[i - 1], b: cells[i], color });
  return out;
}

/** Chain-mode letter grid: tiles plus connectors that trace each found word and the live path. */
export const ChainGrid = memo(function ChainGrid({
  grid,
  layout,
  found,
  path,
  hintCells,
  panHandlers,
  accessibilityLabel,
  accessibilityHint,
  screenReader = false,
  onTileTap,
}: Props) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const foundColor = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of found) for (const c of f.cells) map.set(cellKey(c), f.colorIndex);
    return map;
  }, [found]);
  const selected = useMemo(() => new Set(path.map(cellKey)), [path]);
  const rings = useMemo(() => new Set(hintCells.map(cellKey)), [hintCells]);

  const connectors = useMemo(
    () => [
      ...found.flatMap((f) => connectorsFor(f.cells, wordColors[f.colorIndex % wordColors.length].lip, f.word)),
      ...connectorsFor(path, colors.primaryDark, 'sel'),
    ],
    [found, path],
  );

  const { tile, pitch } = layout;
  const thickness = Math.max(6, Math.round(tile * 0.34));

  return (
    <View style={styles.well} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint}>
      <View
        style={{ width: cols * pitch - layout.gap, height: rows * pitch - layout.gap, gap: layout.gap, pointerEvents: screenReader ? 'auto' : 'box-only' }}
        {...(screenReader ? undefined : panHandlers)}
      >
        {connectors.map(({ key, a, b, color }) => {
          const horizontal = a.row === b.row;
          const left = Math.min(a.col, b.col) * pitch + (horizontal ? tile / 2 : (tile - thickness) / 2);
          const top = Math.min(a.row, b.row) * pitch + (horizontal ? (tile - thickness) / 2 : tile / 2);
          return (
            <View
              key={key}
              style={[
                styles.connector,
                { left, top, backgroundColor: color, borderRadius: thickness / 2 },
                horizontal ? { width: pitch, height: thickness } : { width: thickness, height: pitch },
              ]}
            />
          );
        })}
        {grid.map((row, r) => (
          <View key={r} style={[styles.row, { gap: layout.gap }]}>
            {row.map((letter, c) => {
              const key = `${r},${c}`;
              const state = selected.has(key) ? TILE_SELECTED : (foundColor.get(key) ?? TILE_IDLE);
              const ring = rings.has(key);
              const el = <LetterTile key={c} letter={letter} size={tile} state={state} ring={ring} />;
              if (!screenReader) return el;
              return (
                <Pressable key={c} accessibilityRole="button" accessibilityLabel={tileLabel(letter, r, c, state, ring)} onPress={() => onTileTap?.({ row: r, col: c })}>
                  {el}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  well: { padding: CHAIN_WELL_PADDING, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  row: { flexDirection: 'row' },
  connector: { position: 'absolute' },
});
