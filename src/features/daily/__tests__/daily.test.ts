import { cellKey } from '../../puzzle/engine/gridScan';
import { createRng } from '../../puzzle/engine/random';
import { DAILY_CHAIN_GRID, DAILY_WORD_LENGTHS, dailyKey, dailyModeFor, getDailyPuzzle, msUntilNextDaily, pickDailyWords } from '../daily';

const keyAt = (i: number) => new Date(Date.UTC(2026, 9, 1) + i * 86_400_000).toISOString().slice(0, 10);
const lengths = (words: string[]) => words.map((w) => w.length).sort((a, b) => a - b);

describe('daily puzzle', () => {
  it('uses the UTC date, so every timezone shares one daily', () => {
    expect(dailyKey(new Date('2026-10-04T23:30:00Z'))).toBe('2026-10-04');
    expect(dailyKey(new Date('2026-10-05T00:10:00Z'))).toBe('2026-10-05');
    expect(msUntilNextDaily(new Date('2026-10-04T23:00:00Z'))).toBe(60 * 60 * 1000);
  });

  it('alternates Classic and Chain day by day', () => {
    const modes = Array.from({ length: 6 }, (_, i) => dailyModeFor(keyAt(i)));
    for (let i = 1; i < modes.length; i++) expect(modes[i]).not.toBe(modes[i - 1]);
  });

  it('is identical for the same date and differs across dates', () => {
    const a = getDailyPuzzle('2026-10-04');
    expect(getDailyPuzzle('2026-10-04')).toBe(a); // cached
    expect(a.seed).toBe('daily-2026-10-04');
    expect(getDailyPuzzle('2026-10-05').seed).not.toBe(a.seed);
  });

  it('builds a 4/5/6/7/8-letter daily for every day of a year, in both modes', () => {
    for (let i = 0; i < 365; i++) {
      const daily = getDailyPuzzle(keyAt(i));
      expect(daily.mode).toBe(dailyModeFor(daily.date));
      expect(lengths(daily.words)).toEqual([...DAILY_WORD_LENGTHS]);
      if (daily.mode === 'chain') {
        const { rows, cols, placements } = daily.puzzle;
        expect([rows, cols]).toEqual([DAILY_CHAIN_GRID.rows, DAILY_CHAIN_GRID.cols]);
        // Every cell is used exactly once.
        expect(new Set(placements.flatMap((p) => p.cells.map(cellKey))).size).toBe(rows * cols);
      } else {
        expect(daily.puzzle.placements).toHaveLength(5);
      }
    }
  });

  it('pickDailyWords returns one word per length, or null when a length is missing', () => {
    const words = ['CAT', 'LION', 'TIGER', 'JAGUAR', 'PANTHER', 'ANTELOPE'];
    expect(lengths(pickDailyWords(words, [4, 5, 6, 7, 8], createRng(1))!)).toEqual([4, 5, 6, 7, 8]);
    expect(pickDailyWords(words, [4, 9], createRng(1))).toBeNull();
  });
});
