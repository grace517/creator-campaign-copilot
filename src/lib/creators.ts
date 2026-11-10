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
  lead_builders: 'Cost per lead beat the goal by 10% or more in their latest campaign.',
  reach: 'Cost per 1,000 impressions beat the campaign average by 10% or more.',
  test_again: 'Beat nothing, on their first campaign with you.',
  dont_rebook: 'Beat nothing, and they’ve run with you before.',
};

/** The short form on Brand kit's pool list. */
export const POOL_RULE_SHORT: Record<PoolId, string> = {
  converters: 'CPA is beat',
  lead_builders: 'Cost per lead is beat',
  reach: 'Cost per 1,000 impressions is beat',
  test_again: 'Nothing beat, first campaign with you',
  dont_rebook: 'Nothing beat, has run with you before',
};

export function customRule(p: CustomPool): string {
  const m = CUSTOM_METRICS[p.metric];
  const target = m.unit === 'usd' ? `$${p.target.toFixed(2)}` : `${(p.target * 100).toFixed(1)}%`;
  return `${m.label} is beat (${target} target)`;
}

export interface CreatorRow {
  creator: Creator;
  /** Their pool from the latest readout, or null if they weren't in it. */
  pool: string | null;
  campaigns: number;
  lastCpa: number | null;
  lastCpl: number | null;
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
        lastCpl: r.cpl,
        lastCampaign: `${campaign.name}, ${campaign.month}`,
      };
    }
    return {
      creator: c,
      pool: null,
      campaigns: c.past_campaigns,
      lastCpa: c.past_cpa_usd,
      lastCpl: c.past_cpl_usd,
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
 * with exactly one earlier campaign: their past results with this brand are that campaign. The earlier pool is
 * worked out from past CPA and cost per lead; reach can't be, since past impressions aren't in the data, so a
 * creator who might have qualified for Reach is left out rather than guessed.
 */
export function poolChanges(results: CreatorResult[], targets: Targets): PoolChange[] {
  const changes: PoolChange[] = [];
  for (const r of results) {
    const c = r.creator;
    if (c.past_campaigns !== 1 || c.past_cpa_usd === null) continue;
    const cpa = standing(c.past_cpa_usd, targets.cpa_usd);
    const cpl = standing(c.past_cpl_usd, targets.cpl_usd);
    let before: PoolId | null = null;
    if (cpa === 'beat') before = 'converters';
    else if (cpl === 'beat') before = 'lead_builders';
    else continue; // beat neither: Reach, Test again, or nothing; can't tell without past impressions
    if (before === r.pool) continue;
    changes.push({
      handle: c.handle,
      before: { pool: before, detail: `first campaign, $${Math.round(c.past_cpa_usd)} CPA` },
      after: { pool: r.pool, detail: r.cpa === null ? 'no purchases' : `$${Math.round(r.cpa)} CPA` },
    });
  }
  return changes;
}

/**
 * Creators who beat nothing this campaign after missing CPA and cost per lead on their first: shown as
 * "missed again". Their first campaign's pool isn't stated, since past impressions aren't in the data and they
 * might have qualified for Reach; the history says what's known instead. This is @marco.minimal in the sample.
 */
export function missedTwice(results: CreatorResult[], targets: Targets): PoolChange[] {
  return results
    .filter(
      (r) =>
        r.creator.past_campaigns === 1 &&
        r.pool === 'dont_rebook' &&
        r.creator.past_cpa_usd !== null &&
        standing(r.creator.past_cpa_usd, targets.cpa_usd) !== 'beat' &&
        standing(r.creator.past_cpl_usd, targets.cpl_usd) !== 'beat',
    )
    .map((r) => ({
      handle: r.creator.handle,
      before: { pool: null, detail: `first campaign, $${Math.round(r.creator.past_cpa_usd!)} CPA, missed CPA and cost per lead` },
      after: { pool: 'dont_rebook', detail: `${r.cpa === null ? 'no purchases' : `$${Math.round(r.cpa)} CPA`}, missed again` },
    }));
}
