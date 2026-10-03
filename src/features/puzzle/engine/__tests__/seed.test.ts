import { generatePuzzle } from '../generatePuzzle';
import { createRng, normalizeSeed } from '../random';

describe('seeded randomness', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    expect(createRng(1).next()).not.toEqual(createRng(2).next());
  });

  it('normalises string seeds', () => {
    expect(normalizeSeed('12345')).toBe(12345);
    expect(normalizeSeed('daily-2026-10-03')).toBe(normalizeSeed('daily-2026-10-03'));
  });

  it('int stays in range', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(3, 6);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
    }
  });
});

describe('seeded generation', () => {
  it('generates an identical puzzle for animals/medium/12345', () => {
    const a = generatePuzzle({ theme: 'animals', difficulty: 'medium', seed: 12345 });
    const b = generatePuzzle({ theme: 'animals', difficulty: 'medium', seed: 12345 });
    expect(a).toEqual(b);
    expect(a.id).toBe('animals-medium-8x8-auto-12345');
  });

  it('is stable across runs (snapshot)', () => {
    const p = generatePuzzle({ theme: 'animals', difficulty: 'medium', seed: 12345 });
    expect({ words: p.words, grid: p.grid.map((r) => r.join('')) }).toMatchSnapshot();
  });

  it('generates different puzzles for different seeds', () => {
    const a = generatePuzzle({ theme: 'animals', difficulty: 'medium', seed: 1 });
    const b = generatePuzzle({ theme: 'animals', difficulty: 'medium', seed: 2 });
    expect(a.grid).not.toEqual(b.grid);
  });

  it('accepts string seeds', () => {
    const a = generatePuzzle({ theme: 'space', difficulty: 'hard', seed: 'daily-2026-10-03' });
    const b = generatePuzzle({ theme: 'space', difficulty: 'hard', seed: 'daily-2026-10-03' });
    expect(a.grid).toEqual(b.grid);
  });
});
