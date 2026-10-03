/**
 * Generates a batch of puzzles across themes and difficulties and prints a
 * quality summary plus a few sample grids. Pure engine, no React Native.
 *
 *   npm run report               # 20 per difficulty
 *   npm run report -- 50 grids   # 50 per difficulty, print sample grids
 */
import { THEMES } from '../src/features/puzzle/data/themes';
import { createWordHistory } from '../src/features/puzzle/game/wordHistory';
import { CHAIN_DIFFICULTIES, generateChainPuzzle, validateChainPuzzle } from '../src/features/chain/engine';
import { pathShape } from '../src/features/chain/engine/grid';
import {
  DIFFICULTIES,
  DIRECTION_ARROWS,
  generateBatch,
  generatePuzzle,
  getDirectionName,
  summarizeBatch,
  type GeneratePuzzleOptions,
  type Puzzle,
} from '../src/features/puzzle/engine';

const perDifficulty = Number(process.argv[2] ?? 20);
const showGrids = process.argv.includes('grids');
const pct = (v: number) => `${Math.round(v * 100)}%`;

function printGrid(p: Puzzle) {
  const used = new Set(p.placements.flatMap((pl) => pl.cells.map((c) => `${c.row},${c.col}`)));
  console.log(`\n${p.id}  score=${p.difficultyScore} rated=${p.difficultyBreakdown.rated} attempts=${p.generationAttempts}`);
  p.grid.forEach((row, r) =>
    console.log('  ' + row.map((l, c) => (used.has(`${r},${c}`) ? l : l.toLowerCase())).join(' ')),
  );
  console.log('  ' + p.placements.map((pl) => `${pl.word}${DIRECTION_ARROWS[getDirectionName(pl.direction)]}`).join(' '));
  const issues = p.quality.checks.filter((c) => c.status !== 'pass');
  if (issues.length) console.log('  issues: ' + issues.map((c) => `${c.status}:${c.label} (${c.detail})`).join('; '));
}

const all: ReturnType<typeof generateBatch> = [];
for (const difficulty of DIFFICULTIES) {
  const specs: GeneratePuzzleOptions[] = Array.from({ length: perDifficulty }, (_, i) => ({
    theme: THEMES[i % THEMES.length].id,
    difficulty,
    seed: 1000 + i,
  }));
  const items = generateBatch(specs);
  all.push(...items);
  const s = summarizeBatch(items);
  console.log(`\n=== ${difficulty.toUpperCase()} (${s.generated}) ===`);
  console.log(`valid ${s.valid}/${s.generated}  clean ${s.cleanPuzzles}  match ${pct(s.difficultyMatchRate)}  avgAttempts ${s.averageAttempts.toFixed(1)}  avgMs ${s.averageDurationMs.toFixed(1)}`);
  console.log(`score avg ${s.averageScore.toFixed(1)} [${s.minScore}–${s.maxScore}]  rated ${JSON.stringify(s.ratedDifficulty)}`);
  console.log(`words ${s.averageWordCount.toFixed(1)}  overlap ${pct(s.averageOverlap)}  density ${pct(s.averageDensity)}`);
  console.log(`dirs H ${pct(s.directionShare.horizontal)} V ${pct(s.directionShare.vertical)} D ${pct(s.directionShare.diagonal)} R ${pct(s.directionShare.reverse)}`);
  console.log(`layoutSim ${s.layoutSimilarity.toFixed(3)} (random baseline ${s.layoutSimilarityBaseline.toFixed(3)})  wordSetSim ${s.wordSetSimilarity.toFixed(3)}`);
  console.log(`issues ${JSON.stringify(s.qualityIssues)}`);
  const factorAvg: Record<string, number> = {};
  for (const it of items) if (it.puzzle) for (const [k, v] of Object.entries(it.puzzle.difficultyBreakdown.factors)) factorAvg[k] = (factorAvg[k] ?? 0) + v / items.length;
  console.log('factors ' + Object.entries(factorAvg).map(([k, v]) => `${k}=${v.toFixed(1)}`).join(' '));
  const m = (f: (p: Puzzle) => number) => (items.reduce((a, it) => a + (it.puzzle ? f(it.puzzle) : 0), 0) / items.length).toFixed(2);
  console.log(`fillerSim ${m((p) => p.metrics.fillerSimilarity)}  falseStarts/word ${m((p) => p.metrics.falseStartsPerWord)}  emptySq ${m((p) => p.metrics.largestEmptySquare)}  evenness ${m((p) => p.metrics.distributionEvenness)}`);
  if (showGrids) items.slice(0, 3).forEach((it) => it.puzzle && printGrid(it.puzzle));
  for (const it of items) if (it.error) console.log('ERROR', it.options, it.error);
}
const total = summarizeBatch(all);
console.log(`\nTOTAL generated ${total.generated} valid ${total.valid} failed ${total.failed} clean ${total.cleanPuzzles}`);

// Consecutive play: what a player sees tapping "New Puzzle" 10 times per theme.
console.log('\n=== CONSECUTIVE PLAY (10 games per theme) ===');
for (const difficulty of DIFFICULTIES) {
  const row: string[] = [];
  for (const useHistory of [false, true]) {
    let shared = 0;
    let pairs = 0;
    let max = 0;
    for (const theme of THEMES) {
      const history = createWordHistory();
      let previous: string[] = [];
      for (let game = 0; game < 10; game++) {
        const p = generatePuzzle({ theme: theme.id, difficulty, seed: 777 + game * 31, avoidWords: useHistory ? history.recentWords(theme.id) : undefined });
        history.record(theme.id, p.id, p.words);
        if (game > 0) {
          const n = p.words.filter((w) => previous.includes(w)).length;
          shared += n;
          max = Math.max(max, n);
          pairs++;
        }
        previous = p.words;
      }
    }
    row.push(`${useHistory ? 'with history' : 'no history'}: ${(shared / pairs).toFixed(2)} avg, max ${max}`);
  }
  console.log(`${difficulty.padEnd(7)} words shared with previous game — ${row.join('  |  ')}`);
}

// Chain mode: validity, uniqueness, speed and path shapes.
console.log('\n=== CHAIN MODE ===');
for (const difficulty of CHAIN_DIFFICULTIES) {
  let valid = 0;
  let failed = 0;
  let ms = 0;
  let attempts = 0;
  const shapes = { straight: 0, zigzag: 0, snake: 0 };
  let words = 0;
  for (let i = 0; i < perDifficulty; i++) {
    const t0 = Date.now();
    try {
      const p = generateChainPuzzle({ theme: THEMES[i % THEMES.length].id, difficulty, seed: 1000 + i });
      if (validateChainPuzzle(p).valid) valid++;
      attempts += p.generationAttempts;
      for (const pl of p.placements) {
        shapes[pathShape(pl.cells)]++;
        words++;
      }
    } catch {
      failed++;
    }
    ms += Date.now() - t0;
  }
  console.log(
    `${difficulty.padEnd(7)} valid+unique ${valid}/${perDifficulty} failed ${failed}  avgMs ${(ms / perDifficulty).toFixed(1)}  attempts ${(attempts / perDifficulty).toFixed(1)}  shapes snake ${pct(shapes.snake / words)} zigzag ${pct(shapes.zigzag / words)} straight ${pct(shapes.straight / words)}`,
  );
}
