import { cachedStarters } from '../../data';
import type { Creator } from '../../data/schema';

/** Writes one starter DM; rejects when the model call fails. */
export type WriteStarter = (creator: Creator) => Promise<{ dm: string; captionCta: string }>;

/**
 * Demo mode: each starter comes from the cache after a short wait, like a model call would. With failHandle set,
 * that creator's first two calls fail (the automatic retry included) and Try again succeeds.
 */
export function demoWriter(failHandle: string | null, delayMs = 900): WriteStarter {
  const calls = new Map<string, number>();
  return (c) =>
    new Promise((resolve, reject) => {
      const n = (calls.get(c.handle) ?? 0) + 1;
      calls.set(c.handle, n);
      setTimeout(() => {
        const cached = cachedStarters.starters.find((s) => s.handle === c.handle);
        if (!cached || (c.handle === failHandle && n <= 2)) reject(new Error('The model call failed'));
        else resolve({ dm: cached.dm, captionCta: cached.caption_cta });
      }, delayMs);
    });
}
