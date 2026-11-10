import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { anthropicApiKey } from './_lib/env.js';
import { draftNudge } from './_lib/nudge.js';

/**
 * POST /api/nudge → a drafted nudge for a creator who isn't ready (docs/PROMPTS.md call 3).
 * Off unless LIVE_AI_ENABLED=true; the public demo serves data/cached/nudges.json instead.
 */

const text = (max: number) => z.string().min(1).max(max);
const bodySchema = z.object({
  handle: text(100),
  firstName: text(60).optional(),
  postDate: text(40),
  readyDeadline: text(40),
  today: text(40),
  missingStep: text(300),
  setupLink: z.string().url().max(500).nullable(),
});

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request): Promise<Response> {
  if (process.env.LIVE_AI_ENABLED !== 'true') {
    return json({ error: 'Live AI is off for this deployment.' }, 503);
  }
  const apiKey = anthropicApiKey();
  if (!apiKey) return json({ error: 'The Claude API key isn’t configured.' }, 503);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Send the creator, dates, missing step, and setup link.' }, 400);

  try {
    const result = await draftNudge(parsed.data, new Anthropic({ apiKey }));
    if (!result.message) return json({ error: 'Couldn’t draft a nudge.', problem: result.problem }, 502);
    return json({ message: result.message });
  } catch (error) {
    const status = error instanceof Anthropic.RateLimitError ? 429 : 502;
    return json({ error: 'Couldn’t reach the model. Try again.' }, status);
  }
}
