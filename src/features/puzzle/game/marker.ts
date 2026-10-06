/**
 * Geometry for the marker-pen board: found words and the live selection are
 * drawn as rounded strokes behind the letters. Pure, so it can be tested.
 */
import type { Cell } from '../engine/types';
import type { TileLayout } from './tileLayout';

export type Stroke = {
  /** Box before rotation (the stroke is centred on the midpoint of its two end letters). */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Rotation in degrees around the box centre. */
  angle: number;
};

/** Centre of a cell in px, relative to the grid's top-left corner. */
export function cellCenter(cell: Cell, layout: Pick<TileLayout, 'tile' | 'pitch'>): { x: number; y: number } {
  return { x: cell.col * layout.pitch + layout.tile / 2, y: cell.row * layout.pitch + layout.tile / 2 };
}

/**
 * A stroke from `start` to `end` (inclusive), `thickness` px tall with round
 * ends that cover both end letters. A single cell gives a circle.
 */
export function strokeBetween(start: Cell, end: Cell, layout: Pick<TileLayout, 'tile' | 'pitch'>, thickness: number): Stroke {
  const a = cellCenter(start, layout);
  const b = cellCenter(end, layout);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const width = length + thickness;
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  return {
    left: cx - width / 2,
    top: cy - thickness / 2,
    width,
    height: thickness,
    angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  };
}

/** Whether `cell` lies on one of the 8 straight lines through `origin` (the origin itself counts). */
export function isOnLineFrom(origin: Cell, cell: Cell): boolean {
  const dr = cell.row - origin.row;
  const dc = cell.col - origin.col;
  return dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
}
