/**
 * AdMob server-side verification (SSV) for rewarded ads. When a player earns a
 * reward, Google's servers call our `admob-ssv` Edge Function with a signed
 * query string; only a valid signature proves the ad was really watched.
 * https://developers.google.com/admob/android/ssv
 *
 * Pure (WebCrypto only): unit-tested here, and bundled into the Edge Function
 * by `npm run build:ssv`.
 */

export const VERIFIER_KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';

/** One of Google's signing keys (`base64` is the DER-encoded SPKI public key). */
export type VerifierKey = { keyId: number; base64: string };

/** What the app puts in `customData` for a streak save. */
export type StreakSaveCustomData = { saveId: string; day: string };

/** A verified, plausible streak save, ready to insert. */
export type StreakSaveClaim = { id: string; userId: string; day: string; savedAt: string; transactionId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  // Signatures are URL-safe base64 without padding; keys are standard base64.
  const standard = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** DER `SEQUENCE { INTEGER r, INTEGER s }` → the fixed-width r‖s that WebCrypto expects. */
export function derToRaw(der: Uint8Array, size = 32): Uint8Array<ArrayBuffer> {
  let offset = 2;
  if (der[0] !== 0x30) throw new Error('Not a DER sequence');
  if (der[1] & 0x80) offset += der[1] & 0x7f; // long-form length
  const out = new Uint8Array(size * 2);
  for (let part = 0; part < 2; part++) {
    if (der[offset] !== 0x02) throw new Error('Not a DER integer');
    const length = der[offset + 1];
    let value = der.subarray(offset + 2, offset + 2 + length);
    while (value.length > size && value[0] === 0) value = value.subarray(1); // sign-padding byte
    if (value.length > size) throw new Error('Integer too long');
    out.set(value, part * size + (size - value.length));
    offset += 2 + length;
  }
  return out;
}

/**
 * What Google signed: the query before `&signature=`, URL-decoded. The signature
 * covers the decoded text (e.g. `reward_item=Streak save`, sent as `Streak+save`).
 */
function signedContent(rawQuery: string, cut: number): string {
  return decodeURIComponent(rawQuery.slice(0, cut).replace(/\+/g, ' '));
}

/**
 * Checks Google's signature over the callback. `rawQuery` must be the query
 * string as received (no leading `?`, parameters in their original order).
 */
export async function verifyCallback(rawQuery: string, keys: readonly VerifierKey[]): Promise<boolean> {
  return (await checkCallback(rawQuery, keys)) === 'ok';
}

/** Like `verifyCallback`, but says why a callback failed (for the function's logs). */
export async function checkCallback(rawQuery: string, keys: readonly VerifierKey[]): Promise<string> {
  const cut = rawQuery.indexOf('&signature=');
  if (cut < 0) return 'no signature parameter';
  const params = new URLSearchParams(rawQuery);
  const signature = params.get('signature');
  const keyId = params.get('key_id');
  const key = keys.find((k) => String(k.keyId) === keyId);
  if (!signature) return 'empty signature';
  if (!key) return `unknown key_id ${keyId} (have ${keys.map((k) => k.keyId).join(', ')})`;
  try {
    const publicKey = await crypto.subtle.importKey('spki', base64ToBytes(key.base64), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      derToRaw(base64ToBytes(signature)),
      new TextEncoder().encode(signedContent(rawQuery, cut)),
    );
    return valid ? 'ok' : 'signature does not match';
  } catch (error) {
    return `verify threw: ${error instanceof Error ? error.message : String(error)}`;
  }
}

const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * Turns a verified callback into a streak save, or says why it isn't one. The
 * saved day must be the day before the reward (or two days before, if the daily
 * rolled over while the ad played), matching the app's one-missed-day rule.
 */
export function streakSaveClaim(params: URLSearchParams, adUnit: string): StreakSaveClaim | { error: string } {
  const unit = params.get('ad_unit') ?? '';
  if (unit !== adUnit && !unit.endsWith(`/${adUnit}`)) return { error: `other ad unit ${unit}` };
  const userId = params.get('user_id') ?? '';
  if (!UUID.test(userId)) return { error: 'no user' };
  const transactionId = params.get('transaction_id') ?? '';
  if (!transactionId) return { error: 'no transaction' };
  const timestamp = Number(params.get('timestamp'));
  if (!Number.isFinite(timestamp) || timestamp <= 0) return { error: 'bad timestamp' };

  let data: Partial<StreakSaveCustomData>;
  try {
    data = JSON.parse(params.get('custom_data') ?? '');
  } catch {
    return { error: 'bad custom data' };
  }
  if (typeof data.saveId !== 'string' || !UUID.test(data.saveId)) return { error: 'bad save id' };
  if (typeof data.day !== 'string' || !DAY.test(data.day)) return { error: 'bad day' };
  if (data.day !== utcDay(timestamp - DAY_MS) && data.day !== utcDay(timestamp - 2 * DAY_MS)) return { error: `implausible day ${data.day}` };

  return { id: data.saveId, userId, day: data.day, savedAt: new Date(timestamp).toISOString(), transactionId };
}
