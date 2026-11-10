const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-12-01" → { month: "Dec", day: 1 }, without time-zone drift. */
function parts(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return { month: MONTHS[m! - 1]!, day: d! };
}

/** $32,000, whole dollars. */
export const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

/** $2.85, two decimals. */
export const usd2 = (n: number) => `$${n.toFixed(2)}`;

/** 0.075 → "7.5%". */
export const pct = (rate: number) => `${(rate * 100).toFixed(1)}%`;

/** 265000 → "265K", 1200000 → "1.2M". */
export function compact(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

/** "Dec 1 – 14", or "Nov 28 – Dec 3" across months. */
export function dateRange(start: string, end: string): string {
  const a = parts(start);
  const b = parts(end);
  return a.month === b.month ? `${a.month} ${a.day} – ${b.day}` : `${a.month} ${a.day} – ${b.month} ${b.day}`;
}
