import type Anthropic from '@anthropic-ai/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateStarter, type Starter } from '../../api/_lib/starterDm';
import { POST } from '../../api/starter-dm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBrief } from '../../src/data/parse';

const brief = parseBrief(readFileSync(join(__dirname, '../../data/brief.json'), 'utf8'));

const creator = {
  handle: '@theskinnurse',
  code: 'NURSE20',
  niche: 'skincare education',
  past_dms: ['As promised: the cleanser I recommend for reactive skin. Link below.'],
  sample_captions: ['Nurse here.'],
};
const good: Starter = {
  dm: '#ad As promised, the serum I recommend. Fragrance-free. 20% off your first order: https://fernway.example.com/serum?code=NURSE20',
  caption_cta: "#ad Comment NURSE20 and I'll DM you my code",
  claims_used: ['fragrance-free'],
  voice_source: 'past_dms',
};

function fakeClient(...outputs: (Starter | null)[]) {
  const calls: { messages: { content: string }[] }[] = [];
  const parse = vi.fn(async (params: { messages: { content: string }[] }) => {
    calls.push(params);
    return { stop_reason: 'end_turn', parsed_output: outputs[Math.min(calls.length - 1, outputs.length - 1)] };
  });
  return { client: { beta: { messages: { parse } } } as unknown as Anthropic, calls };
}

describe('generateStarter', () => {
  it('returns a starter that passes every exact check in one call, with creator text as tagged data', async () => {
    const { client, calls } = fakeClient(good);
    const r = await generateStarter(brief, creator, client);
    expect(r).toMatchObject({ starter: good, failures: [], attempts: 1 });
    expect(calls[0]!.messages[0]!.content).toContain(`<past_dms>\n${creator.past_dms[0]}\n</past_dms>`);
    expect(calls[0]!.messages[0]!.content).toContain('https://fernway.example.com/serum?code=NURSE20');
  });

  it('regenerates once with the failures as feedback when a check fails', async () => {
    const noCode = { ...good, dm: '#ad The serum. 20% off: https://fernway.example.com/serum' };
    const { client, calls } = fakeClient(noCode, good);
    const r = await generateStarter(brief, creator, client);
    expect(r).toMatchObject({ starter: good, failures: [], attempts: 2 });
    expect(calls[1]!.messages[0]!.content).toMatch(/previous draft failed these checks[\s\S]*link/);
  });

  it('returns the failures for a person to fix after the second attempt also fails', async () => {
    const banned = { ...good, dm: `${good.dm} It cures acne.` };
    const { client } = fakeClient(banned, banned);
    const r = await generateStarter(brief, creator, client);
    expect(r.attempts).toBe(2);
    expect(r.failures.map((f) => f.name)).toContain('banned_claim');
  });

  it('regenerates once when the claim check is unsure, feeding back the phrase, and keeps the passing judgment', async () => {
    const forShiftSkin = { ...good, dm: good.dm.replace('Fragrance-free.', 'For shift skin. Fragrance-free.') };
    const { client, calls } = fakeClient(forShiftSkin, good);
    const judge = vi.fn(async (dm: string) =>
      dm.includes('shift skin')
        ? { verdict: 'unsure' as const, source: 'model' as const, findings: [{ phrase: 'For shift skin', type: 'unapproved_claim' as const, matches: '', reason: 'Implies who it suits.', suggested_fix: 'suitable for sensitive skin' }] }
        : { verdict: 'pass' as const, source: 'model' as const, findings: [] },
    );
    const r = await generateStarter(brief, creator, client, judge);
    expect(r).toMatchObject({ starter: good, failures: [], attempts: 2, judgment: { verdict: 'pass' } });
    expect(calls[1]!.messages[0]!.content).toMatch(/claims: The claim check was unsure: "For shift skin": Implies who it suits\./);
    expect(judge).toHaveBeenCalledTimes(2);
  });

  it('skips the claim check while an exact check is failing', async () => {
    const noCode = { ...good, dm: '#ad The serum. 20% off: https://fernway.example.com/serum' };
    const { client } = fakeClient(noCode, noCode);
    const judge = vi.fn();
    await generateStarter(brief, creator, client, judge);
    expect(judge).not.toHaveBeenCalled();
  });

  it('tells the writer not to say who the product is for unless it is an approved claim', async () => {
    const { client, calls } = fakeClient(good);
    await generateStarter(brief, creator, client);
    expect((calls[0] as unknown as { system: string }).system).toContain('Don\'t say who the product is for or what skin it suits');
  });

  it('flags a claim the starter used that is not approved', async () => {
    const { client } = fakeClient({ ...good, claims_used: ['vegan'] }, { ...good, claims_used: ['vegan'] });
    expect((await generateStarter(brief, creator, client)).failures.map((f) => f.name)).toEqual(['claims']);
  });
});

describe('POST /api/starter-dm', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('is off unless LIVE_AI_ENABLED=true', async () => {
    vi.stubEnv('LIVE_AI_ENABLED', '');
    const res = await POST(new Request('http://x/api/starter-dm', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(503);
  });
  it('rejects a malformed body', async () => {
    vi.stubEnv('LIVE_AI_ENABLED', 'true');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-not-real');
    const res = await POST(new Request('http://x/api/starter-dm', { method: 'POST', body: JSON.stringify({ creator }) }));
    expect(res.status).toBe(400);
  });
});
