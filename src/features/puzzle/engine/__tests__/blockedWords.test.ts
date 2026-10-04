import { generateChainPuzzle } from '../../../chain/engine/generateChainPuzzle';
import { THEMES } from '../../data/themes';
import { BLOCKED_WORDS, findBlockedWords } from '../blockedWords';
import { DIFFICULTIES } from '../types';
import { generatePuzzle } from '../generatePuzzle';
import { validatePuzzle } from '../validatePuzzle';

const grid = (rows: string[]) => rows.map((r) => r.split(''));
// Build the test word from the list itself, so this file stays clean too.
const rude = BLOCKED_WORDS.find((w) => w.length === 4)!;

describe('findBlockedWords', () => {
  it('decodes a list of upper-case words', () => {
    expect(BLOCKED_WORDS.length).toBeGreaterThan(50);
    for (const w of BLOCKED_WORDS) expect(w).toMatch(/^[A-Z]{3,}$/);
  });

  it('finds blocked words in every direction, including backwards', () => {
    const backwards = rude.split('').reverse().join('');
    expect(findBlockedWords(grid([rude, 'XXXX', 'XXXX', 'XXXX']))).toHaveLength(1);
    expect(findBlockedWords(grid(['XXXX', backwards, 'XXXX', 'XXXX']))).toHaveLength(1);
    const diagonal = ['QQQQ', 'QQQQ', 'QQQQ', 'QQQQ'].map((r, i) => r.slice(0, i) + rude[i] + r.slice(i + 1));
    expect(findBlockedWords(grid(diagonal))).toHaveLength(1);
  });

  it('allows a blocked string that lies wholly inside a real word', () => {
    const g = grid(['GRASS', 'QQQQQ']);
    const grass = [0, 1, 2, 3, 4].map((col) => ({ row: 0, col }));
    expect(findBlockedWords(g, [grass])).toEqual([]);
    expect(findBlockedWords(g)).not.toEqual([]); // without the word, ASS counts
  });

  it('makes validation fail', () => {
    const g = grid([rude, 'QQQQ', 'QQQQ', 'QQQQ']);
    expect(validatePuzzle({ gridSize: 4, grid: g, words: [], placements: [] }).errors).toContain('Grid spells a blocked word');
  });
});

describe('generated grids never spell blocked words', () => {
  it.each(DIFFICULTIES)('classic %s', (difficulty) => {
    for (const theme of THEMES.slice(0, 12)) {
      for (let seed = 0; seed < 3; seed++) {
        const p = generatePuzzle({ theme: theme.id, difficulty, seed });
        expect(findBlockedWords(p.grid, p.placements.map((x) => x.cells))).toEqual([]);
      }
    }
  });

  it('chain', () => {
    for (const theme of THEMES.slice(0, 12)) {
      for (let seed = 0; seed < 3; seed++) {
        const p = generateChainPuzzle({ theme: theme.id, difficulty: 'medium', seed });
        expect(findBlockedWords(p.grid, p.placements.map((x) => x.cells))).toEqual([]);
      }
    }
  });
});
