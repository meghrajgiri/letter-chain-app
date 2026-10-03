/** Tile sizing for the letter grid (pure, so it can be unit-tested). */

export type TileLayout = {
  /** Tile side in px. */
  tile: number;
  /** Space between tiles. */
  gap: number;
  /** Distance between tile origins (tile + gap); the touch math uses this as the cell size. */
  pitch: number;
  /** Width/height of the whole tile grid. */
  size: number;
};

/** Gaps shrink on denser grids so tiles stay as large as possible. */
export function gapForGrid(gridSize: number): number {
  if (gridSize <= 8) return 6;
  if (gridSize <= 10) return 5;
  if (gridSize <= 12) return 4;
  return 3;
}

export function getTileLayout(gridSize: number, maxSize: number, gap = gapForGrid(gridSize)): TileLayout {
  const tile = Math.max(12, Math.floor((maxSize + gap) / gridSize - gap));
  return { tile, gap, pitch: tile + gap, size: gridSize * tile + (gridSize - 1) * gap };
}
