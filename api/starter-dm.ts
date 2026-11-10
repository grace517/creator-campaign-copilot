import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { anthropicApiKey } from './_lib/env.js';
import { generateStarter } from './_lib/starterDm.js';

/**
 * POST /api/starter-dm { brief, creator } → a starter DM and caption call to action (docs/PROMPTS.md call 1),
 * with any exact checks it still fails after one regeneration.
 *
 * Off unless LIVE_AI_ENABLED=true; the public demo serves data/cached/starter_dms.json instead.
 */

const text = (max: number) => z.string().min(1).max(max);
const bodySchema = z.object({
  brief: z.object({
    product: text(200),
    offer: text(200),
    link: z.string().url().max(500),
    code_param: text(40),
    disclosure: text(40),
    dm_max_chars: z.number().int().min(50).max(2000),
    approved_claims: z.array(text(200)).max(50),
    banned_claims: z.array(text(200)).max(50),
  }),
  creator: z.object({
    handle: text(100),
    code: z.string().regex(/^[A-Z0-9]{2,30}$/),
    niche: text(100),
    past_dms: z.array(text(1000)).max(3),
    sample_captions: z.array(text(1000)).max(2),
  }),
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
  if (!parsed.success) return json({ error: 'Send { brief, creator }.' }, 400);

  try {
    const result = await generateStarter(parsed.data.brief, parsed.data.creator, new Anthropic({ apiKey }));
    if (!result.starter) return json({ error: 'Couldn’t write a starter.' }, 502);
    return json(result);
  } catch (error) {
    const status = error instanceof Anthropic.RateLimitError ? 429 : 502;
    return json({ error: 'Couldn’t reach the model. Try again.' }, status);
  }
}
