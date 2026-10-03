import { THEMES } from '../../data/themes';
import { generateBatch, summarizeBatch } from '../batch';
import { getDifficultyConfig } from '../difficultyConfig';
import { generatePuzzle } from '../generatePuzzle';
import { isReverseDirection, isDiagonal } from '../directions';
import { DIFFICULTIES } from '../types';
import { createWordHistory } from '../../game/wordHistory';

describe.each(DIFFICULTIES)('generating 100 %s puzzles', (difficulty) => {
  const items = generateBatch(
    Array.from({ length: 100 }, (_, i) => ({ theme: THEMES[i % THEMES.length].id, difficulty, seed: 50000 + i })),
  );
  const puzzles = items.map((i) => i.puzzle!).filter(Boolean);
  const config = getDifficultyConfig(difficulty);

  it('all puzzles are valid', () => {
    expect(items.filter((i) => !i.validation.valid).map((i) => i.validation.errors)).toEqual([]);
    expect(puzzles).toHaveLength(100);
  });

  it('every intended word is present exactly where placed', () => {
    for (const p of puzzles) {
      expect(p.placements.map((pl) => pl.word)).toEqual(p.words);
      for (const pl of p.placements) {
        expect(pl.cells.map((c) => p.grid[c.row][c.col]).join('')).toBe(pl.word);
      }
    }
  });

  it('has no duplicate words and respects word count and grid size', () => {
    for (const p of puzzles) {
      expect(new Set(p.words).size).toBe(p.words.length);
      expect(p.words.length).toBeGreaterThanOrEqual(config.wordCount.min);
      expect(p.words.length).toBeLessThanOrEqual(config.wordCount.max);
      expect(p.gridSize).toBe(config.gridSize);
    }
  });

  it('only uses directions allowed for the difficulty', () => {
    for (const p of puzzles) {
      for (const pl of p.placements) {
        if (difficulty === 'easy') {
          expect(isReverseDirection(pl.direction)).toBe(false);
          expect(isDiagonal(pl.direction)).toBe(false);
        }
        if (difficulty === 'medium') {
          expect(isReverseDirection(pl.direction) && isDiagonal(pl.direction)).toBe(false);
        }
      }
    }
  });

  it('mostly lands in the requested difficulty band with few quality failures', () => {
    const summary = summarizeBatch(items);
    expect(summary.difficultyMatchRate).toBeGreaterThanOrEqual(0.9);
    expect(puzzles.filter((p) => p.quality.failCount > 0).length).toBeLessThanOrEqual(5);
    // Layouts should be no more similar than random scatter (+ small margin).
    expect(summary.layoutSimilarity).toBeLessThan(summary.layoutSimilarityBaseline + 0.05);
  });
});

describe('generation options', () => {
  it('honours grid size and word count overrides', () => {
    const p = generatePuzzle({ theme: 'food', difficulty: 'medium', gridSize: 12, wordCount: 9, seed: 3 });
    expect(p.gridSize).toBe(12);
    expect(p.grid).toHaveLength(12);
    expect(p.words.length).toBeGreaterThanOrEqual(8);
    expect(p.words.length).toBeLessThanOrEqual(9);
  });

  it('accepts a custom word collection', () => {
    const p = generatePuzzle({
      words: ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet'],
      themeName: 'NATO',
      difficulty: 'easy',
      seed: 9,
    });
    expect(p.theme).toBe('custom');
    expect(p.words.every((w) => /^[A-Z]+$/.test(w))).toBe(true);
  });

  it('throws for an unknown theme', () => {
    expect(() => generatePuzzle({ theme: 'nope', difficulty: 'easy', seed: 1 })).toThrow(/Unknown theme/);
  });

  it('never selects words that contain each other', () => {
    for (let seed = 0; seed < 50; seed++) {
      const p = generatePuzzle({ theme: 'animals', difficulty: 'easy', seed });
      for (const a of p.words) for (const b of p.words) if (a !== b) expect(b.includes(a)).toBe(false);
    }
  });
});

describe('avoiding recent words', () => {
  it('keeps avoided words out when the bank has enough others', () => {
    const avoid = generatePuzzle({ theme: 'animals', difficulty: 'medium', seed: 1 }).words;
    const next = generatePuzzle({ theme: 'animals', difficulty: 'medium', seed: 2, avoidWords: avoid });
    expect(next.words.filter((w) => avoid.includes(w))).toEqual([]);
    expect(next.reusedWords).toEqual([]);
  });

  it('is deterministic for the same seed and avoid list, and the id reflects the list', () => {
    const a = generatePuzzle({ theme: 'space', difficulty: 'hard', seed: 5, avoidWords: ['PLANET', 'COMET'] });
    const b = generatePuzzle({ theme: 'space', difficulty: 'hard', seed: 5, avoidWords: ['PLANET', 'COMET'] });
    const plain = generatePuzzle({ theme: 'space', difficulty: 'hard', seed: 5 });
    expect(a).toEqual(b);
    expect(a.id).not.toBe(plain.id);
    expect(a.id.startsWith(plain.id)).toBe(true);
  });

  it('reuses the least recently used words when the bank runs short', () => {
    const words = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL', 'INDIA', 'JULIET'];
    const p = generatePuzzle({ words, difficulty: 'easy', wordCount: 5, seed: 1, avoidWords: ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT'] });
    // Only 4 fresh words exist, so some must be reused — the oldest first (end of the list).
    expect(p.reusedWords.length).toBeGreaterThan(0);
    expect(p.reusedWords).not.toContain('ALPHA');
  });

  it.each(DIFFICULTIES)('consecutive %s games with history repeat (almost) nothing', (difficulty) => {
    let shared = 0;
    let pairs = 0;
    for (const theme of ['animals', 'food', 'space', 'colors']) {
      const history = createWordHistory();
      let previous: string[] = [];
      for (let game = 0; game < 10; game++) {
        const p = generatePuzzle({ theme, difficulty, seed: 900 + game, avoidWords: history.recentWords(theme) });
        history.record(theme, p.id, p.words);
        if (game > 0) {
          shared += p.words.filter((w) => previous.includes(w)).length;
          pairs++;
        }
        previous = p.words;
      }
    }
    expect(shared / pairs).toBeLessThan(0.2);
  });
});

describe('word banks', () => {
  it('has at least 20 themes with 60+ clean words each', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(20);
    for (const theme of THEMES) {
      expect(theme.words.length).toBeGreaterThanOrEqual(60);
      for (const w of theme.words) expect(w).toMatch(/^[A-Z]{3,}$/);
      expect(new Set(theme.words).size).toBe(theme.words.length);
    }
  });
});

describe('word mix (4–6 words, varied lengths)', () => {
  it.each(DIFFICULTIES)('%s puzzles have 4–6 words and no length more than twice', (difficulty) => {
    for (const theme of ['animals', 'food', 'space', 'colors', 'jobs']) {
      for (let seed = 0; seed < 4; seed++) {
        const p = generatePuzzle({ theme, difficulty, seed });
        expect(p.words.length).toBeGreaterThanOrEqual(4);
        expect(p.words.length).toBeLessThanOrEqual(6);
        const counts = new Map<number, number>();
        for (const w of p.words) counts.set(w.length, (counts.get(w.length) ?? 0) + 1);
        expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
      }
    }
  });
});
