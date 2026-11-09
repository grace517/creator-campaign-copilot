import { describe, expect, it } from 'vitest';
import { brief, demoState, roster } from '../data';
import type { Creator } from '../data/schema';
import {
  NO_FILTERS,
  blocker,
  cpaWarning,
  filterCreators,
  mixWarning,
  sortCreators,
  summarize,
} from './roster';

const seeded = new Set(demoState.drafts_snapshot.map((d) => d.handle));
const by = (h: string) => roster.find((c) => c.handle === h)!;
const handles = (cs: Creator[]) => cs.map((c) => c.handle);

describe('roster on the sample data', () => {
  it('seeds the 8 picks with $27,500 committed and 2 new against a limit of 2', () => {
    const s = summarize(roster, seeded, brief.campaign_budget_usd, brief.max_new_creators);
    expect(s).toEqual({
      committed: 27500,
      remaining: 4500,
      picked: 8,
      newPicked: 2,
      budgetState: 'ok',
      newState: 'ok',
    });
    expect(blocker(s, brief.max_new_creators)).toBeNull();
  });

  it('warns only on @sunlit.sam: 8x the benchmark, about 15 purchases', () => {
    const warned = roster.filter((c) => seeded.has(c.handle) && cpaWarning(c, 65));
    expect(handles(warned)).toEqual(['@sunlit.sam']);
    expect(cpaWarning(by('@sunlit.sam'), 65)).toEqual({ multiple: 8, expectedPurchases: 15 });
  });

  it('flags 5 of 8 skincare picks and names @runwithrio as the fix within $4,500', () => {
    const w = mixWarning(roster, seeded, 4500, 65)!;
    expect(w).toMatchObject({ group: 'skincare', count: 5, of: 8 });
    expect(handles(w.fixes)).toEqual(['@runwithrio']);
  });

  it('never suggests a fix that would trigger the CPA warning', () => {
    const withoutSam = new Set([...seeded].filter((h) => h !== '@sunlit.sam'));
    const w = mixWarning(roster, withoutSam, 12300, 65)!;
    expect(w).toMatchObject({ count: 5, of: 7 });
    expect(handles(w.fixes)).toEqual(['@runwithrio']);
  });

  it('sorts by past CPA by default, new creators last in roster order', () => {
    expect(handles(sortCreators(roster, 'cpa'))).toEqual([
      '@theskinnurse',
      '@calm.complexion',
      '@dewy.dana',
      '@nightshift.nia',
      '@marco.minimal',
      '@runwithrio',
      '@sunlit.sam',
      '@budgetbeautyb',
      '@glow.with.gia',
      '@lena.layers',
    ]);
  });
});

describe('summary thresholds', () => {
  it('turns amber at 90% of budget and blocks over it', () => {
    const picks = new Set(['@sunlit.sam']); // $7,800
    expect(summarize(roster, picks, 8600, 2).budgetState).toBe('near');
    expect(summarize(roster, picks, 8800, 2).budgetState).toBe('ok');
    const over = summarize(roster, picks, 7000, 2);
    expect(over.budgetState).toBe('over');
    expect(blocker(over, 2)).toBe('Over budget by $800. Unpick a creator to continue.');
  });

  it('blocks when new creators exceed the limit, and when nothing is picked', () => {
    const picks = new Set(['@budgetbeautyb', '@glow.with.gia', '@lena.layers']);
    expect(blocker(summarize(roster, picks, 32000, 2), 2)).toMatch(/3 new creators picked; your limit is 2/);
    expect(blocker(summarize(roster, new Set(), 32000, 2), 2)).toBe('Pick at least one creator.');
  });
});

describe('mix warning', () => {
  it('stays quiet at exactly half', () => {
    expect(mixWarning(roster, new Set(['@dewy.dana', '@runwithrio']), 10000, 65)).toBeNull();
  });
  it('drops fixes that do not fit the remaining budget', () => {
    expect(mixWarning(roster, seeded, 3000, 65)!.fixes).toEqual([]);
  });
});

describe('sort and filter', () => {
  it('sorts by fee, CPL, and followers', () => {
    expect(handles(sortCreators(roster, 'fee'))[0]).toBe('@lena.layers');
    expect(handles(sortCreators(roster, 'followers'))[0]).toBe('@sunlit.sam');
    expect(handles(sortCreators(roster, 'cpl')).slice(-3)).toEqual(['@budgetbeautyb', '@glow.with.gia', '@lena.layers']);
  });

  it('filters by niche, track record, backups, budget fit, and a handle list', () => {
    const f = (patch: Partial<typeof NO_FILTERS>) => handles(filterCreators(roster, { ...NO_FILTERS, ...patch }, seeded, 4500));
    expect(f({ niche: 'skincare' })).toEqual(['@dewy.dana', '@glow.with.gia', '@lena.layers']);
    expect(f({ track: 'new' })).toEqual(['@budgetbeautyb', '@glow.with.gia', '@lena.layers']);
    expect(f({ track: 'proven' })).toHaveLength(7);
    expect(f({ backupsOnly: true })).toEqual(['@calm.complexion', '@lena.layers']);
    // Unpicked: @runwithrio ($3,100) and @lena.layers ($1,100) fit $4,500; all 8 picks stay visible.
    expect(f({ fitsBudget: true })).toHaveLength(10);
    expect(handles(filterCreators(roster, { ...NO_FILTERS, fitsBudget: true }, seeded, 2000))).not.toContain('@runwithrio');
    expect(f({ only: ['@runwithrio'] })).toEqual(['@runwithrio']);
  });
});
