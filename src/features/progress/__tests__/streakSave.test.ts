import { computeStreak } from '../streak';
import { streakSaveOffer } from '../streakSave';
import { computeProgress } from '../summary';
import type { GameResult, StreakSave } from '../types';

let n = 0;
const daily = (date: string): GameResult => {
  n++;
  return {
    id: `r${n}`,
    mode: 'classic',
    puzzleId: `p${n}`,
    theme: 'animals',
    difficulty: 'medium',
    isDaily: true,
    dailyDate: date,
    wordCount: 10,
    durationMs: 200_000,
    hintsUsed: 0,
    completedAt: `${date}T12:00:00.000Z`,
    localDate: date,
  };
};
const save = (day: string): StreakSave => ({ id: `s-${day}`, day, savedAt: `${day}T23:00:00.000Z`, syncedAt: null });
const dailies = (...dates: string[]) => dates.map(daily);

// 2026-10-20 is a Tuesday.
const TODAY = '2026-10-20';

describe('streakSaveOffer', () => {
  it('offers to fill yesterday when a long enough run ended the day before', () => {
    expect(streakSaveOffer(dailies('2026-10-16', '2026-10-17', '2026-10-18'), [], TODAY)).toEqual({ day: '2026-10-19', streak: 3 });
  });

  it('stays on offer after today’s daily is done', () => {
    expect(streakSaveOffer(dailies('2026-10-17', '2026-10-18', TODAY), [], TODAY)).toEqual({ day: '2026-10-19', streak: 2 });
  });

  it('is not offered when yesterday was played', () => {
    expect(streakSaveOffer(dailies('2026-10-18', '2026-10-19'), [], TODAY)).toBeNull();
  });

  it('is not offered after two or more missed days', () => {
    expect(streakSaveOffer(dailies('2026-10-16', '2026-10-17'), [], TODAY)).toBeNull();
  });

  it('is not offered for a run shorter than two days', () => {
    expect(streakSaveOffer(dailies('2026-10-18'), [], TODAY)).toBeNull();
    expect(streakSaveOffer([], [], TODAY)).toBeNull();
  });

  it('is not offered again once yesterday is saved', () => {
    expect(streakSaveOffer(dailies('2026-10-17', '2026-10-18'), [save('2026-10-19')], TODAY)).toBeNull();
  });

  it('allows one save in any 7 days', () => {
    // Saved 10-13; the run 10-12 … 10-18 continues through it.
    const played = dailies('2026-10-12', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18');
    expect(streakSaveOffer(played, [save('2026-10-13')], TODAY)).toBeNull(); // 6 days apart
    // Saved 10-12 instead (7 days before the missed 10-19): allowed again.
    const later = dailies('2026-10-11', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18');
    expect(streakSaveOffer(later, [save('2026-10-12')], TODAY)).toEqual({ day: '2026-10-19', streak: 8 });
  });

  it('counts an earlier save as part of the run it would protect', () => {
    const played = dailies('2026-10-05', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18');
    expect(streakSaveOffer(played, [save('2026-10-06')], TODAY)).toEqual({ day: '2026-10-19', streak: 14 });
  });
});

describe('computeStreak with saves', () => {
  it('carries the streak through a saved day', () => {
    const played = dailies('2026-10-17', '2026-10-18', TODAY);
    expect(computeStreak(played, TODAY).current).toBe(1);
    const s = computeStreak(played, TODAY, [save('2026-10-19')]);
    expect(s.current).toBe(4);
    expect(s.longest).toBe(4);
  });

  it('marks saved (not played) days in the week', () => {
    const s = computeStreak(dailies('2026-10-18', TODAY), TODAY, [save('2026-10-19')]);
    // Mon 10-19 saved, Tue 10-20 played.
    expect(s.week.slice(0, 2)).toEqual([true, true]);
    expect(s.weekSaved.slice(0, 2)).toEqual([true, false]);
  });

  it('a save alone never counts as having played today', () => {
    expect(computeStreak([], TODAY, [save(TODAY)]).todayDone).toBe(false);
  });
});

describe('computeProgress', () => {
  it('exposes the offer and the saved streak', () => {
    const played = dailies('2026-10-17', '2026-10-18');
    expect(computeProgress(played, TODAY, 10, TODAY).streakSave).toEqual({ day: '2026-10-19', streak: 2 });
    const after = computeProgress(played, TODAY, 10, TODAY, [save('2026-10-19')]);
    expect(after.streakSave).toBeNull();
    expect(after.streak.current).toBe(3);
  });
});
