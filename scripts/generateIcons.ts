/**
 * Renders the Letter Chain logo into every app icon / splash asset Expo needs.
 * Geometry matches the Stitch logo SVG (96-unit grid).
 *
 *   npx tsx scripts/generateIcons.ts <path-to-playwright-module>
 *
 * Requires Playwright (Chromium). Not a project dependency; pass its path.
 */
import { createRequire } from 'module';
import { copyFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] ?? 'playwright');

const ROOT = resolve(import.meta.dirname, '..');
const ASSETS = join(ROOT, 'assets');
const FONT = join(ROOT, 'node_modules/@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf');

const VIOLET = '#6C5CE7';
const TILES = [
  { x: 18, y: 18, fill: '#FFFFFF', ink: VIOLET, letter: 'L' },
  { x: 50, y: 18, fill: '#FFCA3A', ink: '#20202A', letter: 'C' },
  { x: 18, y: 50, fill: '#35B779', ink: '#FFFFFF', letter: 'H' },
  { x: 50, y: 50, fill: '#EAE7FF', ink: VIOLET, letter: 'N' },
];
const LINKS = [
  { d: 'M42 32 L54 32', stroke: VIOLET },
  { d: 'M64 42 L64 54', stroke: '#FFCA3A' },
  { d: 'M54 64 L42 64', stroke: '#35B779' },
];

type Variant = {
  file: string;
  size: number;
  /** Background behind the tiles: 'rounded' logo square, 'full' bleed square, or none (transparent). */
  background: 'rounded' | 'full' | 'none';
  /** Scale of the 96-unit logo inside the canvas (1 = edge to edge). */
  scale: number;
  /** Single-colour silhouette with letters cut out (Android themed icons). */
  monochrome?: boolean;
};

const VARIANTS: Variant[] = [
  // iOS / default icon: opaque, square, no rounded corners (the OS masks it).
  { file: 'icon.png', size: 1024, background: 'full', scale: 1 },
  // Splash: transparent, the rounded logo; shown at imageWidth on the splash colour.
  { file: 'splash-icon.png', size: 1024, background: 'rounded', scale: 1 },
  // Android adaptive icon: solid background layer + tiles inside the 66% safe zone.
  { file: 'android-icon-background.png', size: 512, background: 'full', scale: 0 },
  { file: 'android-icon-foreground.png', size: 512, background: 'none', scale: 0.74 },
  { file: 'android-icon-monochrome.png', size: 432, background: 'none', scale: 0.74, monochrome: true },
  // Android notification small icon: white silhouette on transparent.
  { file: 'notification-icon.png', size: 96, background: 'none', scale: 1.3, monochrome: true },
  // Web favicon.
  { file: 'favicon.png', size: 48, background: 'rounded', scale: 1 },
];

function svgFor(v: Variant): string {
  const tiles = v.scale === 0 ? '' : TILES.map((t) => {
    if (v.monochrome) {
      return `<rect x="${t.x}" y="${t.y}" width="28" height="28" rx="8" fill="#fff" mask="url(#cut-${t.letter})"/>`;
    }
    return `<rect x="${t.x}" y="${t.y}" width="28" height="28" rx="8" fill="${t.fill}"/>
      <text x="${t.x + 14}" y="${t.y + 15}" font-family="PJS" font-size="18" fill="${t.ink}" text-anchor="middle" dominant-baseline="central">${t.letter}</text>`;
  }).join('');
  const links = v.scale === 0 || v.monochrome ? '' : LINKS.map((l) => `<path d="${l.d}" stroke="${l.stroke}" stroke-width="3" stroke-linecap="round"/>`).join('');
  const masks = v.monochrome
    ? TILES.map((t) => `<mask id="cut-${t.letter}"><rect width="96" height="96" fill="#fff"/><text x="${t.x + 14}" y="${t.y + 15}" font-family="PJS" font-size="18" fill="#000" text-anchor="middle" dominant-baseline="central">${t.letter}</text></mask>`).join('')
    : '';
  const bg = v.background === 'full' ? `<rect width="96" height="96" fill="${VIOLET}"/>` : v.background === 'rounded' ? `<rect width="96" height="96" rx="24" fill="${VIOLET}"/>` : '';
  const s = v.scale || 1;
  const offset = (96 - 96 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="${v.size}" height="${v.size}">
    <defs>${masks}</defs>${bg}<g transform="translate(${offset} ${offset}) scale(${s})">${links}${tiles}</g></svg>`;
}

(async () => {
  const work = join(tmpdir(), 'letter-chain-icons');
  mkdirSync(work, { recursive: true });
  copyFileSync(FONT, join(work, 'pjs.ttf'));
  const browser = await chromium.launch();
  for (const v of VARIANTS) {
    const html = `<!doctype html><html><head><style>
      @font-face { font-family: PJS; src: url(pjs.ttf); }
      html, body { margin: 0; background: transparent; }
      svg { display: block; }
    </style></head><body>${svgFor(v)}</body></html>`;
    const file = join(work, `${v.file}.html`);
    writeFileSync(file, html);
    const page = await browser.newPage({ viewport: { width: v.size, height: v.size }, deviceScaleFactor: 1 });
    await page.goto(`file://${file}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(ASSETS, v.file), omitBackground: v.background !== 'full' });
    await page.close();
    console.log(`wrote assets/${v.file} (${v.size}×${v.size})`);
  }
  await browser.close();
})();
