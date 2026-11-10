/**
 * A brand's ruling on a phrase the claim check was unsure about. Made when a person marks a "Needs a person"
 * message OK. Each kind carries a principle, not just the phrase, so the check can apply the same reasoning to
 * different wording: sent with every later claim check as the brand's precedent (api/_lib/claimJudgment.ts).
 * Shared by the app and the API.
 */
export const RULING_KINDS = {
  audience: {
    label: 'It addresses an audience; it isn’t a claim',
    principle:
      'Addressing or naming who the message is speaking to (a group of followers, a skin type, a lifestyle) is not a product claim. Still judge anything the message says about the product itself.',
  },
  experience: {
    label: 'It’s the creator’s own experience; it isn’t a claim',
    principle:
      'A creator describing their own routine or experience, without saying what the product does for others, is not a product claim.',
  },
  approved_claim: {
    label: 'It’s an approved claim, reworded',
    principle: 'This wording is an acceptable rephrase of an approved claim.',
  },
} as const;

export type RulingKind = keyof typeof RULING_KINDS;

export interface Ruling {
  /** The exact phrase the check was unsure about. */
  phrase: string;
  ruling: RulingKind;
  /** Optional words from the person who ruled. */
  note?: string;
}
