import { buildShareText } from '../share';

describe('buildShareText', () => {
  const result = { mode: 'classic' as const, difficulty: 'medium', isDaily: true, dailyDate: '2026-10-05', wordCount: 8, durationMs: 102_000, hintsUsed: 0 };

  it('describes a daily without spoilers', () => {
    const text = buildShareText({ result, themeName: 'Animals', themeIcon: '🦁', score: 179, streakDays: 3, isPersonalBest: true });
    expect(text).toBe(
      ['Letter Chain · Daily Oct 5', '🦁 Animals · Medium', '⏱ 1:42 (personal best!) · 8 words · no hints', '⭐ 179 pts · 🔥 3-day streak', '🟩🟩🟩🟩🟩🟩🟩🟩'].join('\n'),
    );
  });

  it('appends the download link when given', () => {
    const url = 'https://play.google.com/store/apps/details?id=com.letterchain.app';
    const text = buildShareText({ result, themeName: 'Animals', score: 179, streakDays: 0, isPersonalBest: false, url });
    expect(text.split('\n').slice(-2)).toEqual(['', `Play Letter Chain: ${url}`]);
  });

  it('handles free play, hints and no streak', () => {
    const text = buildShareText({
      result: { ...result, mode: 'chain', isDaily: false, dailyDate: null, hintsUsed: 1 },
      themeName: 'Food',
      score: 90,
      streakDays: 0,
      isPersonalBest: false,
    });
    expect(text.split('\n')[0]).toBe('Letter Chain · Chain');
    expect(text).toContain('1 hint');
    expect(text).not.toContain('streak');
    expect(text).toContain('🟨');
  });
});
