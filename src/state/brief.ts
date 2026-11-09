import type { Brief } from '../data/schema';

/**
 * The brief as edited in the app. Same as data/brief.json, except the secondary goal's target is optional:
 * sign-ups and reach have no target yet, so the readout compares them with the campaign average.
 */
export type SecondaryMetric = Brief['secondary_goal']['metric'];
export type CampaignBrief = Omit<Brief, 'secondary_goal'> & {
  secondary_goal: { metric: SecondaryMetric; target: number | null };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-12-01", "2026-12-14" → "Dec 1 – Dec 14, 2026". Different years: "Dec 28, 2026 – Jan 4, 2027". */
export function formatWindow(start: string, end: string): string {
  const p = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return { y: y!, label: `${MONTHS[m! - 1]} ${d}` };
  };
  const a = p(start);
  const b = p(end);
  return a.y === b.y ? `${a.label} – ${b.label}, ${b.y}` : `${a.label}, ${a.y} – ${b.label}, ${b.y}`;
}

/**
 * Parses what formatWindow writes, forgivingly: "Dec 1 - Dec 14, 2026", "dec 1 – jan 4, 2027" (rolls the year),
 * "Dec 1, 2026 – Jan 4, 2027". Returns null when it can't read a valid range.
 */
export function parseWindow(text: string): { start: string; end: string } | null {
  const m = text
    .trim()
    .match(/^([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:,?\s*(\d{4}))?\s*(?:–|—|-|to)\s*([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s*(\d{4})$/i);
  if (!m) return null;
  const month = (s: string) => MONTHS.findIndex((x) => x.toLowerCase() === s.toLowerCase());
  const [m1, d1, m2, d2, y2] = [month(m[1]!), Number(m[2]), month(m[4]!), Number(m[5]), Number(m[6])];
  if (m1 < 0 || m2 < 0) return null;
  const y1 = m[3] ? Number(m[3]) : m1 > m2 ? y2 - 1 : y2;
  const iso = (y: number, mo: number, d: number) => {
    const date = new Date(Date.UTC(y, mo, d));
    if (date.getUTCMonth() !== mo || date.getUTCDate() !== d) return null;
    return date.toISOString().slice(0, 10);
  };
  const start = iso(y1, m1, d1);
  const end = iso(y2, m2, d2);
  if (!start || !end || end < start) return null;
  return { start, end };
}

/**
 * "$32,000" / "32000" / "$65 per purchase" → number. The amount must lead, optionally followed by words
 * ("per purchase"), so stray text with a digit in it ("serum-v2") isn't read as $2. Null if not a positive amount.
 */
export function parseUsd(text: string): number | null {
  const m = text.trim().match(/^\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(?:\s+[a-z][a-z ]*)?$/i);
  if (!m) return null;
  const n = Number(`${m[1]!.replace(/,/g, '')}${m[2] ?? ''}`);
  return n > 0 ? n : null;
}

/** "fernway.example.com/serum" → "https://fernway.example.com/serum"; null if it isn't a URL. */
export function parseLink(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes('.') || u.search || u.hash) return null;
    return withScheme.replace(/\/$/, '');
  } catch {
    return null;
  }
}
