import type { CampaignBrief } from '../state/brief';

/**
 * The exact message checks, in code (docs/BUILD_PLAN.md, "Checks"). The model only judges what code can't:
 * paraphrased banned claims and claims not on the approved list (api/_lib/claimJudgment.ts).
 *
 * Check names match evals/cases.json: disclosure, link, keyword, length, banned_claim, unapproved_claim.
 * The Brief's preview groups banned and unapproved claims under one "Claims" chip (`claims`).
 */

export type CheckName = 'disclosure' | 'link' | 'keyword' | 'length' | 'banned_claim' | 'unapproved_claim' | 'claims';

export interface Check {
  name: CheckName;
  passed: boolean;
  /** One sentence a brand manager can read. Set only when the check fails. */
  reason?: string;
  /** The exact text that failed, when there is one, so the UI can highlight it. */
  phrase?: string;
}

type BriefRules = Pick<CampaignBrief, 'disclosure' | 'link' | 'code_param' | 'dm_max_chars' | 'approved_claims' | 'banned_claims'>;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Case-insensitive match of a phrase on word boundaries, with any run of spaces between words. */
const phraseRegex = (phrase: string) =>
  new RegExp(`(?<![\\w#])${phrase.trim().split(/\s+/).map(escape).join('\\s+')}(?![\\w])`, 'i');

/** Hashtag and written-out disclosures that count, besides the brand's own tag. */
const DISCLOSURES = ['#ad', '#sponsored', 'paid partnership'];

/** The DM link for a creator: link + "?code=" + code (docs/BUILD_PLAN.md). */
export function creatorLink(brief: Pick<CampaignBrief, 'link' | 'code_param'>, code: string): string {
  return `${brief.link}?${brief.code_param}=${code}`;
}

/** Links read without the scheme, as in the designs: fernway.example.com/serum?code=NURSE20. */
export const displayUrl = (url: string) => url.replace(/^https?:\/\//, '');

/**
 * Disclosure present: the text contains #ad, #sponsored, or "paid partnership" (any case), or the brand's own tag.
 * "#ad" must be a whole tag, so "#adorable" doesn't count.
 */
export function checkDisclosure(text: string, brief: Pick<CampaignBrief, 'disclosure'>): Check {
  const tags = new Set([brief.disclosure, ...DISCLOSURES].map((t) => t.toLowerCase()));
  const passed = [...tags].some((t) => phraseRegex(t).test(text));
  return passed
    ? { name: 'disclosure', passed }
    : { name: 'disclosure', passed, reason: `No disclosure: the message needs ${brief.disclosure} on its first line.` };
}

/**
 * Correct link: the DM contains the campaign link with this creator's code, whole. Fails on a missing link,
 * no code, another creator's code, a longer code, an extra parameter, or a different domain.
 */
export function checkLink(
  message: string,
  creator: { code: string },
  brief: Pick<CampaignBrief, 'link' | 'code_param'>,
): Check {
  const expected = creatorLink(brief, creator.code);
  const at = message.indexOf(expected);
  const next = at === -1 ? '' : (message[at + expected.length] ?? '');
  if (at !== -1 && !/[\w&=%/#-]/.test(next)) return { name: 'link', passed: true };
  const found = message.match(/https?:\/\/\S+/)?.[0]?.replace(/[.,!?)]+$/, '');
  return {
    name: 'link',
    passed: false,
    phrase: found,
    reason: !found
      ? `No link: add ${displayUrl(expected)} so followers can buy with this creator's code.`
      : found.replace(/\/$/, '') === brief.link
        ? `The link is missing this creator's code (?${brief.code_param}=${creator.code}), so the discount won't apply automatically and their purchases may not count toward their CPA. Suggested fix: restore the full link.`
        : `The link should be ${displayUrl(expected)}, so the code applies at checkout and purchases count to this creator.`,
  };
}

/** Correct keyword: the caption call to action contains the creator's code, which is also their comment keyword. */
export function checkKeyword(captionCta: string, creator: { code: string }): Check {
  if (new RegExp(`(?<![\\w])${escape(creator.code)}(?![\\w])`, 'i').test(captionCta)) {
    return { name: 'keyword', passed: true };
  }
  return {
    name: 'keyword',
    passed: false,
    reason: `The call to action should ask followers to comment ${creator.code}, this creator's keyword.`,
  };
}

/** Length: the DM is within the brief's limit. A message exactly at the limit passes. */
export function checkLength(message: string, brief: Pick<CampaignBrief, 'dm_max_chars'>): Check {
  const n = [...message].length; // count characters, not UTF-16 units, so emoji count once
  if (n <= brief.dm_max_chars) return { name: 'length', passed: true };
  return {
    name: 'length',
    passed: false,
    reason: `${n} characters; the limit is ${brief.dm_max_chars}. Cut ${n - brief.dm_max_chars}.`,
  };
}

/** Banned claims, exact phrases only (any case, any spacing). Paraphrases are the model's job. */
export function checkBannedExact(text: string, brief: Pick<CampaignBrief, 'banned_claims'>): Check {
  for (const claim of brief.banned_claims) {
    const m = text.match(phraseRegex(claim));
    if (m) {
      return { name: 'banned_claim', passed: false, phrase: m[0], reason: `Uses a banned claim: "${claim}".` };
    }
  }
  return { name: 'banned_claim', passed: true };
}

/**
 * The Brief preview's "Claims" chip for a starter: no exact banned phrase, and every claim the starter says it
 * used (`claims_used`, docs/PROMPTS.md call 1) is on the approved list.
 */
export function checkClaims(
  message: string,
  claimsUsed: string[],
  brief: Pick<CampaignBrief, 'approved_claims' | 'banned_claims'>,
): Check {
  const banned = checkBannedExact(message, brief);
  if (!banned.passed) return { ...banned, name: 'claims' };
  const approved = new Set(brief.approved_claims.map((c) => c.toLowerCase()));
  const unapproved = claimsUsed.find((c) => !approved.has(c.toLowerCase()));
  if (unapproved) {
    return { name: 'claims', passed: false, reason: `"${unapproved}" isn't on the approved claims list.` };
  }
  return { name: 'claims', passed: true };
}

/** Every exact check on a DM and, when given, its caption call to action. */
export function exactChecks(
  input: { dm: string; captionCta?: string; code: string },
  brief: BriefRules,
): Check[] {
  const checks = [
    checkDisclosure(input.dm, brief),
    checkLink(input.dm, input, brief),
    checkLength(input.dm, brief),
    checkBannedExact(input.dm, brief),
  ];
  if (input.captionCta !== undefined) {
    checks.push(
      { ...checkDisclosure(input.captionCta, brief), reason: 'The caption call to action needs a disclosure too.' },
      checkKeyword(input.captionCta, input),
      checkBannedExact(input.captionCta, brief),
    );
  }
  return checks.map((c) => (c.passed ? { name: c.name, passed: true } : c));
}

/** Exact checks on a caption call to action alone (eval caption cases). */
export function captionChecks(captionCta: string, code: string, brief: BriefRules): Check[] {
  return [checkDisclosure(captionCta, brief), checkKeyword(captionCta, { code }), checkBannedExact(captionCta, brief)];
}
