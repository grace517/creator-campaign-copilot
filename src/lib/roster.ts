import type { Creator } from '../data/schema';

/**
 * Roster logic, all computed from data/: committed spend, new-creator count, the one-creator CPA warning,
 * the niche-mix warning and the creators who would close it, and sort and filter.
 */

/** Niches that read as one group for the mix warning. A niche not listed here is its own group. */
const NICHE_GROUPS: Record<string, string> = {
  skincare: 'skincare',
  'skincare education': 'skincare',
  'sensitive skin': 'skincare',
  'budget beauty': 'skincare',
};
export const nicheGroup = (niche: string) => NICHE_GROUPS[niche] ?? niche;

/** A creator with no campaigns with this brand yet. They show "new", never blanks or zeros. */
export const isNew = (c: Pick<Creator, 'past_campaigns'>) => c.past_campaigns === 0;

/** A picked creator whose past CPA is this many times the benchmark or more gets a warning under their row. */
export const CPA_WARNING_MULTIPLE = 3;
/** The niche-mix warning fires when one group is more than this share of the picks. */
export const MIX_WARNING_SHARE = 0.5;
/** The budget bar turns amber at this share of the budget, before it blocks at 100%. */
export const BUDGET_NEAR_LIMIT = 0.9;

export interface RosterSummary {
  committed: number;
  remaining: number;
  picked: number;
  newPicked: number;
  budgetState: 'ok' | 'near' | 'over';
  newState: 'ok' | 'over';
}

export function summarize(roster: Creator[], picks: ReadonlySet<string>, budget: number, maxNew: number): RosterSummary {
  const picked = roster.filter((c) => picks.has(c.handle));
  const committed = picked.reduce((s, c) => s + c.fee_usd, 0);
  const newPicked = picked.filter(isNew).length;
  return {
    committed,
    remaining: budget - committed,
    picked: picked.length,
    newPicked,
    budgetState: committed > budget ? 'over' : committed >= budget * BUDGET_NEAR_LIMIT ? 'near' : 'ok',
    newState: newPicked > maxNew ? 'over' : 'ok',
  };
}

/** Why "Draft messages" can't go ahead yet, or null when it can. */
export function blocker(s: RosterSummary, maxNew: number): string | null {
  if (s.picked === 0) return 'Pick at least one creator.';
  if (s.budgetState === 'over') return `Over budget by $${(-s.remaining).toLocaleString('en-US')}. Unpick a creator to continue.`;
  if (s.newState === 'over') return `${s.newPicked} new creators picked; your limit is ${maxNew}. Unpick one to continue.`;
  return null;
}

export interface CpaWarning {
  multiple: number;
  expectedPurchases: number;
}

/** For a picked creator with a past CPA at least 3x the benchmark: how many times, and what the fee buys at that rate. */
export function cpaWarning(c: Creator, benchmark: number): CpaWarning | null {
  if (c.past_cpa_usd === null || c.past_cpa_usd < benchmark * CPA_WARNING_MULTIPLE) return null;
  return {
    multiple: Math.round(c.past_cpa_usd / benchmark),
    expectedPurchases: Math.round(c.fee_usd / c.past_cpa_usd),
  };
}

export interface MixWarning {
  group: string;
  count: number;
  of: number;
  /**
   * Unpicked creators outside the group whose fee fits the remaining budget, cheapest past CPA first.
   * Leaves out anyone who'd trigger the CPA warning: a fix shouldn't create a new problem.
   */
  fixes: Creator[];
}

export function mixWarning(
  roster: Creator[],
  picks: ReadonlySet<string>,
  remaining: number,
  benchmark: number,
): MixWarning | null {
  const picked = roster.filter((c) => picks.has(c.handle));
  if (picked.length < 2) return null;
  const counts = new Map<string, number>();
  for (const c of picked) counts.set(nicheGroup(c.niche), (counts.get(nicheGroup(c.niche)) ?? 0) + 1);
  const [group, count] = [...counts].sort((a, b) => b[1] - a[1])[0]!;
  if (count / picked.length <= MIX_WARNING_SHARE) return null;
  const fixes = sortCreators(
    roster.filter(
      (c) =>
        !picks.has(c.handle) &&
        nicheGroup(c.niche) !== group &&
        c.fee_usd <= remaining &&
        cpaWarning(c, benchmark) === null,
    ),
    'cpa',
  );
  return { group, count, of: picked.length, fixes };
}

export type SortKey = 'cpa' | 'cpl' | 'fee' | 'followers';
export const SORT_LABELS: Record<SortKey, string> = {
  cpa: 'Past CPA, low to high',
  cpl: 'Past CPL, low to high',
  fee: 'Fee, low to high',
  followers: 'Followers, high to low',
};

/** Stable sort. Creators with no history (null CPA or CPL) go last, in roster order. */
export function sortCreators(creators: Creator[], key: SortKey): Creator[] {
  const value = (c: Creator): number | null => {
    switch (key) {
      case 'cpa':
        return c.past_cpa_usd;
      case 'cpl':
        return c.past_cpl_usd;
      case 'fee':
        return c.fee_usd;
      case 'followers':
        return -c.followers;
    }
  };
  return creators
    .map((c, i) => ({ c, i, v: value(c) }))
    .sort((a, b) => {
      if (a.v === null && b.v === null) return a.i - b.i;
      if (a.v === null) return 1;
      if (b.v === null) return -1;
      return a.v - b.v || a.i - b.i;
    })
    .map((x) => x.c);
}

export interface Filters {
  niche: string | null;
  track: 'all' | 'proven' | 'new';
  backupsOnly: boolean;
  /** Unpicked creators whose fee fits the remaining budget. Picked creators stay visible. */
  fitsBudget: boolean;
  /** Set by "Show in table" on a warning: only these handles. */
  only: string[] | null;
}

export const NO_FILTERS: Filters = { niche: null, track: 'all', backupsOnly: false, fitsBudget: false, only: null };

export function filterCreators(
  creators: Creator[],
  f: Filters,
  picks: ReadonlySet<string>,
  remaining: number,
): Creator[] {
  return creators.filter(
    (c) =>
      (f.niche === null || c.niche === f.niche) &&
      (f.track === 'all' || (f.track === 'new') === isNew(c)) &&
      (!f.backupsOnly || c.is_backup) &&
      (!f.fitsBudget || picks.has(c.handle) || c.fee_usd <= remaining) &&
      (f.only === null || f.only.includes(c.handle)),
  );
}
