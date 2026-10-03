import type { Grid } from '../types';

/** Builds a grid from rows of letters, e.g. gridFrom(['CAT', 'XAX', 'XRX']). */
export function gridFrom(rows: string[]): Grid {
  return rows.map((row) => row.split(''));
}
