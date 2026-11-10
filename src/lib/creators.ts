import type { Creator, PoolId } from '../data/schema';
import { standing, type Targets } from './pools';
import { CUSTOM_METRICS, type CreatorResult, type CustomPool } from './readout';

/**
 * Creators and pools (docs/UX_SPEC.md §7): every contracted creator with their pool from the latest readout, and
 * how a creator's pool changed since their previous campaign.
 */

/** Each default pool's rule, in plain words for the Creators and Brand kit screens. */
export const POOL_RULE: Record<PoolId, string> = {
  converters: 'CPA beat the goal by 10% or more in their latest campaign.',
  list_builders: 'Cost per email or SMS sign-up beat the target by 10% or more in their latest campaign.',
  reach: 'Cost per 1,000 impressions beat the campaign average by 10% or more.',
  test_again: 'Beat nothing, on their first campaign with you.',
  dont_rebook: 'Beat nothing, and they’ve run with you before.',
};

/** The short form on Brand kit's pool list. */
export const POOL_RULE_SHORT: Record<PoolId, string> = {
  converters: 'CPA is beat',
  list_builders: 'Cost per sign-up is beat',
  reach: 'Cost per 1,000 impressions is beat',
  test_again: 'Nothing beat, first campaign with you',
  dont_rebook: 'Nothing beat, has run with you before',
};

export function customRule(p: CustomPool): string {
  const m = CUSTOM_METRICS[p.metric];
  const target = `${(p.target * 100).toFixed(1)}%`;
  return `${m.label} is beat (${target} target)`;
}

export interface CreatorRow {
  creator: Creator;
  /** Their pool from the latest readout, or null if they weren't in it. */
  pool: string | null;
  campaigns: number;
  lastCpa: number | null;
  /** Cost per email or SMS sign-up; null when there's no sign-up data (campaigns before this one). */
  lastCps: number | null;
  /** "Barrier Serum launch, Dec", "An earlier campaign", or null for no campaigns yet. */
  lastCampaign: string | null;
}

export function creatorRows(roster: Creator[], results: CreatorResult[], campaign: { name: string; month: string }): CreatorRow[] {
  const byHandle = new Map(results.map((r) => [r.creator.handle, r]));
  return roster.map((c) => {
    const r = byHandle.get(c.handle);
    if (r) {
      return {
        creator: c,
        pool: r.pool,
        campaigns: c.past_campaigns + 1,
        lastCpa: r.cpa,
        lastCps: r.cps,
        lastCampaign: `${campaign.name}, ${campaign.month}`,
      };
    }
    return {
      creator: c,
      pool: null,
      campaigns: c.past_campaigns,
      lastCpa: c.past_cpa_usd,
      lastCps: null,
      lastCampaign: c.past_campaigns > 0 ? 'An earlier campaign' : null,
    };
  });
}

export interface PoolChange {
  handle: string;
  /** null when the earlier pool can't be known from the data. */
  before: { pool: PoolId | null; detail: string };
  after: { pool: string; detail: string };
}

/**
 * Creators whose pool changed since their previous campaign, for "How a creator changes pools". Only creators
 * with exactly one earlier campaign: their past results with this brand are that campaign. Past results hold CPA
 * but not sign-ups or impressions, so an earlier pool can only be known when it was Converters; anything else is
 * left out rather than guessed.
 */
export function poolChanges(results: CreatorResult[], targets: Targets): PoolChange[] {
  const changes: PoolChange[] = [];
  for (const r of results) {
    const c = r.creator;
    if (c.past_campaigns !== 1 || c.past_cpa_usd === null) continue;
    if (standing(c.past_cpa_usd, targets.cpa_usd) !== 'beat' || r.pool === 'converters') continue;
    changes.push({
      handle: c.handle,
      before: { pool: 'converters', detail: `first campaign, $${Math.round(c.past_cpa_usd)} CPA` },
      after: { pool: r.pool, detail: r.cpa === null ? 'no purchases' : `$${Math.round(r.cpa)} CPA` },
    });
  }
  return changes;
}

/**
 * Creators who beat nothing this campaign after missing the CPA goal on their first: shown as "missed again".
 * Their first campaign's pool isn't stated, since past sign-ups and impressions aren't in the data; the history
 * says what's known instead. This is @marco.minimal in the sample.
 */
export function missedTwice(results: CreatorResult[], targets: Targets): PoolChange[] {
  return results
    .filter(
      (r) =>
        r.creator.past_campaigns === 1 &&
        r.pool === 'dont_rebook' &&
        r.creator.past_cpa_usd !== null &&
        standing(r.creator.past_cpa_usd, targets.cpa_usd) === 'missed',
    )
    .map((r) => ({
      handle: r.creator.handle,
      before: { pool: null, detail: `first campaign, $${Math.round(r.creator.past_cpa_usd!)} CPA, missed the CPA goal` },
      after: { pool: 'dont_rebook', detail: `${r.cpa === null ? 'no purchases' : `$${Math.round(r.cpa)} CPA`}, missed again` },
    }));
}
