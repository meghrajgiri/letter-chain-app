import { useCallback, useMemo, useState } from 'react';

import type { Cell } from '../../puzzle/engine/types';
import { generateChainPuzzle } from '../engine/generateChainPuzzle';
import type { ChainDifficulty, ChainPuzzle } from '../engine/types';
import { matchChainPath, type ChainMatch } from '../game/pathSelection';

/** Hints per puzzle. Each reveals one hidden word and marks its first letter. */
export const CHAIN_HINTS = 3;

export type FoundChainWord = { word: string; cells: Cell[]; colorIndex: number };

type Options = {
  theme: string;
  difficulty: ChainDifficulty;
  seed: number;
  avoidWords?: readonly string[];
  /** A ready-made puzzle (the daily); skips generation. */
  preset?: ChainPuzzle;
};

/** Game state for one Chain puzzle: generation, found words, hints, completion. */
export function useChainPuzzle({ theme, difficulty, seed, avoidWords, preset }: Options) {
  const puzzle: ChainPuzzle = useMemo(
    () => preset ?? generateChainPuzzle({ theme, difficulty, seed, avoidWords }),
    [preset, theme, difficulty, seed, avoidWords],
  );
  const [found, setFound] = useState<FoundChainWord[]>([]);
  const [hinted, setHinted] = useState<string[]>([]);
  const [puzzleId, setPuzzleId] = useState(puzzle.id);

  if (puzzleId !== puzzle.id) {
    setPuzzleId(puzzle.id);
    setFound([]);
    setHinted([]);
  }

  const foundWords = useMemo(() => new Set(found.map((f) => f.word)), [found]);

  const submitPath = useCallback(
    (path: readonly Cell[]): ChainMatch => {
      const result = matchChainPath(path, puzzle.grid, puzzle.placements, foundWords);
      if (result.type === 'found') {
        const placement = puzzle.placements.find((p) => p.word === result.word)!;
        setFound((prev) => [...prev, { word: result.word, cells: placement.cells, colorIndex: prev.length }]);
      }
      return result;
    },
    [puzzle, foundWords],
  );

  /** Reveals the next unfound, unhinted word (shortest first). Returns it, or null if none left. */
  const revealHint = useCallback((): string | null => {
    if (hinted.length >= CHAIN_HINTS) return null;
    const next = puzzle.placements.find((p) => !foundWords.has(p.word) && !hinted.includes(p.word));
    if (!next) return null;
    setHinted((prev) => [...prev, next.word]);
    return next.word;
  }, [puzzle, foundWords, hinted]);

  /** First cell of each hinted word that isn't found yet (shown with a ring). */
  const hintCells = useMemo(
    () => puzzle.placements.filter((p) => hinted.includes(p.word) && !foundWords.has(p.word)).map((p) => p.cells[0]),
    [puzzle, hinted, foundWords],
  );

  return {
    puzzle,
    found,
    foundWords,
    hinted,
    hintCells,
    hintsLeft: CHAIN_HINTS - hinted.length,
    submitPath,
    revealHint,
    isComplete: found.length === puzzle.words.length,
  };
}
