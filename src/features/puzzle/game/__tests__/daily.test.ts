import { generatePuzzle } from '../../engine/generatePuzzle';
import { getDailyPuzzle, msUntilNextDaily, toDateKey } from '../daily';

describe('daily puzzle', () => {
  it('is the same for the same date and differs across dates', () => {
    const a = getDailyPuzzle(new Date(2026, 9, 3, 8));
    const b = getDailyPuzzle(new Date(2026, 9, 3, 22));
    const c = getDailyPuzzle(new Date(2026, 9, 4, 8));
    expect(a).toEqual(b);
    expect(a.seed).toBe('daily-2026-10-03');
    expect(c.seed).not.toBe(a.seed);
  });

  it('generates a reproducible 8-word medium puzzle', () => {
    const d = getDailyPuzzle(new Date(2026, 9, 3));
    const p1 = generatePuzzle({ theme: d.theme, difficulty: d.difficulty, wordCount: d.wordCount, seed: d.seed });
    const p2 = generatePuzzle({ theme: d.theme, difficulty: d.difficulty, wordCount: d.wordCount, seed: d.seed });
    expect(p1.grid).toEqual(p2.grid);
    expect(p1.words.length).toBeGreaterThanOrEqual(7);
    expect(p1.words.length).toBeLessThanOrEqual(8);
  });

  it('formats dates and counts down to midnight', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(msUntilNextDaily(new Date(2026, 0, 5, 23, 0, 0))).toBe(60 * 60 * 1000);
  });
});
