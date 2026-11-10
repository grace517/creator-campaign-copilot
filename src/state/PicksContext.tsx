import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { SAMPLE_CAMPAIGN_ID, demoState } from '../data';
import { useCampaignId } from './CampaignsContext';

/**
 * Which creators each campaign has picked, held in memory. The sample campaign is seeded with the 8 creators it
 * runs with (demo_state.json drafts_snapshot); a campaign started from a pool starts with that pool's creators.
 * `kept` holds creators whose CPA warning the brand dismissed with "Keep anyway".
 */
interface CampaignPicks {
  picks: ReadonlySet<string>;
  kept: ReadonlySet<string>;
}

interface PicksStore {
  get: (id: string) => CampaignPicks;
  set: (id: string, picks: Iterable<string>) => void;
  toggle: (id: string, handle: string) => void;
  keep: (id: string, handle: string) => void;
}

const EMPTY: CampaignPicks = { picks: new Set(), kept: new Set() };
const PicksContext = createContext<PicksStore | null>(null);

export function PicksProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<ReadonlyMap<string, CampaignPicks>>(
    () => new Map([[SAMPLE_CAMPAIGN_ID, { picks: new Set(demoState.drafts_snapshot.map((d) => d.handle)), kept: new Set() }]]),
  );
  const value = useMemo<PicksStore>(() => {
    const change = (id: string, f: (c: CampaignPicks) => CampaignPicks) =>
      setStore((m) => new Map(m).set(id, f(m.get(id) ?? EMPTY)));
    return {
      get: (id) => store.get(id) ?? EMPTY,
      set: (id, picks) => change(id, (c) => ({ ...c, picks: new Set(picks) })),
      toggle: (id, h) =>
        change(id, (c) => {
          const next = new Set(c.picks);
          if (next.has(h)) next.delete(h);
          else next.add(h);
          return { ...c, picks: next };
        }),
      keep: (id, h) => change(id, (c) => ({ ...c, kept: new Set(c.kept).add(h) })),
    };
  }, [store]);
  return <PicksContext.Provider value={value}>{children}</PicksContext.Provider>;
}

function usePicksStore(): PicksStore {
  const ctx = useContext(PicksContext);
  if (!ctx) throw new Error('usePicks must be used inside <PicksProvider>');
  return ctx;
}

/** The current campaign's picks (set by CampaignLayout), or the sample campaign's outside one. */
export function usePicks() {
  const id = useCampaignId();
  const store = usePicksStore();
  const { picks, kept } = store.get(id);
  return {
    picks,
    kept,
    toggle: (h: string) => store.toggle(id, h),
    keep: (h: string) => store.keep(id, h),
  };
}

/** Picks for any campaign, for screens outside one (Campaigns home, starting a campaign from a pool). */
export function useAllPicks(): Pick<PicksStore, 'get' | 'set'> {
  return usePicksStore();
}
