import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Cell } from '../engine/types';

type Props = {
  start: Cell;
  end: Cell;
  cellSize: number;
  color: string;
  borderColor?: string;
};

/**
 * Rounded capsule spanning a straight run of cells, rotated to any of the
 * 8 directions. One view per word instead of styling every cell.
 */
export const HighlightPill = memo(function HighlightPill({ start, end, cellSize, color, borderColor }: Props) {
  const dx = (end.col - start.col) * cellSize;
  const dy = (end.row - start.row) * cellSize;
  const thickness = cellSize * 0.8;
  const length = Math.hypot(dx, dy) + thickness;
  const centerX = ((start.col + end.col + 1) / 2) * cellSize;
  const centerY = ((start.row + end.row + 1) / 2) * cellSize;
  const angle = Math.atan2(dy, dx);

  return (
    <View
      style={[
        styles.pill,
        {
          left: centerX - length / 2,
          top: centerY - thickness / 2,
          width: length,
          height: thickness,
          borderRadius: thickness / 2,
          backgroundColor: color,
          borderColor: borderColor ?? 'transparent',
          transform: [{ rotate: `${angle}rad` }],
        },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  pill: { position: 'absolute', borderWidth: 2, pointerEvents: 'none' },
});
