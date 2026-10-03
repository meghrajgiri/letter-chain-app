import { getDailyPuzzle } from '../daily';
import { parseDailyRow } from '../remoteDaily';

/** A row as the publish script writes it (and Supabase returns it). */
const rowFor = (key: string) => {
  const d = getDailyPuzzle(key);
  return JSON.parse(
    JSON.stringify({ date: d.date, mode: d.mode, theme: d.theme, theme_name: d.themeName, words: d.words, puzzle: d.puzzle, format_version: 1 }),
  );
};

describe('parseDailyRow', () => {
  it.each(['2026-10-04', '2026-10-05'])('accepts a published row (%s) and keeps the exact puzzle', (key) => {
    const local = getDailyPuzzle(key);
    const parsed = parseDailyRow(rowFor(key))!;
    expect(parsed.mode).toBe(local.mode);
    expect(parsed.puzzle.grid).toEqual(local.puzzle.grid);
    expect(parsed.puzzle.id).toBe(local.puzzle.id);
  });

  it('rejects rows from a newer format', () => {
    expect(parseDailyRow({ ...rowFor('2026-10-04'), format_version: 2 })).toBeNull();
  });

  it('rejects malformed or tampered puzzles', () => {
    const row = rowFor('2026-10-04');
    expect(parseDailyRow(null)).toBeNull();
    expect(parseDailyRow({ ...row, mode: 'other' })).toBeNull();
    expect(parseDailyRow({ ...row, puzzle: { ...row.puzzle, grid: 'nope' } })).toBeNull();
    // A word that is no longer in the grid.
    const grid = row.puzzle.grid.map((r: string[]) => r.map(() => 'Q'));
    expect(parseDailyRow({ ...row, puzzle: { ...row.puzzle, grid } })).toBeNull();
    const chain = rowFor('2026-10-05');
    expect(parseDailyRow({ ...chain, puzzle: { ...chain.puzzle, placements: chain.puzzle.placements.slice(1) } })).toBeNull();
  });
});
