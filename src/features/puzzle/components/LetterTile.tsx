/**
 * Shared tile state values and screen-reader labels for the letter boards
 * (TileGrid for Classic, ChainGrid for Chain).
 */

/** -2 = idle, -1 = in the current selection, ≥0 = found word colour index. */
export type TileState = number;
export const TILE_IDLE = -2;
export const TILE_SELECTED = -1;

/** Screen-reader label for a tile: "A, row 2, column 5, selected". */
export function tileLabel(letter: string, row: number, col: number, state: TileState, ring?: boolean): string {
  const status = state === TILE_SELECTED ? ', selected' : state >= 0 ? ', found' : ring ? ', hint' : '';
  return `${letter}, row ${row + 1}, column ${col + 1}${status}`;
}
