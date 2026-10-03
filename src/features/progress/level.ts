/** Total XP needed to reach `level` (level 1 = 0 XP). L2 = 100, L3 = 300, L4 = 600 … */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

export type LevelInfo = {
  level: number;
  xp: number;
  /** XP at the start of the current level. */
  levelStartXp: number;
  /** XP needed for the next level. */
  nextLevelXp: number;
  /** 0–1 progress through the current level. */
  progress: number;
};

export function levelForXp(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  return { level, xp, levelStartXp, nextLevelXp, progress: (xp - levelStartXp) / (nextLevelXp - levelStartXp) };
}
