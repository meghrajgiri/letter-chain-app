import { addDays, localDateKey, weekOf, weekdayIndex } from '../dates';
import { levelForXp, xpForLevel } from '../level';
import { scoreGame } from '../scoring';
import { computeStats, isPersonalBest } from '../stats';
import { computeStreak } from '../streak';
import { computeBadges } from '../badges';
import { computeProgress, summarizeCompletion } from '../summary';
import type { GameResult } from '../types';

let n = 0;
function result(overrides: Partial<GameResult> = {}): GameResult {
  n++;
  const localDate = overrides.localDate ?? '2026-10-05';
  return {
    id: `r${n}`,
    mode: 'classic',
    puzzleId: `p${n}`,
    theme: 'animals',
    difficulty: 'medium',
    isDaily: false,
    dailyDate: null,
    wordCount: 10,
    durationMs: 200_000,
    hintsUsed: 0,
    completedAt: `${localDate}T12:00:${String(n % 60).padStart(2, '0')}.000Z`,
    localDate,
    ...overrides,
  };
}
const daily = (date: string, extra: Partial<GameResult> = {}) => result({ isDaily: true, dailyDate: date, localDate: date, ...extra });

describe('dates', () => {
  it('formats and steps local date keys across month/year ends', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('builds Monday-first weeks', () => {
    // 2026-10-03 is a Saturday.
    expect(weekdayIndex('2026-10-03')).toBe(5);
    expect(weekOf('2026-10-03')[0]).toBe('2026-09-28');
    expect(weekOf('2026-10-03')[6]).toBe('2026-10-04');
  });
});

describe('scoring', () => {
  it('scales with words and difficulty', () => {
    const base = { mode: 'classic' as const, wordCount: 10, durationMs: 10_000_000, hintsUsed: 0 };
    expect(scoreGame({ ...base, difficulty: 'easy' })).toBe(100);
    expect(scoreGame({ ...base, difficulty: 'expert' })).toBe(250);
  });
  it('adds up to +50% for speed and removes 15% per hint', () => {
    const fast = { mode: 'classic' as const, difficulty: 'easy', wordCount: 10, durationMs: 0, hintsUsed: 0 };
    expect(scoreGame(fast)).toBe(150);
    expect(scoreGame({ ...fast, hintsUsed: 2 })).toBe(105);
    expect(scoreGame({ ...fast, hintsUsed: 10 })).toBe(0);
  });
});

describe('levels', () => {
  it('follows the XP curve', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(4)).toBe(600);
    expect(levelForXp(0).level).toBe(1);
    expect(levelForXp(99).level).toBe(1);
    expect(levelForXp(100).level).toBe(2);
    expect(levelForXp(450)).toMatchObject({ level: 3, progress: 0.5 });
  });
});

describe('streaks', () => {
  it('counts consecutive daily completions ending today', () => {
    const r = [daily('2026-10-01'), daily('2026-10-02'), daily('2026-10-03')];
    expect(computeStreak(r, '2026-10-03')).toMatchObject({ current: 3, longest: 3, todayDone: true });
  });
  it('keeps the streak alive until today is over', () => {
    const r = [daily('2026-10-01'), daily('2026-10-02')];
    expect(computeStreak(r, '2026-10-03')).toMatchObject({ current: 2, todayDone: false });
  });
  it('breaks after a missed day and tracks the longest run', () => {
    const r = [daily('2026-09-20'), daily('2026-09-21'), daily('2026-09-22'), daily('2026-10-02')];
    expect(computeStreak(r, '2026-10-04')).toMatchObject({ current: 0, longest: 3 });
  });
  it('ignores non-daily games', () => {
    expect(computeStreak([result({ localDate: '2026-10-03' })], '2026-10-03').current).toBe(0);
  });
  it('marks the current week', () => {
    const s = computeStreak([daily('2026-09-28'), daily('2026-10-03')], '2026-10-03');
    expect(s.week).toEqual([true, false, false, false, false, true, false]);
    expect(s.todayIndex).toBe(5);
  });
});

describe('stats and personal bests', () => {
  it('summarises history', () => {
    const r = [
      result({ localDate: '2026-09-29', wordCount: 8, durationMs: 100_000 }),
      result({ localDate: '2026-10-01', wordCount: 12, durationMs: 300_000, theme: 'space' }),
      result({ localDate: '2026-09-22', wordCount: 10, durationMs: 200_000 }), // last week
    ];
    const s = computeStats(r, '2026-10-03');
    expect(s.puzzlesSolved).toBe(3);
    expect(s.solvedThisWeek).toBe(2);
    expect(s.wordsFound).toBe(30);
    expect(s.bestTime?.durationMs).toBe(100_000);
    expect(s.weeklyWords).toEqual([0, 8, 0, 12, 0, 0, 0]);
    expect(s.weeklyWordsChange).toBeCloseTo(1); // 20 vs 10 words
  });
  it('detects personal bests within mode + difficulty only', () => {
    const earlier = [result({ durationMs: 200_000 }), result({ durationMs: 150_000, difficulty: 'easy' })];
    expect(isPersonalBest(result({ durationMs: 180_000 }), earlier)).toBe(true);
    expect(isPersonalBest(result({ durationMs: 210_000 }), earlier)).toBe(false);
    expect(isPersonalBest(result({ durationMs: 1, mode: 'chain' }), earlier)).toBe(false); // first of its kind
  });
});

describe('badges', () => {
  it('tracks progress and which game earned each badge', () => {
    const r = [result(), result({ mode: 'chain', difficulty: 'easy' }), result({ wordCount: 9, durationMs: 90_000 })];
    const badges = computeBadges(r, 24);
    const byId = Object.fromEntries(badges.map((b) => [b.id, b]));
    expect(byId.first).toMatchObject({ earned: true, earnedAt: r[0].completedAt });
    expect(byId.speed).toMatchObject({ earned: true, earnedAt: r[2].completedAt });
    expect(byId.chain10).toMatchObject({ earned: false, progress: 1, goal: 10 });
    expect(byId.themes).toMatchObject({ progress: 1, goal: 24 });
  });
});

describe('progress and completion summaries', () => {
  it('derives XP, level and today’s daily', () => {
    const r = [daily('2026-10-03', { durationMs: 10_000_000, wordCount: 10, difficulty: 'easy' })];
    const p = computeProgress(r, '2026-10-03', 24);
    expect(p.xp).toBe(100);
    expect(p.levels.classic.level).toBe(2);
    expect(p.todayDaily?.id).toBe(r[0].id);
  });

  it('summarises a just-finished game', () => {
    const history = [result({ durationMs: 300_000 })];
    const finished = result({ durationMs: 250_000 });
    const s = summarizeCompletion(finished, [...history, finished], '2026-10-05', 24);
    expect(s.score).toBe(scoreGame(finished));
    expect(s.isPersonalBest).toBe(true);
    expect(s.newBadges.map((b) => b.id)).toEqual([]); // "first" was earned by the earlier game
    expect(s.puzzlesSolved).toBe(2);
  });

  it('reports a first badge on the first game', () => {
    const first = result();
    expect(summarizeCompletion(first, [first], '2026-10-05', 24).newBadges.map((b) => b.id)).toContain('first');
  });
});
