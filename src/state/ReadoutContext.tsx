import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CustomPool } from '../lib/readout';

/**
 * The brand's readout choices, held in memory: pools saved for the next roster, custom pools (applied to every
 * readout), and hooks marked for the next brief. Creators and the next brief read these (feat/08).
 */
interface ReadoutState {
  saved: ReadonlySet<string>;
  customPools: CustomPool[];
  hooksForNextBrief: string[];
  savePool: (id: string) => void;
  addCustomPool: (pool: CustomPool) => void;
  removeCustomPool: (id: string) => void;
  useHooks: (hooks: string[]) => void;
}

const ReadoutContext = createContext<ReadoutState | null>(null);

export function ReadoutProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  const [customPools, setCustom] = useState<CustomPool[]>([]);
  const [hooksForNextBrief, setHooks] = useState<string[]>([]);
  const value = useMemo<ReadoutState>(
    () => ({
      saved,
      customPools,
      hooksForNextBrief,
      savePool: (id) => setSaved((s) => new Set(s).add(id)),
      addCustomPool: (p) => setCustom((all) => [...all, p]),
      removeCustomPool: (id) => setCustom((all) => all.filter((p) => p.id !== id)),
      useHooks: (h) => setHooks(h),
    }),
    [saved, customPools, hooksForNextBrief],
  );
  return <ReadoutContext.Provider value={value}>{children}</ReadoutContext.Provider>;
}

export function useReadout(): ReadoutState {
  const ctx = useContext(ReadoutContext);
  if (!ctx) throw new Error('useReadout must be used inside <ReadoutProvider>');
  return ctx;
}
