import type Anthropic from '@anthropic-ai/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { judgeClaims, type Judgment } from '../../api/_lib/claimJudgment';
import { POST } from '../../api/check-claims';

const input = {
  message: '#ad My breakouts cleared up completely with this.',
  approved_claims: ['fragrance-free'],
  banned_claims: ['cures acne'],
};

/** A stand-in client that returns the given responses in order and records each request. */
function fakeClient(...responses: { stop_reason?: string; parsed_output: Judgment | null }[]) {
  const calls: unknown[] = [];
  const parse = vi.fn(async (params: unknown) => {
    calls.push(params);
    const r = responses[Math.min(calls.length - 1, responses.length - 1)]!;
    return { stop_reason: r.stop_reason ?? 'end_turn', parsed_output: r.parsed_output };
  });
  return { client: { beta: { messages: { parse } } } as unknown as Anthropic, calls };
}

const finding = (phrase: string) => ({
  phrase,
  type: 'banned_paraphrase' as const,
  matches: 'cures acne',
  reason: 'Reads as "cures acne".',
  suggested_fix: 'fragrance-free',
});

describe('judgeClaims', () => {
  it('returns a fail with an exact phrase, pinned to the model, with the creator text as tagged data', async () => {
    const { client, calls } = fakeClient({
      parsed_output: { verdict: 'fail', findings: [finding('My breakouts cleared up completely')] },
    });
    const r = await judgeClaims(input, client);
    expect(r).toMatchObject({ verdict: 'fail', source: 'model' });
    const params = calls[0] as { model: string; fallbacks: string; messages: { content: string }[] };
    expect(params.model).toBe('claude-opus-5-5');
    expect(params.fallbacks).toBe('default');
    expect(params.messages[0]!.content).toContain(`<message>\n${input.message}\n</message>`);
  });

  it('tells the model the product name and offer are not claims', async () => {
    const { client, calls } = fakeClient({ parsed_output: { verdict: 'pass', findings: [] } });
    await judgeClaims({ ...input, product: 'Barrier Repair Serum', offer: '20% off your first order' }, client);
    const params = calls[0] as { system: string; messages: { content: string }[] };
    expect(params.messages[0]!.content).toMatch(/^Product name \(in any case; naming the product is not a claim\): Barrier Repair Serum\nOffer \(not a claim\): 20% off/);
    expect(params.system).toContain("The product's name");
  });

  it('sends the brand’s past rulings as precedent, quoted as data', async () => {
    const { client, calls } = fakeClient({ parsed_output: { verdict: 'pass', findings: [] } });
    await judgeClaims(
      { ...input, rulings: [{ phrase: 'Redness-prone friends', ruling: 'audience', note: 'addressing the audience' }] },
      client,
    );
    const content = (calls[0] as { messages: { content: string }[] }).messages[0]!.content;
    expect(content).toContain('<brand_rulings>\n- Addressing or naming who the message is speaking to');
    expect(content).toContain('Examples they ruled on: "Redness-prone friends" (their note: addressing the audience)\n</brand_rulings>');
    expect(content).toContain('apply the principle to any wording it covers');
    expect(content).toContain('A ruling never makes a banned claim acceptable');
  });

  it('retries once when a phrase is not copied exactly, then takes the good answer', async () => {
    const { client, calls } = fakeClient(
      { parsed_output: { verdict: 'fail', findings: [finding('my breakouts cleared')] } }, // wrong case
      { parsed_output: { verdict: 'fail', findings: [finding('My breakouts cleared up')] } },
    );
    expect((await judgeClaims(input, client)).verdict).toBe('fail');
    expect(calls).toHaveLength(2);
  });

  it('falls back to "unsure" (a person decides) after two bad shapes, never guessing', async () => {
    const { client, calls } = fakeClient({ parsed_output: null });
    expect(await judgeClaims(input, client)).toMatchObject({ verdict: 'unsure', source: 'error', findings: [] });
    expect(calls).toHaveLength(2);
  });

  it('treats a refusal as "unsure"', async () => {
    const { client } = fakeClient({ stop_reason: 'refusal', parsed_output: null });
    expect((await judgeClaims(input, client)).verdict).toBe('unsure');
  });

  it('lets findings decide when the verdict contradicts them', async () => {
    const { client } = fakeClient({ parsed_output: { verdict: 'pass', findings: [finding('My breakouts')] } });
    expect((await judgeClaims(input, client)).verdict).toBe('fail');
  });
});

describe('POST /api/check-claims', () => {
  afterEach(() => vi.unstubAllEnvs());
  const post = (body: unknown) =>
    POST(new Request('http://x/api/check-claims', { method: 'POST', body: JSON.stringify(body) }));

  it('is off unless LIVE_AI_ENABLED=true, so a public link spends nothing', async () => {
    vi.stubEnv('LIVE_AI_ENABLED', '');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-not-real');
    const res = await post(input);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'Live AI is off for this deployment.' });
  });

  it('rejects a malformed body without calling the model', async () => {
    vi.stubEnv('LIVE_AI_ENABLED', 'true');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-not-real');
    expect((await post({ message: '' })).status).toBe(400);
    expect((await post({ ...input, message: 'x'.repeat(2001) })).status).toBe(400);
  });

  it('says when the key is missing', async () => {
    vi.stubEnv('LIVE_AI_ENABLED', 'true');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    expect((await post(input)).status).toBe(503);
  });
});
