import { latestOpenHint, pickHintWord, pickRevealWord } from '../hints';

const words = ['BEAR', 'LION', 'WOLF'];

describe('Classic hints', () => {
  it('hints the first unfound, unhinted word', () => {
    expect(pickHintWord(words, new Set(), [])).toBe('BEAR');
    expect(pickHintWord(words, new Set(['BEAR']), [])).toBe('LION');
    expect(pickHintWord(words, new Set(), ['BEAR'])).toBe('LION');
    expect(pickHintWord(words, new Set(['BEAR', 'LION', 'WOLF']), [])).toBeNull();
  });

  it('reveals a hinted word first, otherwise the first unfound', () => {
    expect(pickRevealWord(words, new Set(), ['WOLF'])).toBe('WOLF');
    expect(pickRevealWord(words, new Set(['WOLF']), ['WOLF'])).toBe('BEAR');
    expect(pickRevealWord(words, new Set(words), [])).toBeNull();
  });
});

describe('latestOpenHint', () => {
  it('returns the most recent hint that is still unfound', () => {
    expect(latestOpenHint(['BEAR', 'LION'], new Set())).toBe('LION');
    expect(latestOpenHint(['BEAR', 'LION'], new Set(['LION']))).toBe('BEAR');
    expect(latestOpenHint(['BEAR'], new Set(['BEAR']))).toBeNull();
    expect(latestOpenHint([], new Set())).toBeNull();
  });
});
