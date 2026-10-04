import { useCallback, useMemo, useState } from 'react';

import { generatePuzzle } from '../engine/generatePuzzle';
import type { Cell, Difficulty, Puzzle } from '../engine/types';
import { CLASSIC_HINTS, pickHintWord, pickRevealWord, REVEAL_COST } from '../game/hints';
import { matchSelection } from '../game/selection';

export type FoundWord = {
  word: string;
  start: Cell;
  end: Cell;
  colorIndex: number;
  /** Found by the Reveal button rather than by the player. */
  revealed?: boolean;
};

export type SubmitResult = { type: 'found'; word: string } | { type: 'already-found'; word: string } | { type: 'miss' };

type Options = {
  theme: string;
  difficulty: Difficulty;
  seed: number;
  gridSize?: number;
  wordCount?: number;
  /** Recent words to keep out of this puzzle. Pass a stable array (it's a memo dependency). */
  avoidWords?: readonly string[];
  /** A ready-made puzzle (the daily); skips generation. */
  preset?: Puzzle;
};

/** Game state for one puzzle: generation, found words and completion. */
export function usePuzzle({ theme, difficulty, seed, gridSize, wordCount, avoidWords, preset }: Options) {
  const puzzle: Puzzle = useMemo(
    () => preset ?? generatePuzzle({ theme, difficulty, seed, gridSize, wordCount, avoidWords }),
    [preset, theme, difficulty, seed, gridSize, wordCount, avoidWords],
  );
  const [found, setFound] = useState<FoundWord[]>([]);
  const [hinted, setHinted] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  /** Extra hints earned by watching rewarded ads. */
  const [adHints, setAdHints] = useState(0);
  const [puzzleId, setPuzzleId] = useState(puzzle.id);

  // Reset progress when the puzzle changes (state-during-render pattern).
  if (puzzleId !== puzzle.id) {
    setPuzzleId(puzzle.id);
    setFound([]);
    setHinted([]);
    setHintsUsed(0);
    setAdHints(0);
  }

  const foundWords = useMemo(() => new Set(found.map((f) => f.word)), [found]);

  const submitSelection = useCallback(
    (start: Cell, end: Cell): SubmitResult => {
      const match = matchSelection(puzzle.grid, start, end, puzzle.words, foundWords);
      if (match) {
        // Store in the word's reading direction regardless of drag direction.
        const [s, e] = match.reversed ? [end, start] : [start, end];
        setFound((prev) => [...prev, { word: match.word, start: s, end: e, colorIndex: prev.length }]);
        return { type: 'found', word: match.word };
      }
      const again = matchSelection(puzzle.grid, start, end, puzzle.words, new Set());
      return again ? { type: 'already-found', word: again.word } : { type: 'miss' };
    },
    [puzzle, foundWords],
  );

  const hintsLeft = CLASSIC_HINTS + adHints - hintsUsed;

  /** One more hint, earned by watching a rewarded ad. */
  const addAdHint = useCallback(() => setAdHints((n) => n + 1), []);

  /** Rings the first letter of an unfound word. Returns the word, or null if no hint is available. */
  const revealHint = useCallback((): string | null => {
    if (hintsLeft < 1) return null;
    const word = pickHintWord(puzzle.words, foundWords, hinted);
    if (!word) return null;
    setHinted((prev) => [...prev, word]);
    setHintsUsed((n) => n + 1);
    return word;
  }, [hintsLeft, puzzle.words, foundWords, hinted]);

  /**
   * Finds a whole word for the player (costs REVEAL_COST hints).
   * Returns the word and the hint total after this reveal, or null.
   */
  const revealWord = useCallback((): { word: string; hintsUsed: number } | null => {
    if (hintsLeft < REVEAL_COST) return null;
    const word = pickRevealWord(puzzle.words, foundWords, hinted);
    if (!word) return null;
    const placement = puzzle.placements.find((p) => p.word === word)!;
    setFound((prev) => [...prev, { word, start: placement.start, end: placement.end, colorIndex: prev.length, revealed: true }]);
    setHintsUsed((n) => n + REVEAL_COST);
    return { word, hintsUsed: hintsUsed + REVEAL_COST };
  }, [hintsLeft, hintsUsed, puzzle, foundWords, hinted]);

  /** First cell of each hinted word not found yet (shown with a ring). */
  const hintCells = useMemo(
    () => puzzle.placements.filter((p) => hinted.includes(p.word) && !foundWords.has(p.word)).map((p) => p.start),
    [puzzle, hinted, foundWords],
  );

  const restart = useCallback(() => setFound([]), []);

  return {
    puzzle,
    found,
    foundWords,
    hinted,
    hintCells,
    hintsUsed,
    hintsLeft,
    adHints,
    addAdHint,
    submitSelection,
    revealHint,
    revealWord,
    restart,
    isComplete: found.length === puzzle.words.length,
  };
}
