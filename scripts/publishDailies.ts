/**
 * Publishes upcoming daily puzzles to Supabase's `daily_puzzles` table so
 * every app version plays the identical daily. Days that are already
 * published are never changed (`on conflict do nothing`).
 *
 *   npm run dailies                    # the next 60 UTC days, starting today
 *   npm run dailies -- 90              # the next 90 days
 *   npm run dailies -- 30 2026-11-01   # 30 days from a given date
 *   npm run dailies -- 7 --dry-run     # print the SQL instead of running it
 *
 * Uses the Supabase CLI's linked project (`supabase link`); no keys needed.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { dailyKey, getDailyPuzzle } from '../src/features/daily/daily';

const args = process.argv.slice(2).filter((a) => a !== '--dry-run');
const dryRun = process.argv.includes('--dry-run');
const days = Number(args[0] ?? 60);
const from = args[1] ?? dailyKey();
if (!Number.isInteger(days) || days < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
  console.error('Usage: npm run dailies -- [days] [YYYY-MM-DD] [--dry-run]');
  process.exit(1);
}

const sqlText = (s: string) => `'${s.replace(/'/g, "''")}'`;
const start = Date.parse(`${from}T00:00:00Z`);

const rows = Array.from({ length: days }, (_, i) => {
  const daily = getDailyPuzzle(dailyKey(new Date(start + i * 86_400_000)));
  const words = `array[${daily.words.map(sqlText).join(', ')}]`;
  // Dollar-quoting keeps the JSON verbatim.
  return `(${sqlText(daily.date)}, ${sqlText(daily.mode)}, ${sqlText(daily.theme)}, ${sqlText(daily.themeName)}, ${words}, $json$${JSON.stringify(daily.puzzle)}$json$::jsonb)`;
});

const sql = `insert into public.daily_puzzles (date, mode, theme, theme_name, words, puzzle)
values
${rows.join(',\n')}
on conflict (date) do nothing
returning date, mode, theme_name;`;

if (dryRun) {
  console.log(sql);
  process.exit(0);
}

const file = join(mkdtempSync(join(tmpdir(), 'dailies-')), 'dailies.sql');
writeFileSync(file, sql);
console.log(`Publishing ${days} dailies from ${from} (existing days are kept as they are)…`);
const out = execFileSync('npx', ['-y', 'supabase@latest', 'db', 'query', '--linked', '--file', file, '--output-format', 'json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});
const inserted = (JSON.parse(out.slice(out.indexOf('{'))).rows ?? []) as { date: string; mode: string; theme_name: string }[];
console.log(`Inserted ${inserted.length} new day(s); ${days - inserted.length} already published.`);
for (const r of inserted.slice(0, 10)) console.log(`  ${r.date}  ${r.mode.padEnd(7)}  ${r.theme_name}`);
if (inserted.length > 10) console.log(`  … and ${inserted.length - 10} more`);
