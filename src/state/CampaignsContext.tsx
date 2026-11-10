import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { SAMPLE_CAMPAIGN_ID, sampleCampaigns } from '../data';

/**
 * Campaigns: the ones in data/campaigns.json, plus any the brand starts in this session (held in memory).
 * A started campaign has its own brief and picks; its Drafts, Status and Readout point to the sample campaign,
 * whose data is the only full set in v1.
 */
export interface CampaignRef {
  id: string;
  name: string;
  kind: 'sample' | 'summary' | 'started';
  /** The pool a started campaign's roster was picked from. */
  fromPool?: string;
}

interface CampaignsState {
  all: CampaignRef[];
  start: (opts: { fromPool?: string; poolName?: string }) => string;
}

const CampaignsContext = createContext<CampaignsState | null>(null);

export function CampaignsProvider({ children }: { children: ReactNode }) {
  const [started, setStarted] = useState<CampaignRef[]>([]);
  const value = useMemo<CampaignsState>(() => {
    const fromData: CampaignRef[] = sampleCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.id === SAMPLE_CAMPAIGN_ID ? 'sample' : 'summary',
    }));
    return {
      all: [...fromData, ...started],
      start: ({ fromPool, poolName }) => {
        const n = started.length + 1;
        const id = `new-campaign-${n}`;
        const name = poolName ? `New campaign from ${poolName}` : n === 1 ? 'New campaign' : `New campaign ${n}`;
        setStarted((s) => [...s, { id, name, kind: 'started', fromPool }]);
        return id;
      },
    };
  }, [started]);
  return <CampaignsContext.Provider value={value}>{children}</CampaignsContext.Provider>;
}

export function useCampaigns(): CampaignsState {
  const ctx = useContext(CampaignsContext);
  if (!ctx) throw new Error('useCampaigns must be used inside <CampaignsProvider>');
  return ctx;
}

/** The campaign the current screen shows. Set by CampaignLayout; screens outside a campaign get the sample. */
const CurrentCampaignContext = createContext<string>(SAMPLE_CAMPAIGN_ID);
export const CurrentCampaign = CurrentCampaignContext.Provider;
export const useCampaignId = () => useContext(CurrentCampaignContext);
