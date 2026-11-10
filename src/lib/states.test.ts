import { describe, expect, it, vi } from 'vitest';
import { results, roster } from '../data';
import { sortCreators } from './roster';
import { cpaBars, earlyResults, isFirstCampaign, timeLeft, withOneRetry, withoutHistory } from './states';

describe('first campaign', () => {
  it('the sample roster has history; without it, every creator is new and fee is the only order', () => {
    expect(isFirstCampaign(roster)).toBe(false);
    const fresh = withoutHistory(roster);
    expect(isFirstCampaign(fresh)).toBe(true);
    expect(fresh.every((c) => c.past_cpa_usd === null && c.past_cpl_usd === null)).toBe(true);
    const byFee = sortCreators(fresh, 'fee').map((c) => c.fee_usd);
    expect(byFee).toEqual([...byFee].sort((a, b) => a - b));
  });
});

describe('withOneRetry', () => {
  it('retries once, then returns the second try', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce('ok');
    await expect(withOneRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
  it('gives up after the second failure', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('down'));
    await expect(withOneRetry(fn)).rejects.toThrow('down');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('timeLeft', () => {
  it('estimates from the average so far', () => {
    expect(timeLeft(3, 8, 12_000)).toBe('About 20 seconds left');
    expect(timeLeft(1, 8, 20_000)).toBe('About 2 minutes left');
    expect(timeLeft(0, 8, 0)).toBeNull();
    expect(timeLeft(8, 8, 30_000)).toBeNull();
  });
});

describe('earlyResults', () => {
  it('on Dec 13, the 5 posts from Dec 6 or earlier have run 7 days; the last, Dec 11, settles Dec 18', () => {
    const e = earlyResults(results, roster, '2026-12-13');
    expect(e).toMatchObject({ settled: 5, total: 8, done: false });
    expect(e.last).toEqual({ handle: '@calm.complexion', posted: '2026-12-11', settles: '2026-12-18' });
    // dana, marco, sam, nurse, budget: $22,300 / 322 purchases
    expect(e.cpaSoFar).toBeCloseTo(69.25, 2);
  });
  it('is done once the last post settles', () => {
    expect(earlyResults(results, roster, '2026-12-18').done).toBe(true);
    expect(earlyResults(results, roster, '2026-12-01')).toMatchObject({ settled: 0, cpaSoFar: null });
  });
});

describe('cpaBars', () => {
  const rows = [
    { handle: '@a', cpa: 119, pool: 'dont_rebook' },
    { handle: '@b', cpa: 35, pool: 'converters' },
    { handle: '@out', cpa: 557, pool: 'reach' },
    { handle: '@none', cpa: null, pool: 'test_again' },
  ];
  it('ranks low to high, scales to 1.25× the highest in-range CPA, and caps outliers', () => {
    const { bars, goalAt } = cpaBars(rows, 65);
    expect(bars.map((b) => b.handle)).toEqual(['@b', '@a', '@out', '@none']);
    expect(goalAt).toBeCloseTo(65 / (119 * 1.25));
    expect(bars[1]!.width).toBeCloseTo(0.8);
    expect(bars.filter((b) => b.offScale).map((b) => b.handle)).toEqual(['@out', '@none']);
    expect(bars[2]!.width).toBe(1);
  });
});
