// AdMob server-side verification callback for rewarded ads. Google calls this
// after a player earns a reward; a valid signature is the only way a streak
// save reaches the server (players can't insert them, see migrations).
//
// The verifier is the app's own code (src/features/ads/ssv.ts), bundled by
// `npm run build:ssv`.
// Deploy: supabase functions deploy admob-ssv --no-verify-jwt  (docs/supabase-setup.md)
// AdMob: Streak save ad unit → Server-side verification → this function's URL.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { checkCallback, streakSaveClaim, VERIFIER_KEYS_URL, type VerifierKey } from './ssv.js';

/** The "Streak save" rewarded unit (ca-app-pub-6296571874627648/2808311873). */
const STREAK_SAVE_AD_UNIT = '2808311873';
/** Google rotates keys; don't keep them longer than a day. */
const KEYS_TTL_MS = 60 * 60 * 1000;

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

let cached: { keys: VerifierKey[]; at: number } | null = null;

async function verifierKeys(refresh = false): Promise<VerifierKey[]> {
  if (!refresh && cached && Date.now() - cached.at < KEYS_TTL_MS) return cached.keys;
  const response = await fetch(VERIFIER_KEYS_URL);
  if (!response.ok) throw new Error(`verifier keys: HTTP ${response.status}`);
  const { keys } = (await response.json()) as { keys: VerifierKey[] };
  cached = { keys, at: Date.now() };
  return keys;
}

Deno.serve(async (req) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  // Exactly as received: the signature covers the raw bytes and parameter order.
  const raw = new URL(req.url).search.slice(1);
  if (!raw) return new Response('ok'); // reachability check

  let check = await checkCallback(raw, await verifierKeys());
  if (check !== 'ok') check = await checkCallback(raw, await verifierKeys(true)); // maybe a newly rotated key
  if (check !== 'ok') {
    // The query holds no secrets (ids, a timestamp and Google's public signature); logged to debug mismatches.
    console.warn(`admob-ssv: bad signature (${check}); url=${req.url}`);
    return new Response('Bad signature', { status: 403 });
  }

  const claim = streakSaveClaim(new URLSearchParams(raw), STREAK_SAVE_AD_UNIT);
  // Genuine but not for us (another unit, a guest, AdMob's test callback): acknowledge so Google stops retrying.
  if ('error' in claim) {
    console.log(`admob-ssv: ignored (${claim.error})`);
    return new Response('ok');
  }

  const { error } = await db.from('streak_saves').upsert(
    { id: claim.id, user_id: claim.userId, day: claim.day, saved_at: claim.savedAt, transaction_id: claim.transactionId },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  // 23505: this transaction was already recorded (Google retried). 23503: no such user (deleted account).
  if (error && error.code !== '23505' && error.code !== '23503') {
    console.error('admob-ssv: insert failed', error);
    return new Response('Try again', { status: 500 }); // Google retries up to 5 times
  }
  return new Response('ok');
});
