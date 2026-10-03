/** 'YYYY-MM-DD' keys in the player's local time. Arithmetic is done in UTC on the key to avoid DST issues. */

export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toUtc(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const t = new Date(toUtc(key) + days * 86400000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

/** Monday (0) … Sunday (6). */
export function weekdayIndex(key: string): number {
  return (new Date(toUtc(key)).getUTCDay() + 6) % 7;
}

/** The 7 date keys (Mon → Sun) of the week containing `key`. */
export function weekOf(key: string): string[] {
  const monday = addDays(key, -weekdayIndex(key));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
