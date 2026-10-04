/**
 * Words that must never appear by accident in a grid (profanity, slurs,
 * sexual terms). Stored ROT13-encoded so the source isn't a wall of
 * profanity; decoded once at load. Pure TypeScript.
 *
 * Only accidental appearances are blocked: a blocked string that lies wholly
 * inside a real target word (ASS in GRASS) is fine, because it's part of a
 * word the player is meant to find.
 */
import { DIRECTIONS } from './directions';
import { cellKey } from './gridScan';
import type { Cell, WorkingGrid } from './types';

const ENCODED = [
  'NFF', 'PHZ', 'SNT', 'SHX', 'WVM', 'XXX', 'FRK', 'GVG', 'NANY', 'NEFR', 'OBBO', 'PBPX', 'PBBA', 'PENC', 'PHAG',
  'QNZA', 'QVPX', 'QLXR', 'SHPX', 'TBBX', 'UBZB', 'WVMM', 'XVXR', 'ANMV', 'AHQR', 'BETL', 'CNXV', 'CRQB', 'CVFF',
  'CBEA', 'ENCR', 'FUVG', 'FYHG', 'FZHG', 'FCVP', 'GVGF', 'GJNG', 'JNAX', 'OVGPU', 'OBARE', 'PUVAX', 'QVYQB',
  'UBEAL', 'ARTEB', 'AVTTN', 'AHQRF', 'CRAVF', 'CEVPX', 'CHFFL', 'FRZRA', 'FXNAX', 'FCREZ', 'IHYIN', 'JUBER',
  'SNTTBG', 'SHPXRE', 'UVGYRE', 'UBBXRE', 'VAPRFG', 'AVTTRE', 'BETNFZ', 'ERGNEQ', 'FUVGGL', 'GENAAL', 'JNAXRE',
  'JUBERF', 'NFFUBYR', 'ONFGNEQ', 'OVGPURF', 'OBYYBPX', 'SHPXVAT', 'NEFRUBYR', 'FUVGURNQ',
];

const rot13 = (s: string) => s.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + 13) % 26) + 65));

export const BLOCKED_WORDS: readonly string[] = ENCODED.map(rot13);

const BLOCKED = new Set(BLOCKED_WORDS);
const MAX_LENGTH = Math.max(...BLOCKED_WORDS.map((w) => w.length));

/**
 * Every straight-line run (all 8 directions, so backwards too) that spells a
 * blocked word and is not wholly inside one of `allowed` (the cells of each
 * real word). Grids may contain empty (null) cells.
 */
export function findBlockedWords(grid: WorkingGrid | readonly (readonly string[])[], allowed: readonly (readonly Cell[])[] = []): Cell[][] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const allowedSets = allowed.map((cells) => new Set(cells.map(cellKey)));
  const found: Cell[][] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      for (const d of DIRECTIONS) {
        let text = '';
        const cells: Cell[] = [];
        for (let k = 0; k < MAX_LENGTH; k++) {
          const r = row + d.row * k;
          const c = col + d.col * k;
          const letter = r >= 0 && c >= 0 && r < rows && c < cols ? grid[r][c] : null;
          if (!letter) break;
          text += letter;
          cells.push({ row: r, col: c });
          if (text.length >= 3 && BLOCKED.has(text)) {
            const keys = cells.map(cellKey);
            if (!allowedSets.some((set) => keys.every((key) => set.has(key)))) found.push(cells.slice());
          }
        }
      }
    }
  }
  return found;
}
