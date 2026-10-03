/**
 * Deterministic seeded randomness. Every random decision in the engine goes
 * through an `Rng` so that the same seed always reproduces the same puzzle.
 */

export type Rng = {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] (inclusive). */
  int(min: number, max: number): number;
  /** Float in [min, max). */
  float(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** Returns a shuffled copy. */
  shuffle<T>(items: readonly T[]): T[];
  /** Picks an index with probability proportional to its weight. */
  weightedIndex(weights: readonly number[]): number;
  /** Derives an independent child generator (stable for a given label). */
  fork(label: string): Rng;
};

/** 32-bit FNV-1a hash. Used to turn strings into seeds. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Normalises a number or string seed to an unsigned 32-bit integer. */
export function normalizeSeed(seed: number | string): number {
  if (typeof seed === 'string') {
    const trimmed = seed.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed) >>> 0;
    return hashString(trimmed);
  }
  if (!Number.isFinite(seed)) return 0;
  return Math.floor(Math.abs(seed)) >>> 0;
}

/** Non-deterministic seed for "random" puzzles. The only place Math.random is used. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/** Mulberry32: tiny, fast, good-enough PRNG for games. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number | string): Rng {
  const base = normalizeSeed(seed);
  const next = mulberry32(base);

  const rng: Rng = {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    float(min, max) {
      return min + next() * (max - min);
    },
    chance(probability) {
      return next() < probability;
    },
    pick(items) {
      if (items.length === 0) throw new Error('Cannot pick from an empty list');
      return items[Math.floor(next() * items.length)];
    },
    shuffle(items) {
      const copy = items.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    weightedIndex(weights) {
      let total = 0;
      for (const w of weights) total += Math.max(0, w);
      if (total <= 0) return Math.floor(next() * weights.length);
      let roll = next() * total;
      for (let i = 0; i < weights.length; i++) {
        roll -= Math.max(0, weights[i]);
        if (roll < 0) return i;
      }
      return weights.length - 1;
    },
    fork(label) {
      return createRng((base ^ hashString(label)) >>> 0);
    },
  };
  return rng;
}
