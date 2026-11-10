import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { demoState } from '../data';

/**
 * Which creators are picked for the campaign, held in memory. Seeded with the 8 creators the sample campaign
 * runs with (demo_state.json drafts_snapshot), so Roster opens as designed and Drafts gets the same list.
 * `kept` holds creators whose CPA warning the brand dismissed with "Keep anyway".
 */
interface PicksState {
  picks: ReadonlySet<string>;
  kept: ReadonlySet<string>;
  toggle: (handle: string) => void;
  keep: (handle: string) => void;
}

const PicksContext = createContext<PicksState | null>(null);

export function PicksProvider({ children }: { children: ReactNode }) {
  const [picks, setPicks] = useState<ReadonlySet<string>>(
    () => new Set(demoState.drafts_snapshot.map((d) => d.handle)),
  );
  const [kept, setKept] = useState<ReadonlySet<string>>(() => new Set());
  const value = useMemo<PicksState>(
    () => ({
      picks,
      kept,
      toggle: (h) =>
        setPicks((p) => {
          const next = new Set(p);
          if (next.has(h)) next.delete(h);
          else next.add(h);
          return next;
        }),
      keep: (h) => setKept((k) => new Set(k).add(h)),
    }),
    [picks, kept],
  );
  return <PicksContext.Provider value={value}>{children}</PicksContext.Provider>;
}

export function usePicks(): PicksState {
  const ctx = useContext(PicksContext);
  if (!ctx) throw new Error('usePicks must be used inside <PicksProvider>');
  return ctx;
}
