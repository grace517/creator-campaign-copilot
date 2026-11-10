import type { Brief, Creator, PoolId, Result } from '../data/schema';
import { campaignTargets, creatorMetrics, standing, type Standing, type Targets } from './pools';
import { CPA_WARNING_MULTIPLE } from './roster';

/**
 * The readout (docs/UX_SPEC.md §5), all computed from data/: the verdict (a template filled from numbers, so it
 * can't state anything the data doesn't support), each pool's stat, custom pools, and the funnel.
 * Pool rules follow data/pools.json; pools.ts holds the shared metrics and the beat / at par / missed thresholds.
 */

type BriefTargets = Pick<Brief, 'paid_social_cpa_benchmark_usd'> & {
  secondary_goal: { metric: Brief['secondary_goal']['metric']; target: number | null };
};

export interface CreatorResult {
  creator: Creator;
  result: Result;
  cpa: number | null;
  cpl: number | null;
  cpm: number | null;
  standing: Record<'cpa' | 'cpl' | 'cpm', Standing | null>;
  /** A default pool id, or a custom pool's id. */
  pool: string;
  /** The metric that placed the creator in their pool: outlined in the table. */
  decidedBy: 'cpa' | 'cpl' | 'cpm' | 'custom';
}

/** A brand's own pool (docs/UX_SPEC.md: custom pools). Same beat rule as the defaults. */
export interface CustomPool {
  id: string;
  name: string;
  metric: CustomMetric;
  target: number;
  /** Checked first, or right after this default pool. */
  after: 'first' | 'converters' | 'lead_builders' | 'reach';
}

export const CUSTOM_METRICS = {
  cost_per_signup: { label: 'Cost per email or SMS sign-up', lowerIsBetter: true, unit: 'usd' },
  dm_to_purchase: { label: 'DM-to-purchase rate', lowerIsBetter: false, unit: 'pct' },
  engagement: { label: 'Engagement rate (comments per impression)', lowerIsBetter: false, unit: 'pct' },
} as const;
export type CustomMetric = keyof typeof CUSTOM_METRICS;

const ratio = (a: number, b: number) => (b === 0 ? null : a / b);

export function customValue(metric: CustomMetric, r: Result, c: Creator): number | null {
  switch (metric) {
    case 'cost_per_signup':
      return ratio(c.fee_usd, r.email_sms_signups);
    case 'dm_to_purchase':
      return ratio(r.purchases, r.dms_sent);
    case 'engagement':
      return ratio(r.comments, r.impressions);
  }
}

/** Beat for a custom metric: 10% or more better than target, in whichever direction is better. */
export function customBeats(metric: CustomMetric, value: number | null, target: number): boolean {
  if (value === null) return false;
  return CUSTOM_METRICS[metric].lowerIsBetter ? value <= target * 0.9 : value >= target * 1.1;
}

const DEFAULT_ORDER: { id: PoolId; metric: 'cpa' | 'cpl' | 'cpm' }[] = [
  { id: 'converters', metric: 'cpa' },
  { id: 'lead_builders', metric: 'cpl' },
  { id: 'reach', metric: 'cpm' },
];

/** The order pools are checked in, with custom pools inserted where the brand put them. */
export function poolOrder(custom: CustomPool[]): ({ kind: 'default'; id: PoolId; metric: 'cpa' | 'cpl' | 'cpm' } | { kind: 'custom'; pool: CustomPool })[] {
  const order: ReturnType<typeof poolOrder> = [];
  for (const c of custom.filter((p) => p.after === 'first')) order.push({ kind: 'custom', pool: c });
  for (const d of DEFAULT_ORDER) {
    order.push({ kind: 'default', ...d });
    for (const c of custom.filter((p) => p.after === d.id)) order.push({ kind: 'custom', pool: c });
  }
  return order;
}

