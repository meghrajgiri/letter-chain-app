import { addDays, weekOf } from './dates';
import { scoreGame } from './scoring';
import type { GameMode, GameResult } from './types';

export type BestTime = { durationMs: number; mode: GameMode; difficulty: string; theme: string };

export type Stats = {
  puzzlesSolved: number;
  solvedThisWeek: number;
  wordsFound: number;
  avgWordsPerPuzzle: number;
  totalPlaytimeMs: number;
  /** Average playtime per day the player played. */
  avgPlaytimePerDayMs: number;
  /** Fastest solve overall (any mode/difficulty), or null. */
  bestTime: BestTime | null;
  bestScore: number;
  /** Words found per day, Mon → Sun of the current week. */
  weeklyWords: number[];
  /** Change in words found vs the previous week (e.g. 0.18 = +18%); null if last week had none. */
  weeklyWordsChange: number | null;
};

export function computeStats(results: readonly GameResult[], todayKey: string): Stats {
  const week = weekOf(todayKey);
  const lastWeek = week.map((d) => addDays(d, -7));
  const weekSet = new Set(week);
  const lastWeekSet = new Set(lastWeek);

  let wordsFound = 0;
  let totalPlaytimeMs = 0;
  let bestScore = 0;
  let bestTime: BestTime | null = null;
  const days = new Set<string>();
  const weeklyWords = Array(7).fill(0);
  let lastWeekWords = 0;
  let solvedThisWeek = 0;

  for (const r of results) {
    wordsFound += r.wordCount;
    totalPlaytimeMs += r.durationMs;
    days.add(r.localDate);
    bestScore = Math.max(bestScore, scoreGame(r));
    if (!bestTime || r.durationMs < bestTime.durationMs) {
      bestTime = { durationMs: r.durationMs, mode: r.mode, difficulty: r.difficulty, theme: r.theme };
    }
    if (weekSet.has(r.localDate)) {
      weeklyWords[week.indexOf(r.localDate)] += r.wordCount;
      solvedThisWeek++;
    } else if (lastWeekSet.has(r.localDate)) {
      lastWeekWords += r.wordCount;
    }
  }

  const thisWeekWords = weeklyWords.reduce((a, b) => a + b, 0);
  return {
    puzzlesSolved: results.length,
    solvedThisWeek,
    wordsFound,
    avgWordsPerPuzzle: results.length ? wordsFound / results.length : 0,
    totalPlaytimeMs,
    avgPlaytimePerDayMs: days.size ? totalPlaytimeMs / days.size : 0,
    bestTime,
    bestScore,
    weeklyWords,
    weeklyWordsChange: lastWeekWords > 0 ? (thisWeekWords - lastWeekWords) / lastWeekWords : null,
  };
}

/** True if `result` is faster than every earlier result with the same mode + difficulty. */
export function isPersonalBest(result: GameResult, earlier: readonly GameResult[]): boolean {
  const same = earlier.filter((r) => r.mode === result.mode && r.difficulty === result.difficulty && r.id !== result.id);
  return same.length > 0 && same.every((r) => result.durationMs < r.durationMs);
}
