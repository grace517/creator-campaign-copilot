import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { SAMPLE_CAMPAIGN_ID, brief as seedBrief } from '../data';
import { LIVE_FIELDS, useBrandKit, type BrandKitValues, type LiveField } from './BrandKitContext';
import type { CampaignBrief } from './brief';
import { useCampaignId } from './CampaignsContext';

/**
 * Each campaign's brief, held in memory (no database in v1). A campaign stores its own fields; claims, the
 * disclosure tag, and the DM length limit come live from the brand kit, so a brand-kit edit changes every
 * brief and every check.
 */
type CampaignFields = Omit<CampaignBrief, LiveField>;

interface BriefState {
  /** The brief for a campaign, brand-kit fields included. */
  briefFor: (id: string) => CampaignBrief;
  updateFor: (id: string, patch: Partial<CampaignFields>) => void;
}

const BriefContext = createContext<BriefState | null>(null);

const withoutLive = (b: CampaignBrief): CampaignFields => {
  const copy: Partial<CampaignBrief> = { ...b };
  for (const k of LIVE_FIELDS) delete copy[k];
  return copy as CampaignFields;
};

/** A new campaign starts from the brand kit: its first product, goals, and the sample's defaults for the rest. */
export function newCampaignFields(kit: BrandKitValues, name: string): CampaignFields {
  const product = kit.products[0]!;
  return {
    ...withoutLive(seedBrief),
    campaign_name: name,
    product: product.name,
    offer: product.default_offer,
    link: product.link,
    paid_social_cpa_benchmark_usd: kit.paid_social_cpa_benchmark_usd,
    secondary_goal: kit.secondary_goal,
  };
}

export function BriefProvider({ children }: { children: ReactNode }) {
  const { kit } = useBrandKit();
  const [fields, setFields] = useState<ReadonlyMap<string, CampaignFields>>(
    () => new Map([[SAMPLE_CAMPAIGN_ID, withoutLive(seedBrief)]]),
  );
  const briefFor = useCallback(
    (id: string): CampaignBrief => {
      const f = fields.get(id) ?? newCampaignFields(kit, id);
      return {
        ...f,
        approved_claims: kit.approved_claims,
        banned_claims: kit.banned_claims,
        disclosure: kit.disclosure,
        dm_max_chars: kit.dm_max_chars,
      };
    },
    [fields, kit],
  );
  const value = useMemo<BriefState>(
    () => ({
      briefFor,
      updateFor: (id, patch) =>
        setFields((m) => new Map(m).set(id, { ...(m.get(id) ?? newCampaignFields(kit, id)), ...patch })),
    }),
    [briefFor, kit],
  );
  return <BriefContext.Provider value={value}>{children}</BriefContext.Provider>;
}

function useBriefState(): BriefState {
  const ctx = useContext(BriefContext);
  if (!ctx) throw new Error('useBrief must be used inside <BriefProvider>');
  return ctx;
}

/** The current campaign's brief (set by CampaignLayout), or the sample campaign's outside one. */
export function useBrief(): { brief: CampaignBrief; update: (patch: Partial<CampaignFields>) => void } {
  const id = useCampaignId();
  const { briefFor, updateFor } = useBriefState();
  return { brief: briefFor(id), update: (patch) => updateFor(id, patch) };
}

/** Briefs for any campaign, for screens outside one (Campaigns home). */
export function useBriefs(): BriefState {
  return useBriefState();
}
