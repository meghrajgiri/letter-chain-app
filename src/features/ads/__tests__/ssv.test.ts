import { derToRaw, streakSaveClaim, verifyCallback, type VerifierKey } from '../ssv';

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const toBase64Url = (bytes: Uint8Array) => toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** r‖s → DER, as Google sends it (minimal integers, 0x00 pad when the top bit is set). */
function rawToDer(raw: Uint8Array): Uint8Array {
  const int = (bytes: Uint8Array) => {
    let i = 0;
    while (i < bytes.length - 1 && bytes[i] === 0) i++;
    const v = bytes.subarray(i);
    return v[0] & 0x80 ? [0x02, v.length + 1, 0, ...v] : [0x02, v.length, ...v];
  };
  const body = [...int(raw.subarray(0, 32)), ...int(raw.subarray(32))];
  return new Uint8Array([0x30, body.length, ...body]);
}

const SAVE_ID = '3f0c6a52-6a1e-4d4b-9a51-1f6f0b2c9d11';
const USER_ID = '9b2f1e0a-8c7d-4e6f-a5b4-c3d2e1f0a9b8';
// 2026-10-20 08:30 UTC: the missed day is 2026-10-19.
const TIMESTAMP = Date.UTC(2026, 9, 20, 8, 30);

let keys: VerifierKey[];
let privateKey: CryptoKey;

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  privateKey = pair.privateKey;
  const spki = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey));
  keys = [{ keyId: 1268887, base64: toBase64(spki) }];
});

/** A callback query string as AdMob would send it, signed with our test key. */
async function callback(overrides: Record<string, string> = {}): Promise<string> {
  const params: Record<string, string> = {
    ad_network: '5450213213286189855',
    ad_unit: '2808311873',
    custom_data: JSON.stringify({ saveId: SAVE_ID, day: '2026-10-19' }),
    reward_amount: '1',
    reward_item: 'Streak save',
    timestamp: String(TIMESTAMP),
    transaction_id: '18fa792de1bca816048293fc71035638',
    user_id: USER_ID,
    ...overrides,
  };
  const content = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const raw = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, new TextEncoder().encode(content)));
  return `${content}&signature=${toBase64Url(rawToDer(raw))}&key_id=1268887`;
}

describe('verifyCallback', () => {
  it('accepts a correctly signed callback', async () => {
    expect(await verifyCallback(await callback(), keys)).toBe(true);
  });

  it('rejects any change to the signed content', async () => {
    const query = await callback();
    expect(await verifyCallback(query.replace('2026-10-19', '2026-10-18'), keys)).toBe(false);
    expect(await verifyCallback(query.replace(USER_ID, '00000000-0000-4000-8000-000000000000'), keys)).toBe(false);
  });

  it('rejects an unknown key, a missing signature or garbage', async () => {
    const query = await callback();
    expect(await verifyCallback(query.replace('key_id=1268887', 'key_id=1'), keys)).toBe(false);
    expect(await verifyCallback(query.slice(0, query.indexOf('&signature=')), keys)).toBe(false);
    expect(await verifyCallback(query.replace(/signature=[^&]+/, 'signature=AAAA'), keys)).toBe(false);
  });
});

describe('derToRaw', () => {
  it('strips the sign padding and left-pads short integers', () => {
    const r = new Uint8Array(32).fill(0x80); // top bit set → DER adds 0x00
    const s = new Uint8Array(32);
    s[31] = 7; // tiny → DER keeps one byte
    const raw = new Uint8Array([...r, ...s]);
    expect(derToRaw(rawToDer(raw))).toEqual(raw);
  });
});

describe('streakSaveClaim', () => {
  const claim = async (overrides: Record<string, string> = {}) => streakSaveClaim(new URLSearchParams(await callback(overrides)), '2808311873');

  it('reads a streak save from a callback', async () => {
    expect(await claim()).toEqual({
      id: SAVE_ID,
      userId: USER_ID,
      day: '2026-10-19',
      savedAt: '2026-10-20T08:30:00.000Z',
      transactionId: '18fa792de1bca816048293fc71035638',
    });
  });

  it('accepts the full ad unit id too', async () => {
    expect(await claim({ ad_unit: 'ca-app-pub-6296571874627648/2808311873' })).toMatchObject({ day: '2026-10-19' });
  });

  it('allows the daily rolling over during the ad', async () => {
    expect(await claim({ timestamp: String(Date.UTC(2026, 9, 21, 0, 1)) })).toMatchObject({ day: '2026-10-19' });
  });

  it('refuses other units, guests, and implausible days', async () => {
    expect(await claim({ ad_unit: '6139609264' })).toHaveProperty('error');
    expect(await claim({ user_id: '' })).toHaveProperty('error');
    expect(await claim({ custom_data: JSON.stringify({ saveId: SAVE_ID, day: '2026-10-01' }) })).toHaveProperty('error');
    expect(await claim({ custom_data: 'not json' })).toHaveProperty('error');
    expect(await claim({ custom_data: JSON.stringify({ saveId: 'x', day: '2026-10-19' }) })).toHaveProperty('error');
  });
});
