import { describe, expect, it } from 'vitest';
import { brief, poolsConfig, results, roster } from '../data';
import { assignPools, campaignTargets, cpsFromGoal, groupByPool, standing } from './pools';

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
    // No sign-up target in the brief, so the campaign average: $27,500 / 1,876 sign-ups.
    expect(t.cps_usd).toBeCloseTo(14.66, 2);
    expect(t.cpm_usd).toBeCloseTo(17.45, 2); // $27,500 fees / 1,576,000 impressions
  });
});

describe('sign-up goal', () => {
  it('uses the brief’s sign-up target when one is set, and List builders fills', () => {
    const withTarget = { ...brief, secondary_goal: { metric: 'email_sms_signups' as const, target: 17 } };
    expect(cpsFromGoal(withTarget)).toBe(true);
    expect(campaignTargets(withTarget, results, roster).cps_usd).toBe(17);
    // @budgetbeautyb: $1,800 / 118 sign-ups = $15.25, 10% or more under $17. Their CPA ($69) isn't beat.
    expect(groupByPool(assignPools(withTarget, results, roster)).list_builders).toEqual(['@budgetbeautyb']);
  });

  it('falls back to the campaign average for reach, or with no sign-up target', () => {
    expect(cpsFromGoal(brief)).toBe(false);
    expect(cpsFromGoal({ ...brief, secondary_goal: { metric: 'reach', target: null } })).toBe(false);
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
