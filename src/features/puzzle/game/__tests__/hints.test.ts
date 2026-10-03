import { pickHintWord, pickRevealWord } from '../hints';

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
