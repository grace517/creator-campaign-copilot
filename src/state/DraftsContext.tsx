import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { NO_ACTIONS, type BrandActions } from '../lib/drafts';

/** The brand's actions on Drafts, held in memory (no database in v1). */
interface DraftsState {
  actions: BrandActions;
  approve: (handles: string[]) => void;
  remind: (handles: string[]) => void;
  sendBack: (handle: string, fix: string) => void;
  edit: (handle: string, text: string) => void;
  markOk: (message: string) => void;
}

const DraftsContext = createContext<DraftsState | null>(null);

export function DraftsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<BrandActions>(NO_ACTIONS);
  const value = useMemo<DraftsState>(() => {
    const add = <T,>(set: ReadonlySet<T>, items: T[]) => new Set([...set, ...items]);
    return {
      actions,
      approve: (hs) => setActions((a) => ({ ...a, approved: add(a.approved, hs) })),
      remind: (hs) => setActions((a) => ({ ...a, reminded: add(a.reminded, hs) })),
      sendBack: (h, fix) =>
        setActions((a) => {
          const approved = new Set(a.approved);
          approved.delete(h);
          const edits = new Map(a.edits);
          edits.delete(h);
          return { ...a, approved, edits, sentBack: new Map(a.sentBack).set(h, fix) };
        }),
      edit: (h, text) =>
        setActions((a) => {
          const approved = new Set(a.approved);
          approved.delete(h); // an edited message needs approving again
          return { ...a, approved, edits: new Map(a.edits).set(h, text) };
        }),
      markOk: (m) => setActions((a) => ({ ...a, markedOk: add(a.markedOk, [m]) })),
    };
  }, [actions]);
  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
}

export function useDrafts(): DraftsState {
  const ctx = useContext(DraftsContext);
  if (!ctx) throw new Error('useDrafts must be used inside <DraftsProvider>');
  return ctx;
}
