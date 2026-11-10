import { describe, expect, it } from 'vitest';
import { brief, poolsConfig, results, roster } from '../data';
import { assignPools } from './pools';
import {
  campaignTotals,
  computeResults,
  convertingHooks,
  customPreview,
  funnel,
  poolStat,
  verdict,
  versusGoal,
  weakestStep,
  type CustomPool,
} from './readout';

const { rows, targets } = computeResults(brief, results, roster);
const inPool = (p: string) => rows.filter((r) => r.pool === p);
const signUps: CustomPool = { id: 'custom-signups', name: 'Sign-up drivers', metric: 'cost_per_signup', target: 10, after: 'converters' };

describe('readout on the sample data', () => {
  it('assigns the same pools as pools.ts, matching expected_sample_result', () => {
    const fromPools = Object.fromEntries(assignPools(brief, results, roster).map((a) => [a.handle, a.pool]));
    for (const r of rows) expect(r.pool, r.creator.handle).toBe(fromPools[r.creator.handle]);
    for (const [pool, handles] of Object.entries(poolsConfig.expected_sample_result)) {
      expect(inPool(pool).map((r) => r.creator.handle).sort()).toEqual([...handles].sort());
    }
  });

  it('says creators beat paid social by 24% once you take out @sunlit.sam: $49 vs $65, $66 with, 415 purchases', () => {
    const v = verdict(rows, 65);
    expect(v.headline).toBe('Creators beat paid social by 24%, once you take out @sunlit.sam.');
    expect(Math.round(v.cpaWithout!)).toBe(49);
    expect(Math.round(v.blendedCpa)).toBe(66);
    expect(v.purchases).toBe(415);
    expect(versusGoal(v.blendedCpa, 65)).toBe('just over');
  });

  it('names the converting hooks, most purchases first', () => {
    expect(convertingHooks(rows)).toEqual(['nurse explains sensitive skin', 'before-and-after barrier routine']);
  });

  it('writes each pool card’s stat as in the design', () => {
    expect(poolStat('converters', inPool('converters'), targets)).toBe('$42 CPA, 36% under the $65 goal');
    expect(poolStat('lead_builders', inPool('lead_builders'), targets)).toBe('$3.54 per lead, 12% under the $4.00 goal');
    expect(poolStat('reach', inPool('reach'), targets)).toBe('$12.58 per 1,000 impressions, 28% under average');
    expect(poolStat('test_again', inPool('test_again'), targets)).toBe('$74 CPA, 13% over goal, first campaign');
    expect(poolStat('dont_rebook', inPool('dont_rebook'), targets)).toBe('$119 CPA, 83% over goal, missed all three');
  });

  it('marks the metric that placed each creator, for the outlined cell', () => {
    const decided = Object.fromEntries(rows.map((r) => [r.creator.handle, r.decidedBy]));
    expect(decided).toMatchObject({ '@theskinnurse': 'cpa', '@budgetbeautyb': 'cpl', '@sunlit.sam': 'cpm', '@marco.minimal': 'cpa' });
  });
});

describe('verdict wording', () => {
  const fake = (cpa: number, fee = 1000) => ({ ...rows[0]!, cpa, creator: { ...rows[0]!.creator, fee_usd: fee }, result: { ...rows[0]!.result, purchases: Math.round(fee / cpa) } });
  it('beats outright, and costs more when even the rest miss', () => {
    expect(verdict([fake(50)], 65).headline).toBe('Creators beat paid social by 23%.');
    expect(verdict([fake(100)], 65).headline).toBe('Creators cost more than paid social: 54% over the goal.');
  });
});

describe('custom pools', () => {
  it('previews the design’s sign-up pool: @theskinnurse beats it but is already a Converter, so it’s empty', () => {
    const p = customPreview(brief, results, roster, [], signUps);
    expect(p.beats).toEqual([{ handle: '@theskinnurse', value: '$7.89', placedIn: 'converters' }]);
    expect(p.members).toEqual([]);
  });

  it('takes creators when checked first, before Converters', () => {
    const p = customPreview(brief, results, roster, [], { ...signUps, after: 'first' });
    expect(p.members).toEqual(['@theskinnurse']);
    const { rows: withFirst } = computeResults(brief, results, roster, [{ ...signUps, after: 'first' }]);
    expect(withFirst.find((r) => r.creator.handle === '@theskinnurse')).toMatchObject({ pool: 'custom-signups', decidedBy: 'custom' });
  });

  it('treats higher-is-better metrics the right way round', () => {
    // DM-to-purchase: @calm.complexion 33/398 = 8.3%; beats a 7% target only at 7.7% or more.
    const p = customPreview(brief, results, roster, [], { ...signUps, metric: 'dm_to_purchase', target: 0.07, after: 'first' });
    expect(p.members).toContain('@calm.complexion');
  });
});

describe('funnel', () => {
  it('matches the design’s campaign totals and rates', () => {
    const total = funnel(campaignTotals(rows));
    expect(total.impressions.count).toBe(1_576_000);
    expect(total.comments).toEqual({ count: 17_680, rate: expect.closeTo(0.0112, 4) });
    expect(total.leads.count).toBe(6_432);
    expect(total.leads.rate).toBeCloseTo(0.364, 3);
    expect(total.clicks.rate).toBeCloseTo(0.436, 3);
    expect(total.purchases).toEqual({ count: 415, rate: expect.closeTo(0.148, 3) });
  });

  it('finds the outlier’s weakest step: only 12.8% of @sunlit.sam’s comments became leads', () => {
    const sam = rows.find((r) => r.creator.handle === '@sunlit.sam')!;
    const w = weakestStep(sam, rows)!;
    expect(w.step).toBe('leads');
    expect(w.rate).toBeCloseTo(0.128, 3);
    expect(w.campaignRate).toBeCloseTo(0.364, 3);
  });
});
