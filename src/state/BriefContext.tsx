import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { brief as seedBrief } from '../data';
import type { CampaignBrief } from './brief';

/** The campaign's brief, held in memory (no database in v1). Brief edits it; every other screen reads it. */
interface BriefState {
  brief: CampaignBrief;
  update: (patch: Partial<CampaignBrief>) => void;
}

const BriefContext = createContext<BriefState | null>(null);

export function BriefProvider({ children }: { children: ReactNode }) {
  const [brief, setBrief] = useState<CampaignBrief>(seedBrief);
  const value = useMemo(
    () => ({ brief, update: (patch: Partial<CampaignBrief>) => setBrief((b) => ({ ...b, ...patch })) }),
    [brief],
  );
  return <BriefContext.Provider value={value}>{children}</BriefContext.Provider>;
}

export function useBrief(): BriefState {
  const ctx = useContext(BriefContext);
  if (!ctx) throw new Error('useBrief must be used inside <BriefProvider>');
  return ctx;
}
