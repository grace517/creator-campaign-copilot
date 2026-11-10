import type { CachedStarters, ClaimJudgment, Creator, DemoState } from '../data/schema';
import type { CampaignBrief } from '../state/brief';
import { exactChecks, type Check } from './checks';
import type { RulingKind } from './rulings';

/**
 * Drafts: one row per picked creator. The starter comes from the cache (demo mode); the creator's side (stage,
 * their edited DM, share changed) from demo_state.json; the brand's actions (approve, send back, remind, edit,
 * mark OK) from app state. Every version of a message is re-checked: exact checks in code, then the claim
 * judgment, read from the cache by exact text.
 */

export type Stage = 'with_creator' | 'edited' | 'accepted';
export type Status = 'with_creator' | 'passing' | 'needs_fix' | 'needs_person' | 'approved';

export interface BrandActions {
  approved: ReadonlySet<string>;
  reminded: ReadonlySet<string>;
  /** Handle → the fix sent back to the creator. The row returns to "with creator". */
  sentBack: ReadonlyMap<string, string>;
  /** Handle → the brand's own edit of the message. */
  edits: ReadonlyMap<string, string>;
  /**
   * Message → a person's ruling when the claim check was unsure or couldn't run. The phrases become precedent for
   * later claim checks (see learnedRulings).
   */
  rulings: ReadonlyMap<string, MessageRuling>;
}

export interface MessageRuling {
  handle: string;
  /** The phrases the check was unsure about; empty when it never ran (a brand edit in demo mode). */
  phrases: string[];
  ruling: RulingKind;
  note?: string;
}

export const NO_ACTIONS: BrandActions = {
  approved: new Set(),
  reminded: new Set(),
  sentBack: new Map(),
  edits: new Map(),
  rulings: new Map(),
};

export interface DraftRow {
  creator: Creator;
  stage: Stage;
  /** The message under review: the brand's edit, the creator's edit, or the starter. */
  message: string;
  starter: string;
  captionCta: string;
  shareChanged: number | null;
  checks: Check[];
  /** null when the exact checks failed (the judgment runs after they pass) or there's no cached judgment. */
  judgment: ClaimJudgment | null;
  /** Exact checks passed but no judgment exists for this text (demo mode, new wording). */
  judgmentMissing: boolean;
  status: Status;
  /** Phrases to highlight in the message, in order of appearance, when checks name them. */
  flagged: string[];
  /** The claim check couldn't decide and no person has marked it OK: "Needs a person", including on a starter. */
  unsure: boolean;
  /** One explanation per failure, with the suggested fix. */
  reasons: string[];
  /** "Claims check failed", "All 6 checks pass", … */
  chip: string;
  sentBackFix: string | null;
  reminded: boolean;
  /** A person's ruling that cleared "Needs a person" on this exact message. */
  ruling: MessageRuling | null;
}

const CHECK_LABEL: Record<string, string> = {
  disclosure: 'Disclosure',
  link: 'Link',
  keyword: 'Keyword',
  length: 'Length',
  banned_claim: 'Claims',
  unapproved_claim: 'Claims',
  claims: 'Claims',
};

