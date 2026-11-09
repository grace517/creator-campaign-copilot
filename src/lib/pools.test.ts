import { describe, expect, it } from 'vitest';
import { brief, poolsConfig, results, roster } from '../data';
import { assignPools, campaignTargets, groupByPool, standing } from './pools';

describe('pools from data/', () => {
  it('matches expected_sample_result in data/pools.json', () => {
    const grouped = groupByPool(assignPools(brief, results, roster));
    const sorted = (r: Record<string, string[]>) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k, [...v].sort()]));
    expect(sorted(grouped)).toEqual(sorted(poolsConfig.expected_sample_result));
  });

  it('puts each creator in exactly one pool', () => {
    const assignments = assignPools(brief, results, roster);
    expect(assignments.map((a) => a.handle).sort()).toEqual(results.map((r) => r.handle).sort());
  });

  it('uses the brief for CPA and CPL targets, and the campaign average for CPM', () => {
    const t = campaignTargets(brief, results, roster);
    expect(t.cpa_usd).toBe(65);
    expect(t.cpl_usd).toBe(4);
    expect(t.cpm_usd).toBeCloseTo(17.45, 2); // $27,500 fees / 1,576,000 impressions
  });
});

describe('standing', () => {
  it('lands exactly 90% and 110% of target in the right state', () => {
    expect(standing(90, 100)).toBe('beat');
    expect(standing(90.01, 100)).toBe('at_par');
    expect(standing(110, 100)).toBe('at_par');
    expect(standing(110.01, 100)).toBe('missed');
    expect(standing(null, 100)).toBeNull();
  });
});
