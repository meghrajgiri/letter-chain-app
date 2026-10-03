/** Spoiler-free share text for a finished game (no words, no grid). Pure. */
import type { GameResult } from './types';

type ShareInput = {
  result: Pick<GameResult, 'mode' | 'difficulty' | 'isDaily' | 'dailyDate' | 'wordCount' | 'durationMs' | 'hintsUsed'>;
  themeName: string;
  themeIcon?: string;
  score: number;
  streakDays: number;
  isPersonalBest: boolean;
  /** Where people can get the app (appended as the last line). */
  url?: string;
};

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function formatDailyDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function buildShareText({ result, themeName, themeIcon, score, streakDays, isPersonalBest, url }: ShareInput): string {
  const mode = result.mode === 'chain' ? 'Chain' : 'Classic';
  const difficulty = result.difficulty[0].toUpperCase() + result.difficulty.slice(1);
  const title = result.isDaily && result.dailyDate ? `Letter Chain · Daily ${formatDailyDate(result.dailyDate)}` : `Letter Chain · ${mode}`;
  const squares = (result.hintsUsed === 0 ? '🟩' : '🟨').repeat(Math.min(result.wordCount, 18));
  const lines = [
    title,
    `${themeIcon ? `${themeIcon} ` : ''}${themeName} · ${difficulty}`,
    `⏱ ${formatDuration(result.durationMs)}${isPersonalBest ? ' (personal best!)' : ''} · ${result.wordCount} words · ${
      result.hintsUsed === 0 ? 'no hints' : `${result.hintsUsed} hint${result.hintsUsed === 1 ? '' : 's'}`
    }`,
    `⭐ ${score} pts${streakDays > 0 ? ` · 🔥 ${streakDays}-day streak` : ''}`,
    squares,
  ];
  if (url) lines.push('', `Play Letter Chain: ${url}`);
  return lines.join('\n');
}
