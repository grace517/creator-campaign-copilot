import type { Creator, Result } from '../data/schema';
import { addDays } from './status';

/**
 * Empty, loading, and error states (docs/UX_SPEC.md) and the phone readout's ranked list. The sample campaign never
 * reaches these states on its own, so each screen can preview them with ?state=… (see SAMPLE_STATES); the logic
 * below is what decides them.
 */

export type StateScreen = 'roster' | 'drafts' | 'status' | 'readout';

/** The states each screen can preview in the sample campaign, as ?state=<id>. */
export const SAMPLE_STATES: Record<StateScreen, { id: string; label: string }[]> = {
  roster: [{ id: 'first-campaign', label: 'First campaign, no history' }],
  drafts: [
    { id: 'writing', label: 'Writing starters' },
    { id: 'failed', label: 'A model call fails' },
  ],
  status: [{ id: 'disconnected', label: 'An account disconnects' }],
  readout: [{ id: 'early', label: 'Results still coming in' }],
};

// ── Roster: first campaign ────────────────────────────────────────────────────────────────────────────────────

/** The roster as it would look before the brand's first campaign: no past results with this brand. */
export const withoutHistory = (roster: Creator[]): Creator[] =>
  roster.map((c) => ({
    ...c,
    past_campaigns: 0,
    past_cpa_usd: null,
    past_cpl_usd: null,
    past_dm_to_purchase_rate: null,
    past_engagement_rate: null,
  }));

/** No creator has run a campaign with this brand, so there's no CPA to sort by. */
export const isFirstCampaign = (roster: Creator[]) => roster.length > 0 && roster.every((c) => c.past_campaigns === 0);

// ── Drafts: writing starters, with one automatic retry ───────────────────────────────────────────────────────

/** Calls fn, and once more if it throws. The second failure is the one the row shows. */
export async function withOneRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return fn();
  }
}

/** "About 20 seconds left", from the average time per finished starter. */
export function timeLeft(done: number, total: number, elapsedMs: number): string | null {
  if (done === 0 || done >= total) return null;
  const secs = Math.max(1, Math.round(((elapsedMs / done) * (total - done)) / 1000));
  if (secs < 60) return `About ${secs} second${secs === 1 ? '' : 's'} left`;
  const mins = Math.round(secs / 60);
  return `About ${mins} minute${mins === 1 ? '' : 's'} left`;
}

// ── Readout: results still coming in ─────────────────────────────────────────────────────────────────────────

/** Posts are judged once they've run this many days. */
export const SETTLE_DAYS = 7;

export interface EarlyResults {
  settled: number;
  total: number;
  /** The last post to settle: its creator, post date, and the day it reaches SETTLE_DAYS. */
  last: { handle: string; posted: string; settles: string };
  /** CPA so far across the settled creators; null when none have settled or none have purchases. */
  cpaSoFar: number | null;
  done: boolean;
}

export function earlyResults(results: Result[], roster: Creator[], today: string): EarlyResults {
  const byHandle = new Map(roster.map((c) => [c.handle, c]));
  const rows = results.map((r) => {
    const c = byHandle.get(r.handle);
    if (!c) throw new Error(`results.csv has ${r.handle}, who isn't in roster.csv`);
    return { r, c, settles: addDays(c.post_date, SETTLE_DAYS) };
  });
  const settled = rows.filter((x) => x.settles <= today);
  const last = [...rows].sort((a, b) => b.c.post_date.localeCompare(a.c.post_date))[0];
  if (!last) throw new Error("earlyResults needs at least one result");
  const fees = settled.reduce((s, x) => s + x.c.fee_usd, 0);
  const purchases = settled.reduce((s, x) => s + x.r.purchases, 0);
  return {
    settled: settled.length,
    total: rows.length,
    last: { handle: last.c.handle, posted: last.c.post_date, settles: last.settles },
    cpaSoFar: purchases === 0 ? null : fees / purchases,
    done: settled.length === rows.length,
  };
}

// ── Readout, phone: CPA by creator as a ranked list ──────────────────────────────────────────────────────────

export interface CpaBar {
  handle: string;
  cpa: number | null;
  pool: string;
  /** Bar length as a share of the track, 0–1. */
  width: number;
  /** Past the end of the scale (or no purchases): the bar fills the track and says so. */
  offScale: boolean;
}

/**
 * Ranked low to high, creators with no purchases last. The scale ends 25% past the highest CPA that's within
 * three times the goal, so one outlier doesn't squash everyone else; anything past it is "off scale".
 */
export function cpaBars(rows: { handle: string; cpa: number | null; pool: string }[], goal: number) {
  const inRange = rows.map((r) => r.cpa).filter((v): v is number => v !== null && v <= goal * 3);
  const max = Math.max(goal, ...inRange) * 1.25;
  const bars: CpaBar[] = [...rows]
    .sort((a, b) => (a.cpa ?? Infinity) - (b.cpa ?? Infinity))
    .map((r) => {
      const offScale = r.cpa === null || r.cpa > max;
      return { ...r, width: offScale ? 1 : r.cpa! / max, offScale };
    });
  return { bars, goalAt: goal / max };
}
