import type { Creator } from '../data/schema';
import type { CampaignBrief } from '../state/brief';

/**
 * The exact checks the Brief's starter preview shows as chips: disclosure, claims, link.
 * feat/04-checks adds keyword and length, the model's claim judgment, and the eval runner.
 */

export interface Check {
  name: 'disclosure' | 'claims' | 'link';
  passed: boolean;
  /** One sentence a brand manager can read. Set only when the check fails. */
  reason?: string;
}

const DISCLOSURES = ['#ad', '#sponsored', 'paid partnership'];

/** The DM link for a creator: link + "?code=" + code (docs/BUILD_PLAN.md). */
export function creatorLink(brief: Pick<CampaignBrief, 'link' | 'code_param'>, code: string): string {
  return `${brief.link}?${brief.code_param}=${code}`;
}

export function checkDisclosure(message: string, brief: Pick<CampaignBrief, 'disclosure'>): Check {
  const lower = message.toLowerCase();
  const tags = new Set([brief.disclosure.toLowerCase(), ...DISCLOSURES]);
  const passed = [...tags].some((t) => lower.includes(t));
  return passed
    ? { name: 'disclosure', passed }
    : { name: 'disclosure', passed, reason: `No disclosure: the message needs ${brief.disclosure} on its first line.` };
}

/**
 * Exact banned phrases in the message, and any claim the starter says it used that isn't on the approved list.
 * Paraphrased banned claims are the model's job (feat/04).
 */
export function checkClaims(
  message: string,
  claimsUsed: string[],
  brief: Pick<CampaignBrief, 'approved_claims' | 'banned_claims'>,
): Check {
  const lower = message.toLowerCase();
  const banned = brief.banned_claims.find((c) => lower.includes(c.toLowerCase()));
  if (banned) return { name: 'claims', passed: false, reason: `Uses a banned claim: "${banned}".` };
  const approved = new Set(brief.approved_claims.map((c) => c.toLowerCase()));
  const unapproved = claimsUsed.find((c) => !approved.has(c.toLowerCase()));
  if (unapproved) {
    return { name: 'claims', passed: false, reason: `"${unapproved}" isn't on the approved claims list.` };
  }
  return { name: 'claims', passed: true };
}

export function checkLink(
  message: string,
  creator: Pick<Creator, 'code'>,
  brief: Pick<CampaignBrief, 'link' | 'code_param'>,
): Check {
  const expected = creatorLink(brief, creator.code);
  // The link must appear whole: not followed by more characters that would change the URL.
  const at = message.indexOf(expected);
  const next = at === -1 ? '' : (message[at + expected.length] ?? '');
  if (at !== -1 && !/[\w&=%/-]/.test(next)) return { name: 'link', passed: true };
  return {
    name: 'link',
    passed: false,
    reason: `The link should be ${displayUrl(expected)}, so the code applies at checkout and purchases count to this creator.`,
  };
}

/** Links read without the scheme, as in the designs: fernway.example.com/serum?code=NURSE20. */
export const displayUrl = (url: string) => url.replace(/^https?:\/\//, '');
