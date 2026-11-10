import type { CampaignSummary, Creator } from '../data/schema';

/**
 * Campaigns home rows (docs/UX_SPEC.md §6): each campaign's step, the one thing it needs next, creators,
 * committed spend against budget, and the result once there is one.
 */
export type CampaignState = 'drafting' | 'live' | 'finished';

export interface HomeRow {
  id: string;
  name: string;
  /** 1–5: Brief, Roster, Drafts, Status, Readout. */
  step: number;
  next: string;
  needsYou: boolean;
  creators: number | null;
  committed: number;
  budget: number;
  result: { text: string; tone: 'good' | 'warn' } | null;
}

export const STEP_NAMES = ['Brief', 'Roster', 'Drafts', 'Creator status', 'Readout ready'];

/** Brief and Roster are drafting; Drafts and Creator status are live; a campaign with a readout is finished. */
export function stateOf(step: number): CampaignState {
  if (step >= 5) return 'finished';
  if (step >= 3) return 'live';
  return 'drafting';
}

export function summaryRow(c: CampaignSummary): HomeRow {
  return {
    id: c.id,
    name: c.name,
    step: c.step ?? 1,
    next: c.next_for_you ?? '',
    needsYou: c.needs_you ?? false,
    creators: c.creators ?? null,
    committed: c.committed_usd ?? 0,
    budget: c.budget_usd ?? 0,
    result: null,
  };
}

/** The sample campaign, live from the app: its picks, budget, readout result, and whether pools are saved. */
export function sampleRow(input: {
  id: string;
  name: string;
  picked: Creator[];
  budget: number;
  blendedCpa: number;
  goal: number;
  poolsSaved: boolean;
}): HomeRow {
  const over = input.blendedCpa > input.goal;
  return {
    id: input.id,
    name: input.name,
    step: 5,
    next: input.poolsSaved ? 'Pools saved. Start the next campaign from what worked' : 'Save pools from the readout',
    needsYou: false,
    creators: input.picked.length,
    committed: input.picked.reduce((s, c) => s + c.fee_usd, 0),
    budget: input.budget,
    result: { text: `$${Math.round(input.blendedCpa)} CPA vs $${Math.round(input.goal)} goal`, tone: over ? 'warn' : 'good' },
  };
}

/** A campaign started this session: in Brief until creators are picked, then Roster. */
export function startedRow(input: { id: string; name: string; picked: Creator[]; budget: number; hasOffer: boolean }): HomeRow {
  const step = input.picked.length > 0 ? 2 : 1;
  return {
    id: input.id,
    name: input.name,
    step,
    next: step === 1 ? (input.hasOffer ? 'Pick creators' : 'Finish the brief: offer and posting window') : 'Draft messages for your picks',
    needsYou: false,
    creators: input.picked.length || null,
    committed: input.picked.reduce((s, c) => s + c.fee_usd, 0),
    budget: input.budget,
    result: null,
  };
}

export const FILTERS = {
  needs_you: { label: 'Needs you', test: (r: HomeRow) => r.needsYou },
  live: { label: 'Live', test: (r: HomeRow) => stateOf(r.step) === 'live' },
  finished: { label: 'Finished', test: (r: HomeRow) => stateOf(r.step) === 'finished' },
  all: { label: 'All', test: () => true },
} as const;
export type FilterKey = keyof typeof FILTERS;
