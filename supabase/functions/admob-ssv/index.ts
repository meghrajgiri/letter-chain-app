// AdMob server-side verification callback for rewarded ads. Google calls this
// after a player earns a reward; a valid signature is the only way a streak
// save reaches the server (players can't insert them, see migrations).
//
// The verifier is the app's own code (src/features/ads/ssv.ts), bundled by
// `npm run build:ssv`.
// Deploy: supabase functions deploy admob-ssv --no-verify-jwt  (docs/supabase-setup.md)
// AdMob: Streak save ad unit → Server-side verification → this function's URL.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { checkCallback, cooldownBlocks, streakSaveClaim, VERIFIER_KEYS_URL, type VerifierKey } from './ssv.js';

/** Google rotates keys; refetch them hourly (Google allows caching up to a day). */
const KEYS_TTL_MS = 60 * 60 * 1000;
/** An unknown key_id may be a freshly rotated key, but refetch at most this often (junk requests can't force fetches). */
const KEYS_REFRESH_MIN_MS = 60 * 1000;

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

let cached: { keys: VerifierKey[]; at: number } | null = null;

async function verifierKeys(refresh = false): Promise<VerifierKey[]> {
  const age = cached ? Date.now() - cached.at : Infinity;
  if (cached && age < (refresh ? KEYS_REFRESH_MIN_MS : KEYS_TTL_MS)) return cached.keys;
  try {
    const response = await fetch(VERIFIER_KEYS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { keys } = (await response.json()) as { keys: VerifierKey[] };
    cached = { keys, at: Date.now() };
    return keys;
  } catch (error) {
    if (cached) return cached.keys; // keep verifying with the keys we have
    throw error;
  }
}

/** Days with a completed daily for this player, from synced results. */
async function playedDays(userId: string, from: string, to: string): Promise<Set<string>> {
  const { data, error } = await db
    .from('game_results')
    .select('daily_date')
    .eq('user_id', userId)
    .eq('is_daily', true)
    .gte('daily_date', from)
    .lte('daily_date', to);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.daily_date as string));
}

Deno.serve(async (req) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  // As received: the signature covers the parameters in their original order.
  const raw = new URL(req.url).search.slice(1);
  if (!raw) return new Response('ok'); // reachability check

  let check = await checkCallback(raw, await verifierKeys());
  if (check.startsWith('unknown key_id')) check = await checkCallback(raw, await verifierKeys(true)); // maybe a newly rotated key
  if (check !== 'ok') {
    // The query holds no secrets (ids, a timestamp and Google's public signature); logged to debug mismatches.
    console.warn(`admob-ssv: bad signature (${check}); url=${req.url}`);
    return new Response('Bad signature', { status: 403 });
  }

  const claim = streakSaveClaim(new URLSearchParams(raw));
  // Genuine but not for us (another unit, a guest, AdMob's test callback): acknowledge so Google stops retrying.
  if ('error' in claim) {
    console.log(`admob-ssv: ignored (${claim.error})`);
    return new Response('ok');
  }

  try {
    // The app's once-a-week rule, enforced here too.
    const { data: others, error } = await db.from('streak_saves').select('day').eq('user_id', claim.userId); // a few a month at most
    if (error) throw error;
    const otherDays = (others ?? []).map((r) => r.day as string);
    const played = await playedDays(claim.userId, otherDays.reduce((a, b) => (a < b ? a : b), claim.day), claim.day);
    if (cooldownBlocks(claim.day, otherDays, played)) {
      console.log(`admob-ssv: ignored (cooldown, ${claim.day})`);
      return new Response('ok');
    }
  } catch (error) {
    console.error('admob-ssv: cooldown check failed', error);
    return new Response('Try again', { status: 500 }); // Google retries up to 5 times
  }

  const { error } = await db.from('streak_saves').upsert(
    { id: claim.id, user_id: claim.userId, day: claim.day, saved_at: claim.savedAt, transaction_id: claim.transactionId },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  // 23505: this transaction was already recorded (Google retried). 23503: no such user (deleted account).
  if (error && error.code !== '23505' && error.code !== '23503') {
    console.error('admob-ssv: insert failed', error);
    return new Response('Try again', { status: 500 });
  }
  return new Response('ok');
});