export function computeResults(
  brief: BriefTargets,
  results: Result[],
  roster: Creator[],
  custom: CustomPool[] = [],
): { rows: CreatorResult[]; targets: Targets } {
  const targets = campaignTargets(brief as Brief, results, roster);
  const byHandle = new Map(roster.map((c) => [c.handle, c]));
  const order = poolOrder(custom);
  const rows = results.map((result): CreatorResult => {
    const creator = byHandle.get(result.handle)!;
    const m = creatorMetrics(result, creator);
    const s = {
      cpa: standing(m.cpa_usd, targets.cpa_usd),
      cpl: standing(m.cpl_usd, targets.cpl_usd),
      cpm: standing(m.cpm_usd, targets.cpm_usd),
    };
    let pool: string | null = null;
    let decidedBy: CreatorResult['decidedBy'] = 'cpa';
    for (const step of order) {
      if (step.kind === 'default' && s[step.metric] === 'beat') {
        pool = step.id;
        decidedBy = step.metric;
        break;
      }
      if (step.kind === 'custom' && customBeats(step.pool.metric, customValue(step.pool.metric, result, creator), step.pool.target)) {
        pool = step.pool.id;
        decidedBy = 'custom';
        break;
      }
    }
    if (!pool) pool = creator.past_campaigns === 0 ? 'test_again' : 'dont_rebook';
    return { creator, result, cpa: m.cpa_usd, cpl: m.cpl_usd, cpm: m.cpm_usd, standing: s, pool, decidedBy };
  });
  return { rows, targets };
}

const sum = (rows: CreatorResult[], f: (r: CreatorResult) => number) => rows.reduce((s, r) => s + f(r), 0);
const fees = (rows: CreatorResult[]) => sum(rows, (r) => r.creator.fee_usd);
const purchases = (rows: CreatorResult[]) => sum(rows, (r) => r.result.purchases);
const pctOff = (value: number, target: number) => Math.round((Math.abs(value - target) / target) * 100);

export interface Verdict {
  headline: string;
  blendedCpa: number;
  purchases: number;
  outliers: CreatorResult[];
  /** CPA without the outliers, when there are any. */
  cpaWithout: number | null;
  goal: number;
}

/**
 * The verdict, a template filled from computed numbers. An outlier is a creator whose CPA is 3x the goal or more
 * (the same multiple the roster warns at). When the blended CPA misses the goal but the rest beat it, the verdict
 * says so and names who to take out; the scatter shows why at a glance.
 */
export function verdict(rows: CreatorResult[], goal: number): Verdict {
  const blended = fees(rows) / purchases(rows);
  const outliers = rows.filter((r) => r.cpa !== null && r.cpa >= goal * CPA_WARNING_MULTIPLE);
  const rest = rows.filter((r) => !outliers.includes(r));
  const cpaWithout = outliers.length && purchases(rest) > 0 ? fees(rest) / purchases(rest) : null;
  const names = outliers.map((o) => o.creator.handle).join(' and ');
  let headline: string;
  if (blended < goal) headline = `Creators beat paid social by ${pctOff(blended, goal)}%.`;
  else if (cpaWithout !== null && cpaWithout < goal) {
    headline = `Creators beat paid social by ${pctOff(cpaWithout, goal)}%, once you take out ${names}.`;
  } else headline = `Creators cost more than paid social: ${pctOff(blended, goal)}% over the goal.`;
  return { headline, blendedCpa: blended, purchases: purchases(rows), outliers, cpaWithout, goal };
}

/** "just over" within 10% of the goal, otherwise "over"; "under" when it beats. */
export function versusGoal(value: number, goal: number): string {
  if (value < goal) return 'under';
  return value <= goal * 1.1 ? 'just over' : 'over';
}

/** Hooks from the Converters, most purchases first: the angles that brought in buyers. */
export function convertingHooks(rows: CreatorResult[], limit = 2): string[] {
  return rows
    .filter((r) => r.pool === 'converters')
    .sort((a, b) => b.result.purchases - a.result.purchases)
    .slice(0, limit)
    .map((r) => r.result.hook_used);
}

const money = (n: number, decimals = 0) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

