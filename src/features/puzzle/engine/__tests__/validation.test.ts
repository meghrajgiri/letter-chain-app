import { generatePuzzle } from '../generatePuzzle';
import { validatePuzzle } from '../validatePuzzle';
import type { Puzzle } from '../types';

const clone = (p: Puzzle): Puzzle => JSON.parse(JSON.stringify(p));

describe('validatePuzzle', () => {
  const puzzle = generatePuzzle({ theme: 'animals', difficulty: 'medium', seed: 42 });

  it('passes a generated puzzle', () => {
    const result = validatePuzzle(puzzle);
    expect(result).toEqual({ valid: true, errors: [], warnings: [] });
  });

  it('fails when a word has no placement', () => {
    const broken = clone(puzzle);
    broken.words.push('UNICORN');
    const result = validatePuzzle(broken);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('UNICORN has no placement');
  });

  it('fails when a placement is outside the grid', () => {
    const broken = clone(puzzle);
    broken.placements[0].start = { row: -1, col: 0 };
    expect(validatePuzzle(broken).valid).toBe(false);
  });

  it('fails when end coordinates do not match the word length', () => {
    const broken = clone(puzzle);
    const p = broken.placements[0];
    p.end = { ...p.start };
    expect(validatePuzzle(broken).errors.join()).toMatch(/expected/);
  });

  it('fails when grid letters do not match placements', () => {
    const broken = clone(puzzle);
    const cell = broken.placements[0].cells[0];
    broken.grid[cell.row][cell.col] = broken.grid[cell.row][cell.col] === 'Q' ? 'Z' : 'Q';
    const result = validatePuzzle(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.join()).toMatch(/grid has/);
  });

  it('fails on duplicate words', () => {
    const broken = clone(puzzle);
    broken.words.push(broken.words[0]);
    expect(validatePuzzle(broken).errors).toContain(`Duplicate word ${broken.words[0]}`);
  });

  it('fails on invalid letters', () => {
    const broken = clone(puzzle);
    broken.grid[0][0] = '7';
    expect(validatePuzzle(broken).valid).toBe(false);
  });

  it('fails when a word appears twice', () => {
    const grid = [
      ['C', 'A', 'T'],
      ['X', 'X', 'X'],
      ['C', 'A', 'T'],
    ];
    const result = validatePuzzle({
      gridSize: 3,
      grid,
      words: ['CAT'],
      placements: [{ word: 'CAT', start: { row: 0, col: 0 }, end: { row: 0, col: 2 }, direction: { row: 0, col: 1 }, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }] }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join()).toMatch(/extra time/);
  });

  it('fails on words shorter than the minimum', () => {
    const result = validatePuzzle({
      gridSize: 3,
      grid: [['A', 'B', 'C'], ['D', 'E', 'F'], ['G', 'H', 'I']],
      words: ['AB'],
      placements: [{ word: 'AB', start: { row: 0, col: 0 }, end: { row: 0, col: 1 }, direction: { row: 0, col: 1 }, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] }],
    });
    expect(result.errors.join()).toMatch(/shorter/);
  });
});
