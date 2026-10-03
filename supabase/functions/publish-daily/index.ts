// Publishes tomorrow's daily puzzle, themed on what's trending (Wikipedia's
// most viewed articles + Wikidata, allowlist only), or keeps the evergreen
// daily when nothing safe is trending. Sends the owner a Telegram preview with
// a one-tap "swap". Runs daily from pg_cron (see migrations).
//
// The puzzle logic is the app's own engine, bundled by `npm run build:edge`.
// Deploy: supabase functions deploy publish-daily --no-verify-jwt  (docs/supabase-setup.md)
import { createClient } from 'npm:@supabase/supabase-js@2';

import { dailyKey, dailyModeFor, fetchTrendingArticles, planDaily, planEvergreen } from './pipeline.js';

const SECRET = Deno.env.get('PUBLISH_DAILY_SECRET') ?? '';
// Set by `npm run telegram:setup`; previews are skipped when either is missing.
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const DAY = 86_400_000;
const addDays = (key: string, n: number) => dailyKey(new Date(Date.parse(`${key}T00:00:00Z`) + n * DAY));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 2), { status, headers: { 'Content-Type': 'application/json' } });

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/** Constant-time comparison for secrets and tokens. */
function same(a: string, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function recentDailies(before: string) {
  const { data, error } = await db
    .from('daily_puzzles')
    .select('date, theme, words')
    .gte('date', addDays(before, -14))
    .lt('date', before);
  if (error) throw error;
  return data ?? [];
}

async function save(plan: { daily: any; source: string; trend: { title: string; views: number } | null }) {
  const { daily, source, trend } = plan;
  const { error } = await db.from('daily_puzzles').upsert(
    {
      date: daily.date,
      mode: daily.mode,
      theme: daily.theme,
      theme_name: daily.themeName,
      words: daily.words,
      puzzle: daily.puzzle,
      format_version: 1,
      source,
      trend_title: trend?.title ?? null,
      trend_views: trend?.views ?? null,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'date' },
  );
  if (error) throw error;
}

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Sends a Telegram message to the owner (no-op until Telegram is set up). */
async function telegram(text: string, button?: { text: string; url: string }) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(button ? { reply_markup: { inline_keyboard: [[button]] } } : {}),
    }),
  }).catch((error) => console.warn('Telegram preview failed', error));
  if (response && !response.ok) console.warn('Telegram preview failed', response.status, await response.text());
}

/** Tomorrow's preview with a Swap button (opens the signed swap link). */
async function notify(date: string, row: { mode: string; theme_name: string; words: string[]; source: string; trend_title?: string | null }) {
  const swapUrl = `${SUPABASE_URL}/functions/v1/publish-daily?action=swap&date=${date}&token=${await hmac(`swap:${date}`)}`;
  const lines = [
    `<b>Letter Chain daily · ${date}</b>`,
    `${row.mode === 'chain' ? 'Chain' : 'Classic'} · ${escapeHtml(row.theme_name)}${row.source === 'trending' ? ' 🔥 trending' : ''}`,
    `<code>${row.words.join(' · ')}</code>`,
    ...(row.trend_title ? [`Inspired by: ${escapeHtml(row.trend_title.replace(/_/g, ' '))}`] : []),
    '',
    'Goes live at 00:00 UTC (5:45 AM Nepal). Tap Swap to replace it with an evergreen puzzle.',
  ];
  await telegram(lines.join('\n'), { text: '🔁 Swap puzzle', url: swapUrl });
}

/** Plans and saves tomorrow's daily (or `date`). Never changes a day that is already live. */
async function publish(target: string) {
  const today = dailyKey();
  if (target <= today) return json({ ok: false, reason: `${target} is already live; it can't be changed` }, 409);

  const { data: existing, error } = await db.from('daily_puzzles').select('mode, theme_name, words, source, trend_title').eq('date', target).maybeSingle();
  if (error) throw error;
  if (existing && existing.source !== 'generated') return json({ ok: true, date: target, kept: existing.source });

  let trends: Awaited<ReturnType<typeof fetchTrendingArticles>>['articles'] = [];
  let trendDay: string | null = null;
  try {
    ({ day: trendDay, articles: trends } = await fetchTrendingArticles(addDays(today, -1), fetch));
  } catch (error) {
    console.warn('Could not fetch trends; using an evergreen theme', error);
  }

  const plan = planDaily({ key: target, trends, recent: await recentDailies(target) });
  if (dailyModeFor(target) !== plan.daily.mode) throw new Error('mode mismatch');

  // Keep a published evergreen day unless a trend upgrades it.
  if (existing && plan.source !== 'trending') {
    await notify(target, existing);
    return json({ ok: true, date: target, kept: 'generated', trendDay });
  }
  await save(plan);
  const row = { mode: plan.daily.mode, theme_name: plan.daily.themeName, words: plan.daily.words, source: plan.source, trend_title: plan.trend?.title };
  await notify(target, row);
  return json({ ok: true, date: target, published: row, trendDay });
}

/** Replaces a not-yet-live daily with an evergreen one (the preview's "Swap" button). */
async function swap(date: string, token: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !same(token, await hmac(`swap:${date}`))) return new Response('Invalid link', { status: 403 });
  if (date <= dailyKey()) return new Response(`The ${date} puzzle is already live and can't be swapped.`, { status: 409 });
  const { data: current } = await db.from('daily_puzzles').select('theme').eq('date', date).maybeSingle();
  const plan = planEvergreen({ key: date, recent: await recentDailies(date), excludeThemes: current ? [current.theme] : [] });
  await save({ ...plan, source: 'manual' });
  const summary = `${plan.daily.themeName}: ${plan.daily.words.join(', ')}`;
  await telegram(`✅ <b>Swapped ${date}</b>\n${escapeHtml(summary)}`);
  return new Response(`Swapped the ${date} daily to ${summary}. You can close this page.`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get('action') === 'swap') return await swap(url.searchParams.get('date') ?? '', url.searchParams.get('token') ?? '');
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    if (!same(req.headers.get('x-publish-secret') ?? '', SECRET)) return new Response('Unauthorized', { status: 401 });
    const date = url.searchParams.get('date') ?? addDays(dailyKey(), 1);
    return await publish(date);
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: String((error as Error)?.message ?? error) }, 500);
  }
});
