import { MIN_WORD_LENGTH } from './difficultyConfig';
import { isInsideGrid, isValidDirection } from './directions';
import { cellSetKey, findWordOccurrences } from './gridScan';
import { wordsConflict } from './selectWords';
import type { Grid, ValidationResult, WordPlacement } from './types';

export type ValidatablePuzzle = {
  gridSize: number;
  grid: Grid;
  words: string[];
  placements: WordPlacement[];
};

/**
 * Structural and solvability checks. `errors` make a puzzle unusable;
 * `warnings` flag things a human should look at.
 */
export function validatePuzzle(puzzle: ValidatablePuzzle): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { gridSize, grid, words, placements } = puzzle;

  // Grid shape and letters.
  if (!Number.isInteger(gridSize) || gridSize <= 0) errors.push(`Invalid grid size ${gridSize}`);
  if (grid.length !== gridSize) errors.push(`Grid has ${grid.length} rows, expected ${gridSize}`);
  grid.forEach((row, r) => {
    if (row.length !== gridSize) errors.push(`Row ${r} has ${row.length} cells, expected ${gridSize}`);
    row.forEach((letter, c) => {
      if (typeof letter !== 'string' || !/^[A-Z]$/.test(letter)) {
        errors.push(`Invalid letter "${String(letter)}" at (${r},${c})`);
      }
    });
  });
  if (errors.length > 0) return { valid: false, errors, warnings };

  // Words.
  const seen = new Set<string>();
  for (const word of words) {
    if (seen.has(word)) errors.push(`Duplicate word ${word}`);
    seen.add(word);
    if (!/^[A-Z]+$/.test(word)) errors.push(`Word ${word} contains non A–Z characters`);
    if (word.length < MIN_WORD_LENGTH) errors.push(`Word ${word} is shorter than ${MIN_WORD_LENGTH} letters`);
    if (word.length > gridSize) errors.push(`Word ${word} is longer than the grid`);
  }
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      if (wordsConflict(words[i], words[j])) warnings.push(`${words[i]} and ${words[j]} contain each other`);
    }
  }

  // Placements.
  const placedWords = new Set<string>();
  for (const p of placements) {
    const label = `Placement of ${p.word}`;
    if (!seen.has(p.word)) errors.push(`${label} does not match any target word`);
    if (placedWords.has(p.word)) errors.push(`${p.word} is placed more than once`);
    placedWords.add(p.word);

    if (!isValidDirection(p.direction)) {
      errors.push(`${label} has invalid direction (${p.direction.row},${p.direction.col})`);
      continue;
    }
    if (!isInsideGrid(p.start, gridSize) || !isInsideGrid(p.end, gridSize)) {
      errors.push(`${label} is outside the grid`);
      continue;
    }
    const expectedEnd = {
      row: p.start.row + p.direction.row * (p.word.length - 1),
      col: p.start.col + p.direction.col * (p.word.length - 1),
    };
    if (expectedEnd.row !== p.end.row || expectedEnd.col !== p.end.col) {
      errors.push(`${label} ends at (${p.end.row},${p.end.col}), expected (${expectedEnd.row},${expectedEnd.col})`);
      continue;
    }
    if (p.cells.length !== p.word.length) {
      errors.push(`${label} has ${p.cells.length} cells for ${p.word.length} letters`);
      continue;
    }
    let mismatch = false;
    p.cells.forEach((cell, i) => {
      const expected = { row: p.start.row + p.direction.row * i, col: p.start.col + p.direction.col * i };
      if (cell.row !== expected.row || cell.col !== expected.col) mismatch = true;
      else if (grid[cell.row][cell.col] !== p.word[i]) {
        errors.push(`${label}: grid has "${grid[cell.row][cell.col]}" at (${cell.row},${cell.col}), expected "${p.word[i]}"`);
      }
    });
    if (mismatch) errors.push(`${label} has cell coordinates that do not follow its direction`);
  }
  for (const word of words) {
    if (!placedWords.has(word)) errors.push(`${word} has no placement`);
  }

  // Solvability: each word must be findable, and exactly once (ambiguity confuses players).
  if (errors.length === 0) {
    for (const p of placements) {
      const occurrences = findWordOccurrences(grid, p.word);
      if (occurrences.length === 0) errors.push(`${p.word} cannot be found in the grid`);
      else if (occurrences.length > 1) {
        const intended = cellSetKey(p.cells);
        const extra = occurrences.filter((o) => cellSetKey(o) !== intended).length;
        errors.push(`${p.word} appears ${extra} extra time(s) in the grid`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
