import { describe, expect, it } from 'vitest';
import { SAMPLE_CAMPAIGN_ID, brief, demoState, results, roster, sampleCampaigns } from '../data';
import { FILTERS, sampleRow, startedRow, stateOf, summaryRow, type HomeRow } from './campaigns';
import { creatorRows, missedTwice, poolChanges } from './creators';
import { computeResults, verdict } from './readout';

const { rows: resultRows, targets } = computeResults(brief, results, roster);
const picked = roster.filter((c) => demoState.drafts_snapshot.some((d) => d.handle === c.handle));

describe('Campaigns home', () => {
  const sample = sampleRow({
    id: SAMPLE_CAMPAIGN_ID,
    name: 'Barrier Serum launch',
    picked,
    budget: brief.campaign_budget_usd,
    blendedCpa: verdict(resultRows, targets.cpa_usd).blendedCpa,
    goal: targets.cpa_usd,
    poolsSaved: false,
  });
  const rows: HomeRow[] = [sample, ...sampleCampaigns.filter((c) => c.id !== SAMPLE_CAMPAIGN_ID).map(summaryRow)];

  it('computes the sample campaign’s row as in the design', () => {
    expect(sample).toMatchObject({
      step: 5,
      next: 'Save pools from the readout',
      creators: 8,
      committed: 27_500,
      budget: 32_000,
      result: { text: '$66 CPA vs $65 goal', tone: 'warn' },
    });
  });

  it('counts the design’s filters: Needs you 2, Live 2, Finished 1, All 4', () => {
    const count = (k: keyof typeof FILTERS) => rows.filter(FILTERS[k].test).length;
    expect([count('needs_you'), count('live'), count('finished'), count('all')]).toEqual([2, 2, 1, 4]);
  });

  it('moves a started campaign from Brief to Roster once creators are picked', () => {
    expect(stateOf(1)).toBe('drafting');
    expect(startedRow({ id: 'x', name: 'New', picked: [], budget: 1000, hasOffer: true })).toMatchObject({ step: 1, next: 'Pick creators' });
    expect(startedRow({ id: 'x', name: 'New', picked: picked.slice(0, 2), budget: 1000, hasOffer: true })).toMatchObject({ step: 2, creators: 2 });
  });

  it('notes saved pools on the sample row', () => {
    expect(sampleRow({ id: 's', name: 's', picked, budget: 1, blendedCpa: 50, goal: 65, poolsSaved: true })).toMatchObject({
      next: 'Pools saved. Start the next campaign from what worked',
      result: { tone: 'good' },
    });
  });
});

describe('Creators and pools', () => {
  const rows = creatorRows(roster, resultRows, { name: 'Barrier Serum launch', month: 'Dec' });
  const row = (h: string) => rows.find((r) => r.creator.handle === h)!;

  it('shows each creator’s latest campaign, counting this one', () => {
    expect(rows).toHaveLength(10);
    expect(row('@theskinnurse')).toMatchObject({ pool: 'converters', campaigns: 3, lastCampaign: 'Barrier Serum launch, Dec' });
    expect(Math.round(row('@theskinnurse').lastCpa!)).toBe(35);
    expect(row('@calm.complexion').campaigns).toBe(2);
  });

  it('keeps creators who weren’t in the readout, without inventing a pool', () => {
    expect(row('@runwithrio')).toMatchObject({ pool: null, campaigns: 1, lastCpa: 140, lastCampaign: 'An earlier campaign' });
    expect(row('@lena.layers')).toMatchObject({ pool: null, campaigns: 0, lastCpa: null, lastCampaign: null });
  });

  it('shows @marco.minimal missing again, without claiming a first-campaign pool the data can’t support', () => {
    expect(missedTwice(resultRows, targets)).toEqual([
      {
        handle: '@marco.minimal',
        before: { pool: null, detail: 'first campaign, $115 CPA, missed CPA and cost per lead' },
        after: { pool: 'dont_rebook', detail: '$119 CPA, missed again' },
      },
    ]);
  });

  it('finds no other provable pool changes in the sample data', () => {
    // @calm.complexion and @nightshift.nia beat CPA on their first campaign and again on this one.
    expect(poolChanges(resultRows, targets)).toEqual([]);
  });
});
