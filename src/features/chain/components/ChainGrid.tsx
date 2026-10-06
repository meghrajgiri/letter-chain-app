import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderHandlers } from 'react-native';

import { colors, fonts, wordColors } from '@/theme/tokens';
import { TILE_IDLE, TILE_SELECTED, tileLabel, type TileState } from '../../puzzle/components/LetterTile';
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

type BeadLook = 'idle' | 'found' | 'selected' | 'next' | 'hint';

/** One letter as a round bead; the threads between beads show each word's route. */
const Bead = memo(function Bead({ letter, size, look, colorIndex }: { letter: string; size: number; look: BeadLook; colorIndex: number }) {
  const word = wordColors[colorIndex % wordColors.length];
  const style =
    look === 'found'
      ? { backgroundColor: word.bg, borderColor: word.lip, borderWidth: 2 }
      : look === 'selected'
        ? { backgroundColor: colors.primary, borderColor: colors.primaryDark, borderWidth: 2 }
        : look === 'next'
          ? { backgroundColor: colors.surface, borderColor: '#A99FF2', borderWidth: 2, borderStyle: 'dashed' as const }
          : look === 'hint'
            ? { backgroundColor: colors.yellowSoft, borderColor: colors.yellow, borderWidth: 2.5 }
            : { backgroundColor: colors.surfaceLow, borderColor: '#DEDAF0', borderBottomWidth: 3 };
  const ink = look === 'found' ? word.ink : look === 'selected' ? colors.primaryInk : colors.ink;
  return (
    <View style={[styles.bead, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text allowFontScaling={false} style={[styles.letter, { fontSize: Math.round(size * 0.46), lineHeight: Math.round(size * 0.58), color: ink }]}>
        {letter}
      </Text>
    </View>
  );
});

/**
 * Chain-mode board: letters as beads on threads. Found words keep a coloured
 * thread through their beads; the live path is a violet thread, and the
 * letters it can continue to (up, down or sideways) get a dashed ring.
 */
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
  // Free neighbours of the path's last letter: where the word can go next.
  const next = useMemo(() => {
    const last = path[path.length - 1];
    const out = new Set<string>();
    if (!last) return out;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = `${last.row + dr},${last.col + dc}`;
      if (last.row + dr < 0 || last.col + dc < 0 || last.row + dr >= rows || last.col + dc >= cols) continue;
      if (!foundColor.has(key) && !selected.has(key)) out.add(key);
    }
    return out;
  }, [path, rows, cols, foundColor, selected]);

  const connectors = useMemo(
    () => [
      ...found.flatMap((f) => connectorsFor(f.cells, wordColors[f.colorIndex % wordColors.length].lip, f.word)),
      ...connectorsFor(path, colors.primaryDark, 'sel'),
    ],
    [found, path],
  );

  const { tile, pitch } = layout;
  const thickness = Math.max(6, Math.round(tile * 0.3));

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
              const colorIndex = foundColor.get(key);
              const state: TileState = selected.has(key) ? TILE_SELECTED : (colorIndex ?? TILE_IDLE);
              const ring = rings.has(key);
              const look: BeadLook = selected.has(key)
                ? 'selected'
                : colorIndex !== undefined
                  ? 'found'
                  : next.has(key)
                    ? 'next'
                    : ring
                      ? 'hint'
                      : 'idle';
              const el = <Bead key={c} letter={letter} size={tile} look={look} colorIndex={colorIndex ?? 0} />;
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
  well: { padding: CHAIN_WELL_PADDING },
  row: { flexDirection: 'row' },
  connector: { position: 'absolute' },
  bead: { alignItems: 'center', justifyContent: 'center', userSelect: 'none' },
  letter: { fontFamily: fonts.extrabold, textAlign: 'center', includeFontPadding: false, userSelect: 'none' },
});
