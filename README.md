# Letter Chain

Word search game: a puzzle engine plus an Expo app styled from the Stitch "Wordly / Letter Chain" designs. Everything runs locally: no backend, accounts or analytics.

## Run

```bash
npm install
npm start            # Expo dev server (press i / a / w)
npm test             # engine + selection tests (Jest, Node only)
npm run typecheck
npx expo lint
npm run report       # generate 20 puzzles per difficulty and print a quality summary
npm run report -- 100 grids   # 100 per difficulty, print sample grids
```

Expo SDK 57 (React Native 0.86, Expo Router).

## Architecture

```text
src/app/                      Expo Router routes (thin)
  (tabs)/                     Home · Play · Progress · Profile (floating pill tab bar)
  puzzle.tsx                  Active Puzzle — Classic mode (daily or free play)
  chain.tsx                   Chain mode puzzle
  studio.tsx                  Puzzle Studio (developer tool, linked from Profile)
src/screens/                  Screen components for the routes above
src/components/ui/            Design-system primitives (AppText, Button, Card, Pill, Icon, Toast, …)
src/theme/tokens.ts           Stitch design tokens: colours, Plus Jakarta Sans type scale, shadows
src/features/puzzle/
  components/                 TileGrid, LetterTile, WordList, SelectionChip, CompletionView, studio/*
  hooks/                      usePuzzle, usePuzzleSelection, usePuzzleTimer
  game/                       pure: selection, tile layout, daily puzzle, word history
  engine/                     pure TypeScript puzzle engine (no React / RN / Expo imports)
  data/themes.ts              24 word banks (pure data)
src/features/chain/           Chain mode: engine (pure TS), path-drag logic, hooks, grid + word list
src/features/demo/            DEMO DATA for not-yet-built features (see below)
scripts/puzzleReport.ts       batch quality report (runs the engine under Node via tsx)
```

The engine is usable on its own:

```ts
import { generatePuzzle, validatePuzzle } from './src/features/puzzle/engine';

const puzzle = generatePuzzle({ theme: 'animals', difficulty: 'medium', seed: 12345 });
// Same options + same seed → identical puzzle (string seeds work too: 'daily-2026-10-03').
```

### Tuning knobs

| What | Where |
| --- | --- |
| Grid size, word count and length, direction weights, overlap target, filler bias, decoys | `engine/difficultyConfig.ts` → `DIFFICULTY_CONFIGS` |
| Difficulty band thresholds | `engine/difficultyConfig.ts` → `DIFFICULTY_THRESHOLDS` |
| Difficulty factor weights and normalisation | `engine/calculateDifficulty.ts` → `DIFFICULTY_FACTORS` |
| Quality-check thresholds | `engine/qualityReport.ts` |
| Word banks | `data/themes.ts` |

### Generation pipeline (`engine/generatePuzzle.ts`)

For each attempt (up to 8, each with its own seeded sub-generator):

1. **Select words.** Mix short, mid and long words, cap same-length repeats, reject pairs where one word contains the other (e.g. CAT/CATERPILLAR), and respect a letter budget.
2. **Place words.** Longest first, with jitter. Enumerate every legal start and direction, then score each on direction balance, steering toward an overlap target, spreading into empty regions, and penalties for parallel "slabs" and edge-hugging. Sample from the top 6. Words that can't be placed are swapped for reserves.
3. **Fill the grid.** Plant decoy prefixes, fill with English-frequency letters blended with the puzzle's own letters, and re-roll filler that accidentally spells a second copy of a word.
4. **Validate, measure, score.** Run the difficulty score and quality checks, keep the best attempt, and stop early on a clean one.

### Avoiding repeated words between games

`generatePuzzle({ ..., avoidWords })` takes recently used words (most recent first). It picks fresh words first and reuses the least recently used ones only when the bank runs short. The avoid list is part of the puzzle's identity: the id gets an `-a<hash>` suffix. Leave it out for puzzles that must be the same for everyone, such as dailies.

The play screen keeps a per-theme history of the last 8 puzzles (`game/wordHistory.ts`). It's **in memory only**, so it resets when the app restarts. `npm run report` ends with a consecutive-play simulation, and the Studio batch has an "Avoid recent words" toggle to compare with history on and off.

Note: editing a theme's word list changes which puzzle a given seed produces for that theme.

## Chain mode

A second game mode: every letter in the grid belongs to exactly one hidden word, and words wind through up/down/left/right neighbours. Only each word's letter count is shown until it's found, and finding every word fills the whole grid.

- **Generator** (`chain/engine/generateChainPuzzle.ts`): picks theme words whose lengths sum exactly to rows × cols (6×6 Easy, 7×7 Medium, 8×8 Hard), then splits the grid into winding paths of those lengths (randomised backtracking that prefers snake-like shapes and prunes regions that can't be filled), and writes each word along a path.
- **Single solution:** `solveChain` counts every way to tile the grid with the word list (an exact-cover search). A puzzle is only accepted with exactly one solution.
- **Play:** drag a path through neighbouring tiles; dragging back undoes. A word traced along the wrong route is reported as "right word, not that path". Three hints per puzzle each reveal a word and ring its first letter.
- `npm run report` ends with Chain stats, and the Studio has a Chain panel (inspect with solution, batch 50).

## Real vs placeholder UI

The screens follow the full Stitch design, but some features don't exist yet:

- **Real:** the puzzle and everything in it (timer, pause, selection, found words, completion time and word count), today's **daily puzzle** (same for everyone, seeded by date: `game/daily.ts`), the countdown to the next daily, free play, and the Studio.
- **Placeholder:** streaks, XP, level, score, best score, achievements, statistics, the weekly chart and "personal best". All of these values live in `src/features/demo/demoProgress.ts`; search for `demoProgress` to find every use. Buttons for unbuilt features (Classic-mode hints, reveal, shuffle, share, account, settings) show a "coming soon" toast. Chain-mode hints are real.

## Development note

In this setup, Metro's file watcher sometimes misses edits (the project path contains a space). If changes don't appear, restart with `npx expo start --clear`.
