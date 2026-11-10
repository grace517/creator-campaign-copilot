import { describe, expect, it } from 'vitest';
import { roster } from '../../data';
import { withOneRetry } from '../../lib/states';
import { demoWriter } from './demoWriter';

const gia = roster.find((c) => c.handle === '@glow.with.gia')!;
const dana = roster.find((c) => c.handle === '@dewy.dana')!;

describe('demoWriter ("A model call fails" sample state)', () => {
  it('fails the chosen creator twice, so the automatic retry fails too, then Try again succeeds', async () => {
    const write = demoWriter('@glow.with.gia', 0);
    await expect(withOneRetry(() => write(gia))).rejects.toThrow();
    await expect(withOneRetry(() => write(gia))).resolves.toMatchObject({ captionCta: expect.stringContaining('GIA20') });
  });

  it("doesn't affect other creators", async () => {
    const write = demoWriter('@glow.with.gia', 0);
    await expect(write(dana)).resolves.toMatchObject({ dm: expect.stringContaining('DANA20') });
  });
});
