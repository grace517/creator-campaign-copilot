/**
 * The only place the Claude API key is read. Files under api/_lib are helpers, not routes (Vercel skips
 * underscore-prefixed paths), and nothing under src/ may import from api/.
 */
export function anthropicApiKey(): string | undefined {
  const key = process.env.ANTHROPIC_API_KEY;
  return key && key.trim() !== '' ? key : undefined;
}
