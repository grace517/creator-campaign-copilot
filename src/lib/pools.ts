import type { Brief, Creator, PoolId, Result } from '../data/schema';

/**
 * Readout metrics and pool assignment, per data/pools.json. Lower is better for every metric.
 * Beat: value <= target * 0.90. At par: within 10% either way. Missed: value > target * 1.10.
 *
 * The goals are cost per purchase (CPA, decides), cost per email or SMS sign-up (the brand's own list), and cost
 * per 1,000 impressions (reach). Cost per lead is a funnel diagnostic, not a goal: the brand can't reach a lead
 * again unless they buy or sign up, since the DM thread lives on the creator's account.
 */

export type Standing = 'beat' | 'at_par' | 'missed';

export interface CreatorMetrics {
  handle: string;
  fee_usd: number;
  /** null when the denominator is zero ("no purchases"), never Infinity or 0. */
  cpa_usd: number | null;
  /** Cost per email or SMS sign-up. */
  cps_usd: number | null;
  cpm_usd: number | null;
}

export interface Targets {
  cpa_usd: number;
  cps_usd: number;
  cpm_usd: number;
}

export interface PoolAssignment extends CreatorMetrics {
  pool: PoolId;
  standing: Record<keyof Targets, Standing | null>;
}

type GoalBrief = Pick<Brief, 'paid_social_cpa_benchmark_usd'> & {
  secondary_goal: { metric: Brief['secondary_goal']['metric']; target: number | null };
};

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
    cps_usd: ratio(creator.fee_usd, result.email_sms_signups),
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

/**
 * Targets from the brief, or the campaign average when the brief sets none (data/pools.json): the sign-up target
 * when the secondary goal is sign-ups and has one, and always the average for reach.
 */
export function campaignTargets(brief: GoalBrief, results: Result[], roster: Creator[]): Targets {
  const rows = joinRoster(results, roster);
  const fees = rows.reduce((s, { creator }) => s + creator.fee_usd, 0);
  const signups = rows.reduce((s, { result }) => s + result.email_sms_signups, 0);
  const impressions = rows.reduce((s, { result }) => s + result.impressions, 0);
  const g = brief.secondary_goal;
  return {
    cpa_usd: brief.paid_social_cpa_benchmark_usd,
    cps_usd: g.metric === 'email_sms_signups' && g.target !== null ? g.target : fees / signups,
    cpm_usd: (fees / impressions) * 1000,
  };
}

/** True when the sign-up target comes from the brief, false when it's the campaign average. */
export const cpsFromGoal = (brief: GoalBrief) =>
  brief.secondary_goal.metric === 'email_sms_signups' && brief.secondary_goal.target !== null;

/** Each creator joins the first pool they qualify for: Converters, List builders, Reach, then Test again or Don't rebook. */
export function assignPools(brief: GoalBrief, results: Result[], roster: Creator[]): PoolAssignment[] {
  const targets = campaignTargets(brief, results, roster);
  return joinRoster(results, roster).map(({ result, creator }) => {
    const m = creatorMetrics(result, creator);
    const s = {
      cpa_usd: standing(m.cpa_usd, targets.cpa_usd),
      cps_usd: standing(m.cps_usd, targets.cps_usd),
      cpm_usd: standing(m.cpm_usd, targets.cpm_usd),
    };
    let pool: PoolId;
    if (s.cpa_usd === 'beat') pool = 'converters';
    else if (s.cps_usd === 'beat') pool = 'list_builders';
    else if (s.cpm_usd === 'beat') pool = 'reach';
    else pool = creator.past_campaigns === 0 ? 'test_again' : 'dont_rebook';
    return { ...m, standing: s, pool };
  });
}

export function groupByPool(assignments: PoolAssignment[]): Record<PoolId, string[]> {
  const out: Record<PoolId, string[]> = {
    converters: [],
    list_builders: [],
    reach: [],
    test_again: [],
    dont_rebook: [],
  };
  for (const a of assignments) out[a.pool].push(a.handle);
  return out;
}
