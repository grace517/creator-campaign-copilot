import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Swap } from '../lib/status';

/** The brand's actions on Creator status, held in memory: swaps made today, nudges sent, nudge edits. */
interface StatusState {
  swaps: Swap[];
  sent: ReadonlySet<string>;
  edits: ReadonlyMap<string, string>;
  addSwap: (swap: Swap) => void;
  send: (handle: string) => void;
  editNudge: (handle: string, text: string) => void;
}

const StatusContext = createContext<StatusState | null>(null);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [sent, setSent] = useState<ReadonlySet<string>>(new Set());
  const [edits, setEdits] = useState<ReadonlyMap<string, string>>(new Map());
  const value = useMemo<StatusState>(
    () => ({
      swaps,
      sent,
      edits,
      addSwap: (s) => setSwaps((all) => [...all, s]),
      send: (h) => setSent((s) => new Set(s).add(h)),
      editNudge: (h, t) => setEdits((e) => new Map(e).set(h, t)),
    }),
    [swaps, sent, edits],
  );
  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}

export function useStatus(): StatusState {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error('useStatus must be used inside <StatusProvider>');
  return ctx;
}