/** Each pool card's one stat, same format on every card: the value that placed them, against its target. */
export function poolStat(pool: string, members: CreatorResult[], targets: Targets, custom: CustomPool[] = []): string {
  if (members.length === 0) return 'No creators this campaign';
  const f = fees(members);
  const r = (k: keyof Result) => sum(members, (m) => m.result[k] as number);
  switch (pool) {
    case 'converters': {
      const cpa = f / r('purchases');
      return `${money(cpa)} CPA, ${pctOff(cpa, targets.cpa_usd)}% under the ${money(targets.cpa_usd)} goal`;
    }
    case 'lead_builders': {
      const cpl = f / r('dms_sent');
      return `${money(cpl, 2)} per lead, ${pctOff(cpl, targets.cpl_usd)}% under the ${money(targets.cpl_usd, 2)} goal`;
    }
    case 'reach': {
      const cpm = (f / r('impressions')) * 1000;
      return `${money(cpm, 2)} per 1,000 impressions, ${pctOff(cpm, targets.cpm_usd)}% under average`;
    }
    case 'test_again':
    case 'dont_rebook': {
      const cpa = f / r('purchases');
      const missedAll = members.every((m) => m.standing.cpa === 'missed' && m.standing.cpl === 'missed' && m.standing.cpm === 'missed');
      const tail = pool === 'test_again' ? 'first campaign' : missedAll ? 'missed all three' : 'beat none of the three';
      return `${money(cpa)} CPA, ${pctOff(cpa, targets.cpa_usd)}% ${cpa > targets.cpa_usd ? 'over' : 'under'} goal, ${tail}`;
    }
    default: {
      const cp = custom.find((c) => c.id === pool);
      if (!cp) return '';
      return customPreviewValue(cp, members);
    }
  }
}

function formatCustom(metric: CustomMetric, v: number): string {
  return CUSTOM_METRICS[metric].unit === 'usd' ? `${money(v, 2)}` : `${(v * 100).toFixed(1)}%`;
}

function customPreviewValue(cp: CustomPool, members: CreatorResult[]): string {
  const vals = members.map((m) => customValue(cp.metric, m.result, m.creator)).filter((v): v is number => v !== null);
  if (!vals.length) return '';
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return `${formatCustom(cp.metric, avg)} ${cp.metric === 'cost_per_signup' ? 'per sign-up' : CUSTOM_METRICS[cp.metric].label.toLowerCase()}, target ${formatCustom(cp.metric, cp.target)}`;
}

export interface FunnelStep {
  count: number;
  /** Share of the step before; null for impressions. */
  rate: number | null;
}

export const FUNNEL_STEPS = ['impressions', 'comments', 'leads', 'clicks', 'purchases'] as const;
export type FunnelStepName = (typeof FUNNEL_STEPS)[number];

export function funnel(r: Pick<Result, 'impressions' | 'comments' | 'dms_sent' | 'link_clicks' | 'purchases'>): Record<FunnelStepName, FunnelStep> {
  const counts = [r.impressions, r.comments, r.dms_sent, r.link_clicks, r.purchases];
  return Object.fromEntries(
    FUNNEL_STEPS.map((s, i) => [s, { count: counts[i]!, rate: i === 0 ? null : ratio(counts[i]!, counts[i - 1]!) }]),
  ) as Record<FunnelStepName, FunnelStep>;
}

export function campaignTotals(rows: CreatorResult[]) {
  const t = (k: keyof Result) => sum(rows, (r) => r.result[k] as number);
  return { impressions: t('impressions'), comments: t('comments'), dms_sent: t('dms_sent'), link_clicks: t('link_clicks'), purchases: t('purchases') };
}

/** The step where a creator falls furthest below the campaign's own rate: where to look. */
export function weakestStep(creator: CreatorResult, rows: CreatorResult[]): { step: FunnelStepName; rate: number; campaignRate: number } | null {
  const mine = funnel(creator.result);
  const all = funnel(campaignTotals(rows));
  let worst: { step: FunnelStepName; rate: number; campaignRate: number; ratio: number } | null = null;
  for (const s of FUNNEL_STEPS.slice(1)) {
    const a = mine[s].rate;
    const b = all[s].rate;
    if (a === null || b === null || b === 0) continue;
    if (!worst || a / b < worst.ratio) worst = { step: s, rate: a, campaignRate: b, ratio: a / b };
  }
  return worst && { step: worst.step, rate: worst.rate, campaignRate: worst.campaignRate };
}
