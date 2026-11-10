import { describe, expect, it } from 'vitest';
import { brief, demoState, roster } from '../data';
import { backupsFor, buildStatus, groupCounts, summarySentence, type Swap } from './status';

const snap = demoState.status_snapshot;
const picks = new Set(demoState.drafts_snapshot.map((d) => d.handle));
const status = (extraSwaps: Swap[] = [], p: ReadonlySet<string> = picks) =>
  buildStatus({
    picks: p,
    roster,
    today: snap.today,
    readyDaysBefore: brief.ready_deadline_days_before_post,
    testDmSent: snap.test_dm_sent,
    swaps: [...snap.swaps, ...extraSwaps],
  });
const row = (h: string, rows = status()) => rows.find((r) => r.creator.handle === h)!;

describe('creator status on Nov 30, from the sample data', () => {
  it('puts each of the 8 creators in exactly one group: 3 ready, 1 on track, 2 waiting, 2 at risk', () => {
    expect(groupCounts(status())).toEqual({ ready: 3, on_track: 1, waiting: 2, at_risk: 2 });
    expect(summarySentence(status())).toEqual({
      lead: '3 of 8 creators are ready.',
      rest: '2 are at risk of missing their ready deadline.',
    });
  });

  it('shows @runwithrio, who declined and was replaced, without counting them', () => {
    expect(row('@runwithrio')).toMatchObject({
      group: null,
      reached: 0,
      replacedBy: '@calm.complexion',
      note: 'Declined. Replaced by @calm.complexion',
    });
    expect(row('@calm.complexion')).toMatchObject({ group: 'ready', note: 'Backup, swapped in Nov 27' });
  });

  it('flags the two at-risk creators with the step each is missing', () => {
    expect(row('@marco.minimal')).toMatchObject({
      group: 'at_risk',
      daysLeft: 0,
      missing: 'test_dm',
      reached: 3,
      note: 'Deadline today: test DM not sent',
    });
    expect(row('@sunlit.sam')).toMatchObject({
      group: 'at_risk',
      daysLeft: 1,
      missing: 'connect',
      reached: 2,
      note: 'Deadline tomorrow: not connected',
    });
  });

  it('waits on invited creators whose deadline is 2+ days away, and keeps the rest on track', () => {
    expect(row('@budgetbeautyb')).toMatchObject({ group: 'waiting', note: 'No reply yet. Deadline Dec 3' });
    expect(row('@glow.with.gia')).toMatchObject({ group: 'waiting', note: 'No reply yet. Deadline Dec 6' });
    expect(row('@nightshift.nia')).toMatchObject({ group: 'on_track', note: 'Deadline Dec 7' });
  });

  it('lists every creator in the campaign by post date', () => {
    expect(status().map((r) => r.creator.post_date)).toEqual([...status().map((r) => r.creator.post_date)].sort());
    expect(status()).toHaveLength(9);
  });
});

describe('swapping in a backup', () => {
  it('offers unpicked backups only', () => {
    expect(backupsFor(roster, picks, new Set()).map((c) => c.handle)).toEqual(['@lena.layers']);
  });

  it('replaces an at-risk creator: they stop counting, the backup joins in their group by their own state', () => {
    const swap = { declined: '@sunlit.sam', replaced_by: '@lena.layers', on: snap.today };
    const newPicks = new Set([...picks].filter((h) => h !== '@sunlit.sam').concat('@lena.layers'));
    const rows = status([swap], newPicks);
    expect(row('@sunlit.sam', rows)).toMatchObject({ group: null, note: 'Swapped out. Replaced by @lena.layers' });
    // Lena: connected, no test DM yet, posts Dec 12 so the deadline is Dec 9: on track.
    expect(row('@lena.layers', rows)).toMatchObject({ group: 'on_track', missing: 'test_dm', note: 'Backup, swapped in Nov 30' });
    expect(groupCounts(rows)).toEqual({ ready: 3, on_track: 2, waiting: 2, at_risk: 1 });
  });
});

describe('deadline edges', () => {
  it('treats a passed deadline as at risk', () => {
    const late = buildStatus({
      picks: new Set(['@budgetbeautyb']),
      roster,
      today: '2026-12-05',
      readyDaysBefore: 3,
      testDmSent: {},
      swaps: [],
    });
    expect(late[0]).toMatchObject({ group: 'at_risk', daysLeft: -2, note: 'Deadline passed Dec 3: no reply' });
  });
});
