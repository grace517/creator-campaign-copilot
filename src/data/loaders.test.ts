import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brandKit, brief, cachedStarters, demoState, poolsConfig, results, roster } from './index';
import { parseBrief, parseRoster } from './parse';

const dataDir = join(__dirname, '../../data');

describe('data loaders', () => {
  it('has a loader for every data file', () => {
    const walk = (dir: string, prefix = ''): string[] =>
      readdirSync(dir).flatMap((f) =>
        statSync(join(dir, f)).isDirectory() ? walk(join(dir, f), `${prefix}${f}/`) : [`${prefix}${f}`],
      );
    const files = walk(dataDir).filter((f) => f !== 'README.md').sort();
    expect(files).toEqual([
      'brand_kit.json',
      'brief.json',
      'cached/claim_judgments.json',
      'cached/starter_dms.json',
      'demo_state.json',
      'pools.json',
      'results.csv',
      'roster.csv',
    ]);
  });

  it('parses brief.json', () => {
    expect(brief.product).toBe('Barrier Repair Serum');
    expect(brief.paid_social_cpa_benchmark_usd).toBe(65);
    expect(brief.secondary_goal).toEqual({ metric: 'cpl_usd', target: 4 });
    expect(brief).not.toHaveProperty('_note');
  });

  it('parses roster.csv, including quoted commas, percentages, and new creators', () => {
    expect(roster).toHaveLength(10);
    const dana = roster.find((c) => c.handle === '@dewy.dana')!;
    expect(dana.past_engagement_rate).toBeCloseTo(0.048);
    expect(dana.past_cpa_usd).toBe(50);
    expect(dana.is_backup).toBe(false);
    const marco = roster.find((c) => c.handle === '@marco.minimal')!;
    expect(marco.past_dm_sample).toBe('Here\'s the one. Simple, no fragrance. Link below.');
    expect(marco.sample_captions[0]).toBe('keeping it simple: wash, moisturize, SPF. that\'s the post.');
    const gia = roster.find((c) => c.handle === '@glow.with.gia')!;
    expect(gia).toMatchObject({ past_campaigns: 0, past_cpa_usd: null, past_dm_sample: null, past_dm_count: 0 });
    expect(new Set(roster.map((c) => c.code)).size).toBe(roster.length);
  });

  it('parses results.csv with every result matching a rostered creator', () => {
    expect(results).toHaveLength(8);
    const handles = new Set(roster.map((c) => c.handle));
    for (const r of results) expect(handles).toContain(r.handle);
    expect(results.reduce((s, r) => s + r.purchases, 0)).toBe(415);
  });

  it('parses pools.json', () => {
    expect(poolsConfig.order.map((p) => p.id)).toEqual([
      'converters',
      'lead_builders',
      'reach',
      'test_again',
      'dont_rebook',
    ]);
  });

  it('parses demo_state.json', () => {
    expect(demoState.drafts_snapshot).toHaveLength(8);
    expect(demoState.status_snapshot.today).toBe('2026-11-30');
  });

  it('parses brand_kit.json', () => {
    expect(brandKit.voice).toBe('Warm, plain-spoken, ingredient-literate');
    expect(brandKit.products.map((p) => p.name)).toEqual(['Barrier Repair Serum', 'Daily Gel Cleanser', 'Overnight Cream']);
    expect(brandKit.products[0]!.link).toBe(brief.link);
  });

  it('parses cached/starter_dms.json, written for the sample brief and rostered creators', () => {
    expect(cachedStarters.written_for).toEqual({ product: brief.product, offer: brief.offer, link: brief.link });
    const handles = new Set(roster.map((c) => c.handle));
    for (const s of cachedStarters.starters) expect(handles).toContain(s.handle);
  });

  it('fails loudly, naming the file and field, on bad data', () => {
    const bad = readFileSync(join(dataDir, 'brief.json'), 'utf8').replace('"dm_max_chars": 500', '"dm_max_chars": "500"');
    expect(() => parseBrief(bad)).toThrow(/brief\.json: dm_max_chars/);
    const csv = readFileSync(join(dataDir, 'roster.csv'), 'utf8').replace('182000', 'lots');
    expect(() => parseRoster(csv)).toThrow(/roster\.csv row 2/);
  });
});
