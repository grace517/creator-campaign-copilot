import { describe, expect, it } from 'vitest';
import { brief, cachedJudgments, cachedStarters, demoState, roster } from '../data';
import { NO_ACTIONS, buildRows, counts, sortRows, voiceText, type BrandActions } from './drafts';

const picks = new Set(demoState.drafts_snapshot.map((d) => d.handle));
const judgments = new Map(cachedJudgments.judgments.map(({ message, ...j }) => [message, j]));
const rows = (actions: BrandActions = NO_ACTIONS, p: ReadonlySet<string> = picks) =>
  sortRows(buildRows({ picks: p, roster, starters: cachedStarters, judgments, demo: demoState, brief, actions }));
const row = (h: string, actions?: BrandActions) => rows(actions).find((r) => r.creator.handle === h)!;

describe('the cached demo data', () => {
  it('has a model-written starter for every rostered creator, each passing every exact check', () => {
    expect(cachedStarters.source).toBe('model');
    expect(cachedStarters.starters.map((s) => s.handle).sort()).toEqual(roster.map((c) => c.handle).sort());
    expect(cachedStarters.starters.every((s) => s.failures.length === 0)).toBe(true);
  });

  it('has a claim judgment for every message the app shows that passes the exact checks', () => {
    for (const r of rows()) {
      if (r.checks.every((c) => c.passed)) expect(r.judgmentMissing, r.creator.handle).toBe(false);
    }
  });
});

describe('Drafts rows on the sample data', () => {
  it('flags @sunlit.sam’s edit as a banned claim, highlighting the phrase the model quoted', () => {
    const sam = row('@sunlit.sam');
    expect(sam).toMatchObject({ stage: 'edited', status: 'needs_fix', chip: 'Claims check failed', shareChanged: 0.4 });
    expect(sam.flagged.length).toBeGreaterThan(0);
    for (const p of sam.flagged) expect(sam.message).toContain(p);
    expect(sam.judgment?.findings[0]?.type).toBe('banned_paraphrase');
  });

  it('fails @budgetbeautyb’s edit on the exact link check, without asking the model', () => {
    const b = row('@budgetbeautyb');
    expect(b).toMatchObject({ status: 'needs_fix', chip: 'Link check failed', judgment: null, flagged: ['https://fernway.example.com/serum'] });
    expect(b.reasons[0]).toMatch(/missing this creator's code \(\?code=BUDGET20\)/);
  });

  it('passes creators who accepted the starter as-is, with "kept word for word"', () => {
    const nurse = row('@theskinnurse');
    expect(nurse).toMatchObject({ stage: 'accepted', status: 'passing', chip: 'All 6 checks pass' });
    expect(voiceText(nurse).text).toBe('Kept the starter word for word · voice from 3 past DMs');
  });

  it('keeps the expected failures from demo_state.json', () => {
    for (const d of demoState.drafts_snapshot.filter((d) => d.expected_fail?.length)) {
      expect(row(d.handle).status, d.handle).toBe('needs_fix');
    }
  });

  it('sorts problems first, then messages back from creators, then ones still with the creator', () => {
    const order = rows().map((r) => r.status);
    const rank = { needs_fix: 0, needs_person: 0, passing: 1, approved: 1, with_creator: 2 } as const;
    expect(order.map((s) => rank[s])).toEqual([...order.map((s) => rank[s])].sort());
    expect(counts(rows()).withCreator).toBe(3);
  });
});

describe('brand actions', () => {
  it('approves only passing rows, and an edit needs approving again', () => {
    const approved = { ...NO_ACTIONS, approved: new Set(['@theskinnurse', '@sunlit.sam']) };
    expect(row('@theskinnurse', approved).status).toBe('approved');
    expect(row('@sunlit.sam', approved).status).toBe('needs_fix'); // a failed check still blocks
  });

  it('re-runs the checks on a brand edit; new wording without a cached judgment needs a person until marked OK', () => {
    const text = '#ad Fragrance-free. 20% off your first order: https://fernway.example.com/serum?code=NURSE20';
    const edited = { ...NO_ACTIONS, edits: new Map([['@theskinnurse', text]]) };
    expect(row('@theskinnurse', edited)).toMatchObject({ message: text, status: 'needs_person', judgmentMissing: true });
    expect(row('@theskinnurse', { ...edited, markedOk: new Set([text]) }).status).toBe('passing');
    const broken = { ...NO_ACTIONS, edits: new Map([['@theskinnurse', 'It cures acne']]) };
    expect(row('@theskinnurse', broken).status).toBe('needs_fix');
  });

  it('sends a row back to the creator with the fix, and reminds only those not yet reminded', () => {
    const sent = { ...NO_ACTIONS, sentBack: new Map([['@sunlit.sam', 'Remove the breakouts claim.']]) };
    expect(row('@sunlit.sam', sent)).toMatchObject({ stage: 'with_creator', sentBackFix: 'Remove the breakouts claim.' });
    const before = counts(rows()).remindable;
    expect(counts(rows({ ...NO_ACTIONS, reminded: new Set(['@dewy.dana']) })).remindable).toBe(before - 1);
  });

  it('shows a newly picked creator with no demo history as still with the creator', () => {
    const lena = rows(NO_ACTIONS, new Set([...picks, '@lena.layers'])).find((r) => r.creator.handle === '@lena.layers')!;
    expect(lena).toMatchObject({ stage: 'with_creator', status: 'with_creator' });
  });
});