export function buildRows(input: {
  picks: ReadonlySet<string>;
  roster: Creator[];
  starters: CachedStarters;
  judgments: ReadonlyMap<string, ClaimJudgment>;
  demo: DemoState;
  brief: CampaignBrief;
  actions: BrandActions;
}): DraftRow[] {
  const { roster, starters, judgments, demo, brief, actions } = input;
  const snapshot = new Map(demo.drafts_snapshot.map((d, i) => [d.handle, { ...d, order: i }]));
  const picked = roster
    .filter((c) => input.picks.has(c.handle))
    .sort((a, b) => (snapshot.get(a.handle)?.order ?? 99) - (snapshot.get(b.handle)?.order ?? 99));

  return picked.flatMap((creator) => {
    const cached = starters.starters.find((s) => s.handle === creator.handle);
    if (!cached) return [];
    const snap = snapshot.get(creator.handle);
    const sentBackFix = actions.sentBack.get(creator.handle) ?? null;
    const stage: Stage = sentBackFix ? 'with_creator' : (snap?.stage ?? 'with_creator');
    const creatorDm = stage === 'edited' ? (snap?.creator_dm ?? cached.dm) : cached.dm;
    const message = actions.edits.get(creator.handle) ?? creatorDm;

    const checks = exactChecks({ dm: message, captionCta: cached.caption_cta, code: creator.code }, brief);
    const failedExact = checks.filter((c) => !c.passed);
    const judgment = failedExact.length === 0 ? (judgments.get(message) ?? null) : null;
    const judgmentMissing = failedExact.length === 0 && judgment === null;
    const ruling = actions.rulings.get(message) ?? null;
    const okByPerson = ruling !== null;

    const claimFail = judgment?.verdict === 'fail';
    const unsure = !okByPerson && (judgment?.verdict === 'unsure' || judgmentMissing);
    const failing = failedExact.length > 0 || claimFail;

    let status: Status;
    if (stage === 'with_creator') status = 'with_creator';
    else if (failing) status = 'needs_fix';
    else if (unsure) status = 'needs_person';
    else if (actions.approved.has(creator.handle)) status = 'approved';
    else status = 'passing';

    const reasons = [
      ...failedExact.map((c) => c.reason ?? `${CHECK_LABEL[c.name]} check failed.`),
      ...(judgment?.verdict === 'fail' || (judgment?.verdict === 'unsure' && !okByPerson)
        ? judgment.findings.map((f) => `${f.reason}${f.suggested_fix ? ` Suggested fix: “${f.suggested_fix}”, from the approved claims.` : ''}`)
        : []),
    ];
    if (unsure && judgment?.findings.length === 0) reasons.push(judgment.note ?? 'The claim check couldn’t decide.');
    if (judgmentMissing && !okByPerson) {
      reasons.push('This wording hasn’t been through the claim check: demo mode only has checks for the saved messages. Read it and mark it OK, or send it back.');
    }

    // Every phrase a check names, in order of appearance, deduplicated and present in the message.
    const flagged = [
      ...failedExact.flatMap((c) => (c.phrase ? [c.phrase] : [])),
      ...(judgment && judgment.verdict !== 'pass' && !(okByPerson && judgment.verdict === 'unsure') ? judgment.findings.map((f) => f.phrase) : []),
    ]
      .filter((p, i, all) => p && message.includes(p) && all.indexOf(p) === i)
      .sort((a, b) => message.indexOf(a) - message.indexOf(b));

    const failedLabels = [...new Set([...failedExact.map((c) => CHECK_LABEL[c.name]), ...(claimFail ? ['Claims'] : [])])];
    const chip =
      status === 'approved'
        ? 'Approved'
        : failing
          ? `${failedLabels.join(' and ')} check${failedLabels.length > 1 ? 's' : ''} failed`
          : unsure
            ? 'Needs a person'
            : okByPerson && (judgment?.verdict === 'unsure' || judgmentMissing)
              ? 'Marked OK by you'
              : stage === 'with_creator'
                ? 'Starter passes all 6 checks'
                : 'All 6 checks pass';

    return [
      {
        creator,
        stage,
        message,
        starter: cached.dm,
        captionCta: cached.caption_cta,
        shareChanged: stage === 'edited' ? (snap?.share_changed ?? null) : stage === 'accepted' ? 0 : null,
        checks,
        judgment,
        judgmentMissing,
        status,
        flagged,
        unsure: unsure && !failing,
        reasons: status === 'with_creator' && !failing && !unsure ? [] : reasons,
        chip,
        sentBackFix,
        reminded: actions.reminded.has(creator.handle),
        ruling: okByPerson && (judgment?.verdict === 'unsure' || judgmentMissing) ? ruling : null,
      },
    ];
  });
}

const RANK: Record<Status, number> = { needs_fix: 0, needs_person: 0, passing: 1, approved: 1, with_creator: 2 };

/** Problems first, then messages back from creators, then ones still with the creator; data order within each. */
export const sortRows = (rows: DraftRow[]) =>
  rows.map((r, i) => ({ r, i })).sort((a, b) => RANK[a.r.status] - RANK[b.r.status] || a.i - b.i).map((x) => x.r);

export function counts(rows: DraftRow[]) {
  return {
    passing: rows.filter((r) => r.status === 'passing' || r.status === 'approved').length,
    needsFix: rows.filter((r) => r.status === 'needs_fix' || r.status === 'needs_person').length,
    withCreator: rows.filter((r) => r.status === 'with_creator').length,
    approvable: rows.filter((r) => r.status === 'passing').length,
    remindable: rows.filter((r) => r.status === 'with_creator' && !r.reminded).length,
  };
}

/** "Kept the starter word for word · voice from 3 past DMs", "Changed 40% of the starter · …", or the voice line alone. */
export function voiceText(row: Pick<DraftRow, 'stage' | 'shareChanged' | 'creator'>): { text: string; low: boolean } {
  const n = row.creator.past_dm_count;
  const source = n === 0 ? 'no past DMs, voice from captions' : `voice from ${n} past DM${n === 1 ? '' : 's'}`;
  if (row.stage === 'accepted') return { text: `Kept the starter word for word · ${source}`, low: false };
  if (row.stage === 'edited' && row.shareChanged !== null) {
    return { text: `Changed ${Math.round(row.shareChanged * 100)}% of the starter · ${source}`, low: false };
  }
  const low = n < 2;
  const text = n === 0 ? 'No past DMs, voice from captions, low confidence' : `Voice from ${n} past DM${n === 1 ? '' : 's'}${low ? ', low confidence' : ''}`;
  return { text, low };
}

/** Every phrase a person has ruled on, deduplicated: sent with each later claim check as the brand's precedent. */
export function learnedRulings(rulings: ReadonlyMap<string, MessageRuling>) {
  const seen = new Map<string, { phrase: string; ruling: RulingKind; note?: string; handle: string; message: string }>();
  for (const [message, r] of rulings) {
    for (const phrase of r.phrases) {
      if (!seen.has(phrase)) seen.set(phrase, { phrase, ruling: r.ruling, note: r.note, handle: r.handle, message });
    }
  }
  return [...seen.values()];
}
