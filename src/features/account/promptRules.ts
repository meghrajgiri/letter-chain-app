/** Guest sign-in reminder rules (docs/progression-and-sync.md). Pure. */
import type { CompletionSummary } from '../progress/summary';

/** Puzzles before the first reminder, and how long "Not now" snoozes it. */
export const FIRST_PROMPT_AFTER = 3;
export const SNOOZE_PUZZLES = 5;

export function shouldPromptSignIn(completion: CompletionSummary, snoozeUntil: number): boolean {
  if (completion.puzzlesSolved < snoozeUntil) return false;
  // The "first" badge comes with the very first game — too early to ask.
  const milestone = completion.newBadges.some((b) => b.id !== 'first') || completion.streak.current >= 3;
  return completion.puzzlesSolved >= FIRST_PROMPT_AFTER || milestone;
}
