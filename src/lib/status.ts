import type { Creator, CreatorStatus } from '../data/schema';

/**
 * Creator status (docs/UX_SPEC.md §4): readiness groups, deadlines, the four-step pipeline, and swaps, computed from
 * roster.csv and demo_state.json's status_snapshot. Every creator lands in exactly one group, their most urgent.
 * Ready means accepted, connected, test DM arrived, and DM approved.
 */

export type Group = 'ready' | 'on_track' | 'waiting' | 'at_risk';
/** The one thing standing between a creator and ready. */
export type MissingStep = 'accept' | 'connect' | 'test_dm' | 'approve_dm';

export const GROUP_ORDER: Group[] = ['ready', 'on_track', 'waiting', 'at_risk'];

export interface Swap {
  declined: string;
  replaced_by: string;
  on: string;
}

export interface StatusRow {
  creator: Creator;
  /** 0 when declined; otherwise how many of invited, accepted, connected, ready are done (1–4). */
  reached: 0 | 1 | 2 | 3 | 4;
  /** null when declined and replaced: not counted in any group. */
  group: Group | null;
  deadline: string;
  /** Days from today to the ready deadline; negative when it has passed. */
  daysLeft: number;
  missing: MissingStep | null;
  replacedBy: string | null;
  swappedInOn: string | null;
  note: string;
  noteTone: 'ok' | 'warn' | 'bad' | 'muted';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const addDays = (iso: string, n: number) => new Date(day(iso) + n * 86_400_000).toISOString().slice(0, 10);
export const daysBetween = (from: string, to: string) => Math.round((day(to) - day(from)) / 86_400_000);
/** "2026-12-03" → "Dec 3". */
export const shortDate = (iso: string) => `${MONTHS[+iso.slice(5, 7) - 1]} ${+iso.slice(8, 10)}`;

const REACHED: Record<CreatorStatus, StatusRow['reached']> = { declined: 0, invited: 1, accepted: 2, connected: 3, ready: 4 };

export function missingStep(status: CreatorStatus, testDmSent: boolean): MissingStep | null {
  switch (status) {
    case 'invited':
      return 'accept';
    case 'accepted':
      return 'connect';
    case 'connected':
      return testDmSent ? 'approve_dm' : 'test_dm';
    default:
      return null;
  }
}

/** What's missing, in a sentence for the at-risk card. */
export const MISSING_TEXT: Record<MissingStep, string> = {
  accept: 'Invited, but hasn’t accepted yet.',
  connect: 'Accepted, but the Instagram account isn’t connected yet.',
  test_dm: 'Account connected, but the test DM hasn’t been sent.',
  approve_dm: 'Connected and tested, but the DM isn’t approved yet.',
};

/**
 * Where a creator finishes each step. Fictional sample links on example.com; the test DM has no link, since the
 * creator checks it by commenting their code from a second account.
 */
export function setupLink(step: MissingStep, code: string): string | null {
  const base = `https://copilot.example.com/creators/${code}`;
  switch (step) {
    case 'accept':
      return `${base}/invite`;
    case 'connect':
      return `${base}/connect`;
    case 'approve_dm':
      return `${base}/approve`;
    case 'test_dm':
      return null;
  }
}

/** The step as the nudge prompt names it (docs/PROMPTS.md call 3). */
export const STEP_FOR_PROMPT: Record<MissingStep, string> = {
  accept: 'accept the invitation',
  connect: 'connect their Instagram account',
  test_dm: 'send a test DM: comment their code on one of their posts from a second account and check the DM arrives',
  approve_dm: 'approve their DM',
};

/** Short form for the table note. */
const MISSING_SHORT: Record<MissingStep, string> = {
  accept: 'no reply',
  connect: 'not connected',
  test_dm: 'test DM not sent',
  approve_dm: 'DM not approved',
};

export function deadlineLabel(daysLeft: number, deadline: string): string {
  if (daysLeft < 0) return `Ready deadline passed ${shortDate(deadline)}`;
  if (daysLeft === 0) return 'Ready deadline today';
  if (daysLeft === 1) return 'Ready deadline tomorrow';
  return `Ready deadline ${shortDate(deadline)}`;
}

export function buildStatus(input: {
  picks: ReadonlySet<string>;
  roster: Creator[];
  today: string;
  readyDaysBefore: number;
  testDmSent: Readonly<Record<string, boolean>>;
  swaps: Swap[];
}): StatusRow[] {
  const { roster, today, readyDaysBefore, testDmSent, swaps } = input;
  const replaced = new Map(swaps.map((s) => [s.declined, s]));
  const swappedIn = new Map(swaps.map((s) => [s.replaced_by, s]));
  // Everyone in the campaign: the picks, plus anyone who left and was replaced (shown, not counted).
  const handles = new Set([...input.picks, ...replaced.keys()]);

  return roster
    .filter((c) => handles.has(c.handle))
    .map((creator): StatusRow => {
      const deadline = addDays(creator.post_date, -readyDaysBefore);
      const daysLeft = daysBetween(today, deadline);
      const swapOut = replaced.get(creator.handle) ?? null;
      const swapIn = swappedIn.get(creator.handle) ?? null;
      const status = creator.status;
      const missing = missingStep(status, testDmSent[creator.handle] ?? false);

      let group: Group | null;
      if (swapOut) group = null;
      else if (status === 'ready') group = 'ready';
      else if (daysLeft <= 1) group = 'at_risk';
      else if (status === 'invited') group = 'waiting';
      else group = 'on_track';

      let note = '';
      let noteTone: StatusRow['noteTone'] = 'muted';
      if (swapOut) {
        note = `${status === 'declined' ? 'Declined. ' : 'Swapped out. '}Replaced by ${swapOut.replaced_by}`;
        noteTone = 'bad';
      } else if (group === 'at_risk' && missing) {
        note = `${daysLeft < 0 ? `Deadline passed ${shortDate(deadline)}` : daysLeft === 0 ? 'Deadline today' : 'Deadline tomorrow'}: ${MISSING_SHORT[missing]}`;
        noteTone = 'warn';
      } else if (swapIn) {
        note = `Backup, swapped in ${shortDate(swapIn.on)}`;
        noteTone = 'ok';
      } else if (group === 'waiting') {
        note = `No reply yet. Deadline ${shortDate(deadline)}`;
      } else if (group === 'on_track') {
        note = `Deadline ${shortDate(deadline)}`;
      }

      return {
        creator,
        reached: REACHED[status],
        group,
        deadline,
        daysLeft,
        missing: group === 'ready' || swapOut ? null : missing,
        replacedBy: swapOut?.replaced_by ?? null,
        swappedInOn: swapIn?.on ?? null,
        note,
        noteTone,
      };
    })
    .sort((a, b) => a.creator.post_date.localeCompare(b.creator.post_date));
}

export function groupCounts(rows: StatusRow[]): Record<Group, number> {
  const counts: Record<Group, number> = { ready: 0, on_track: 0, waiting: 0, at_risk: 0 };
  for (const r of rows) if (r.group) counts[r.group]++;
  return counts;
}

/** "3 of 8 creators are ready." plus the at-risk clause, or the all-clear. */
export function summarySentence(rows: StatusRow[]): { lead: string; rest: string } {
  const c = groupCounts(rows);
  const total = GROUP_ORDER.reduce((s, g) => s + c[g], 0);
  const lead = c.ready === total ? `All ${total} creators are ready.` : `${c.ready} of ${total} creators are ready.`;
  const rest =
    c.at_risk === 0
      ? c.ready === total
        ? ''
        : 'No one is at risk of missing their ready deadline.'
      : `${c.at_risk} ${c.at_risk === 1 ? 'is' : 'are'} at risk of missing their ready deadline.`;
  return { lead, rest };
}

/** Unpicked backups who could step in, cheapest past CPA first, new creators last. */
export function backupsFor(roster: Creator[], picks: ReadonlySet<string>, swappedOut: ReadonlySet<string>): Creator[] {
  return roster
    .filter((c) => c.is_backup && !picks.has(c.handle) && !swappedOut.has(c.handle) && c.status !== 'declined')
    .sort((a, b) => (a.past_cpa_usd ?? Infinity) - (b.past_cpa_usd ?? Infinity));
}
