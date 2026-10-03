import type { CompletionSummary } from '../../progress/summary';
import { shouldPromptSignIn } from '../promptRules';

const completion = (puzzlesSolved: number, extra: Partial<CompletionSummary> = {}): CompletionSummary =>
  ({
    score: 100,
    xpGained: 100,
    levelBefore: 1,
    levelAfter: 1,
    isPersonalBest: false,
    newBadges: [],
    streak: { current: 0, longest: 0, todayDone: false, week: [], todayIndex: 0 },
    puzzlesSolved,
    ...extra,
  }) as CompletionSummary;

describe('shouldPromptSignIn', () => {
  it('waits until the third puzzle', () => {
    expect(shouldPromptSignIn(completion(1), 0)).toBe(false);
    expect(shouldPromptSignIn(completion(3), 0)).toBe(true);
  });
  it('prompts early at milestones, but not for the first-game badge', () => {
    expect(shouldPromptSignIn(completion(1, { newBadges: [{ id: 'first' } as never] }), 0)).toBe(false);
    expect(shouldPromptSignIn(completion(2, { newBadges: [{ id: 'speed' } as never] }), 0)).toBe(true);
  });
  it('respects "Not now" snoozes', () => {
    expect(shouldPromptSignIn(completion(4), 8)).toBe(false);
    expect(shouldPromptSignIn(completion(8), 8)).toBe(true);
  });
});
