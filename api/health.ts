import { anthropicApiKey } from './_lib/env.js';

/**
 * GET /api/health. Says whether the function runs and whether the Claude API key is configured.
 * Reports only a boolean; the key itself never leaves the server.
 */
export function GET(): Response {
  return Response.json(
    { ok: true, anthropicKeyConfigured: anthropicApiKey() !== undefined },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
