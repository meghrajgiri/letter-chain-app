import { difficultyForLevel, levelsByMode, nextAutoGame, nextDifficultyStep, pickTheme } from '../autoGame';
import { summarizeCompletion } from '../summary';
import type { GameResult } from '../types';

let n = 0;
function result(overrides: Partial<GameResult> = {}): GameResult {
  n++;
  return {
    id: `r${n}`,
    mode: 'classic',
    puzzleId: `p${n}`,
    theme: 'animals',
    difficulty: 'easy',
    isDaily: false,
    dailyDate: null,
    wordCount: 5,
    durationMs: 600_000, // slow: no speed bonus, score = words × 10 × multiplier
    hintsUsed: 0,
    completedAt: `2026-10-05T10:${String(n % 60).padStart(2, '0')}:00.000Z`,
    localDate: '2026-10-05',
    ...overrides,
  };
}

describe('difficulty ladder', () => {
  it('raises Classic difficulty with Classic level', () => {
    expect([1, 2, 3, 5, 6, 9, 10, 30].map((l) => difficultyForLevel('classic', l))).toEqual([
      'easy', 'easy', 'medium', 'medium', 'hard', 'hard', 'expert', 'expert',
    ]);
  });

  it('raises Chain difficulty with Chain level (no expert)', () => {
    expect([1, 2, 3, 6, 7, 20].map((l) => difficultyForLevel('chain', l))).toEqual(['easy', 'easy', 'medium', 'medium', 'hard', 'hard']);
  });

  it('reports the next step, or null at the top', () => {
    expect(nextDifficultyStep('classic', 4)).toEqual({ fromLevel: 6, difficulty: 'hard' });
    expect(nextDifficultyStep('chain', 7)).toBeNull();
  });
});

describe('levelsByMode', () => {
  it('counts each mode’s XP only towards that mode', () => {
    // 2 classic easy games × 50 = 100 XP → Classic level 2; no chain games.
    const levels = levelsByMode([result(), result()]);
    expect(levels.classic).toMatchObject({ level: 2, xp: 100 });
    expect(levels.chain).toMatchObject({ level: 1, xp: 0 });
  });

  it('completion levels use the finished game’s mode', () => {
    const history = [result(), result()]; // Classic level 2
    const chain = result({ mode: 'chain', difficulty: 'easy' });
    const c = summarizeCompletion(chain, [...history, chain], '2026-10-05', 24);
    expect(c.levelBefore).toBe(1);
    expect(c.level.xp).toBe(75); // 5 × 10 × 1.5
  });
});

describe('pickTheme', () => {
  const themes = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  it('skips the five most recently played themes', () => {
    const results = ['a', 'b', 'c', 'd', 'e'].map((theme) => result({ theme }));
    for (const r of [0, 0.3, 0.6, 0.99]) expect(['f', 'g']).toContain(pickTheme(themes, results, () => r));
  });

  it('always leaves at least one theme', () => {
    const results = ['a', 'b'].map((theme) => result({ theme }));
    expect(pickTheme(['a', 'b'], results, () => 0.5)).toBe('a');
  });

  it('nextAutoGame combines the theme pick with the mode’s difficulty', () => {
    const results = Array.from({ length: 6 }, () => result()); // 300 XP → Classic level 3
    expect(nextAutoGame('classic', results, themes, () => 0)).toMatchObject({ difficulty: 'medium', level: 3, theme: 'a' });
    expect(nextAutoGame('chain', results, themes, () => 0)).toMatchObject({ difficulty: 'easy', level: 1 });
  });
});
