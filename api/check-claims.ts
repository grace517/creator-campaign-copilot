import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { judgeClaims } from './_lib/claimJudgment.js';
import { anthropicApiKey } from './_lib/env.js';

/**
 * POST /api/check-claims { message, approved_claims, banned_claims, product?, offer? } → the claim judgment (docs/PROMPTS.md call 2).
 *
 * Off unless LIVE_AI_ENABLED=true, so a deployed link can't spend API credits before the Live AI toggle and its
 * per-visitor rate limit exist (docs/DECISIONS.md: public demo runs on cached output).
 */

const claim = z.string().min(1).max(200);
const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  approved_claims: z.array(claim).max(50),
  banned_claims: z.array(claim).max(50),
  product: claim.optional(),
  offer: claim.optional(),
  rulings: z
    .array(
      z.object({
        phrase: z.string().min(1).max(300),
        ruling: z.enum(['audience', 'experience', 'approved_claim']),
        note: z.string().max(300).optional(),
      }),
    )
    .max(50)
    .optional(),
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
  if (!parsed.success) return json({ error: 'Send { message, approved_claims, banned_claims }.' }, 400);

  try {
    return json(await judgeClaims(parsed.data, new Anthropic({ apiKey })));
  } catch (error) {
    // Don't echo upstream error bodies to the browser.
    const status = error instanceof Anthropic.RateLimitError ? 429 : 502;
    return json({ error: 'The claim check couldn’t reach the model. Try again.' }, status);
  }
}
