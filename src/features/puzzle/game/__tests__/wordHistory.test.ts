import { createWordHistory } from '../wordHistory';

describe('wordHistory', () => {
  it('returns recent words per theme, most recent first, without duplicates', () => {
    const history = createWordHistory();
    history.record('animals', 'p1', ['LION', 'TIGER']);
    history.record('animals', 'p2', ['ZEBRA', 'LION']);
    history.record('food', 'p3', ['PIZZA']);
    expect(history.recentWords('animals')).toEqual(['ZEBRA', 'LION', 'TIGER']);
    expect(history.recentWords('food')).toEqual(['PIZZA']);
    expect(history.recentWords('space')).toEqual([]);
  });

  it('ignores recording the same puzzle twice', () => {
    const history = createWordHistory();
    history.record('animals', 'p1', ['LION']);
    history.record('animals', 'p2', ['TIGER']);
    history.record('animals', 'p1', ['LION']);
    expect(history.recentWords('animals')).toEqual(['TIGER', 'LION']);
  });

  it('forgets puzzles beyond its size', () => {
    const history = createWordHistory(2);
    history.record('animals', 'p1', ['LION']);
    history.record('animals', 'p2', ['TIGER']);
    history.record('animals', 'p3', ['ZEBRA']);
    expect(history.recentWords('animals')).toEqual(['ZEBRA', 'TIGER']);
  });
});
