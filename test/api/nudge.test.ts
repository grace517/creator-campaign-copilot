import type Anthropic from '@anthropic-ai/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { draftNudge, nudgeProblem, type NudgeInput } from '../../api/_lib/nudge';
import { POST } from '../../api/nudge';

const sam: NudgeInput = {
  handle: '@sunlit.sam',
  postDate: 'Dec 4',
  readyDeadline: 'Dec 1',
  today: 'Nov 30',
  missingStep: 'connect their Instagram account',
  setupLink: 'https://copilot.example.com/creators/SAM20/connect',
};
const good = 'Your Dec 4 post needs your Instagram connected by Dec 1 so the DMs go out. 2-minute setup: https://copilot.example.com/creators/SAM20/connect';

function fakeClient(...messages: (string | null)[]) {
  const calls: { messages: { content: string }[] }[] = [];
  const parse = vi.fn(async (params: { messages: { content: string }[] }) => {
    calls.push(params);
    const m = messages[Math.min(calls.length - 1, messages.length - 1)];
    return { stop_reason: 'end_turn', parsed_output: m === null ? null : { message: m } };
  });
  return { client: { beta: { messages: { parse } } } as unknown as Anthropic, calls };
}

describe('nudge checks', () => {
  it('rejects a nudge at or over 280 characters, without the setup link, or with exclamation pile-ups', () => {
    expect(nudgeProblem(good, sam)).toBeNull();
    expect(nudgeProblem('x'.repeat(280), sam)).toMatch(/under 280/);
    expect(nudgeProblem('Please connect by Dec 1.', sam)).toMatch(/setup link/);
    expect(nudgeProblem(`Hi!! ${good}`, sam)).toMatch(/exclamation/);
    expect(nudgeProblem('Comment SAM20 from a second account by Dec 1.', { ...sam, setupLink: null })).toBeNull();
  });
});

describe('draftNudge', () => {
  it('returns a passing nudge, with the step, dates, and link in the prompt', async () => {
    const { client, calls } = fakeClient(good);
    expect(await draftNudge(sam, client)).toEqual({ message: good, attempts: 1 });
    const content = calls[0]!.messages[0]!.content;
    expect(content).toContain('Missing step: connect their Instagram account');
    expect(content).toContain('Ready deadline: Dec 1');
    expect(content).toContain('Setup link: https://copilot.example.com/creators/SAM20/connect');
  });

  it('retries once with feedback when the link is missing, then gives up rather than sending a bad nudge', async () => {
    const { client, calls } = fakeClient('Please connect by Dec 1.', good);
    expect((await draftNudge(sam, client)).attempts).toBe(2);
    expect(calls[1]!.messages[0]!.content).toMatch(/previous draft was rejected: it must include the setup link/);
    const bad = fakeClient('Please connect by Dec 1.');
    expect(await draftNudge(sam, bad.client)).toMatchObject({ message: null, attempts: 2 });
  });
});

describe('POST /api/nudge', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('is off unless LIVE_AI_ENABLED=true', async () => {
    vi.stubEnv('LIVE_AI_ENABLED', '');
    expect((await POST(new Request('http://x/api/nudge', { method: 'POST', body: JSON.stringify(sam) }))).status).toBe(503);
  });
  it('rejects a malformed body', async () => {
    vi.stubEnv('LIVE_AI_ENABLED', 'true');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-not-real');
    expect((await POST(new Request('http://x/api/nudge', { method: 'POST', body: '{}' }))).status).toBe(400);
  });
});
