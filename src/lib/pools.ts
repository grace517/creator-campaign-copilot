import type { Brief, Creator, PoolId, Result } from '../data/schema';

/**
 * Readout metrics and pool assignment, per data/pools.json. Lower is better for every metric.
 * Beat: value <= target * 0.90. At par: within 10% either way. Missed: value > target * 1.10.
 */

export type Standing = 'beat' | 'at_par' | 'missed';

export interface CreatorMetrics {
  handle: string;
  fee_usd: number;
  /** null when the denominator is zero ("no purchases"), never Infinity or 0. */
  cpa_usd: number | null;
  cpl_usd: number | null;
  cpm_usd: number | null;
}

export interface Targets {
  cpa_usd: number;
  cpl_usd: number;
  cpm_usd: number;
}

export interface PoolAssignment extends CreatorMetrics {
  pool: PoolId;
  standing: Record<keyof Targets, Standing | null>;
}

const ratio = (num: number, den: number) => (den === 0 ? null : num / den);

export function standing(value: number | null, target: number): Standing | null {
  if (value === null) return null;
  if (value <= target * 0.9) return 'beat';
  if (value <= target * 1.1) return 'at_par';
  return 'missed';
}

export function creatorMetrics(result: Result, creator: Creator): CreatorMetrics {
  return {
    handle: result.handle,
    fee_usd: creator.fee_usd,
    cpa_usd: ratio(creator.fee_usd, result.purchases),
    cpl_usd: ratio(creator.fee_usd, result.dms_sent),
    cpm_usd: ratio(creator.fee_usd * 1000, result.impressions),
  };
}

function joinRoster(results: Result[], roster: Creator[]) {
  const byHandle = new Map(roster.map((c) => [c.handle, c]));
  return results.map((result) => {
    const creator = byHandle.get(result.handle);
    if (!creator) throw new Error(`results.csv has ${result.handle}, who isn't in roster.csv`);
    return { result, creator };
  });
}

export function campaignTargets(brief: Brief, results: Result[], roster: Creator[]): Targets {
  const rows = joinRoster(results, roster);
  const fees = rows.reduce((s, { creator }) => s + creator.fee_usd, 0);
  const leads = rows.reduce((s, { result }) => s + result.dms_sent, 0);
  const impressions = rows.reduce((s, { result }) => s + result.impressions, 0);
  return {
    cpa_usd: brief.paid_social_cpa_benchmark_usd,
    cpl_usd: brief.secondary_goal.metric === 'cpl_usd' ? brief.secondary_goal.target : fees / leads,
    // pools.json: campaign average unless the brief sets a reach goal. How a reach target maps to CPM is
    // decided in feat/07-readout; until then, always the average.
    cpm_usd: (fees / impressions) * 1000,
  };
}

/** Each creator joins the first pool they qualify for: Converters, Lead builders, Reach, then Test again or Don't rebook. */
export function assignPools(brief: Brief, results: Result[], roster: Creator[]): PoolAssignment[] {
  const targets = campaignTargets(brief, results, roster);
  return joinRoster(results, roster).map(({ result, creator }) => {
    const m = creatorMetrics(result, creator);
    const s = {
      cpa_usd: standing(m.cpa_usd, targets.cpa_usd),
      cpl_usd: standing(m.cpl_usd, targets.cpl_usd),
      cpm_usd: standing(m.cpm_usd, targets.cpm_usd),
    };
    let pool: PoolId;
    if (s.cpa_usd === 'beat') pool = 'converters';
    else if (s.cpl_usd === 'beat') pool = 'lead_builders';
    else if (s.cpm_usd === 'beat') pool = 'reach';
    else pool = creator.past_campaigns === 0 ? 'test_again' : 'dont_rebook';
    return { ...m, standing: s, pool };
  });
}

export function groupByPool(assignments: PoolAssignment[]): Record<PoolId, string[]> {
  const out: Record<PoolId, string[]> = {
    converters: [],
    lead_builders: [],
    reach: [],
    test_again: [],
    dont_rebook: [],
  };
  for (const a of assignments) out[a.pool].push(a.handle);
  return out;
}
