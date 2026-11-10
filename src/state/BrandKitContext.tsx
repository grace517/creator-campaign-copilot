import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { brandKit as seedKit, brief as seedBrief } from '../data';
import type { BrandKit } from '../data/schema';
import type { CampaignBrief } from './brief';

/**
 * The brand kit, set once (docs/UX_SPEC.md §8). Claims, the disclosure tag, and the DM length limit are live:
 * every campaign's brief reads them from here, so an edit changes every check. Goals and products seed new
 * briefs; a campaign already running keeps the goals it was briefed with.
 */
export interface BrandKitValues {
  voice: string;
  disclosure: string;
  disclosure_placement: string;
  dm_max_chars: number;
  approved_claims: string[];
  banned_claims: string[];
  paid_social_cpa_benchmark_usd: number;
  secondary_goal: CampaignBrief['secondary_goal'];
  products: BrandKit['products'];
  /** ISO date of the last edit, or "now" after an edit this session. */
  last_changed: string;
}

/** Fields every brief reads from the brand kit, live. */
export const LIVE_FIELDS = ['approved_claims', 'banned_claims', 'disclosure', 'dm_max_chars'] as const;
export type LiveField = (typeof LIVE_FIELDS)[number];

interface BrandKitState {
  kit: BrandKitValues;
  update: (patch: Partial<Omit<BrandKitValues, 'last_changed'>>) => void;
}

export const SEED_KIT: BrandKitValues = {
  voice: seedKit.voice,
  disclosure: seedBrief.disclosure,
  disclosure_placement: seedKit.disclosure_placement,
  dm_max_chars: seedBrief.dm_max_chars,
  approved_claims: seedBrief.approved_claims,
  banned_claims: seedBrief.banned_claims,
  paid_social_cpa_benchmark_usd: seedBrief.paid_social_cpa_benchmark_usd,
  secondary_goal: seedBrief.secondary_goal,
  products: seedKit.products,
  last_changed: seedKit.last_changed,
};

const BrandKitContext = createContext<BrandKitState | null>(null);

export function BrandKitProvider({ children }: { children: ReactNode }) {
  const [kit, setKit] = useState<BrandKitValues>(SEED_KIT);
  const value = useMemo<BrandKitState>(
    () => ({ kit, update: (patch) => setKit((k) => ({ ...k, ...patch, last_changed: 'now' })) }),
    [kit],
  );
  return <BrandKitContext.Provider value={value}>{children}</BrandKitContext.Provider>;
}

export function useBrandKit(): BrandKitState {
  const ctx = useContext(BrandKitContext);
  if (!ctx) throw new Error('useBrandKit must be used inside <BrandKitProvider>');
  return ctx;
}
