import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../api/health';

describe('GET /api/health', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('reports whether the key is configured, never the key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test-not-a-real-key');
    const body = await GET().json();
    expect(body).toEqual({ ok: true, anthropicKeyConfigured: true });
    expect(JSON.stringify(body)).not.toContain('sk-test');
  });

  it('says so when the key is missing', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    expect(await GET().json()).toEqual({ ok: true, anthropicKeyConfigured: false });
  });
});

describe('browser code', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? files(p) : [p];
    });

  it('keeps /api to deployable functions: every file there becomes a Vercel function', () => {
    const api = join(__dirname, '../../api');
    const routes = readdirSync(api).filter((f) => !f.startsWith('_'));
    for (const f of routes) expect(f, `api/${f}`).toMatch(/^[a-z-]+\.ts$/);
    expect(routes.some((f) => f.includes('.test.'))).toBe(false);
  });

  it('never reads the API key, calls the Claude API, or imports from /api', () => {
    const src = join(__dirname, '../../src');
    for (const file of files(src).filter((f) => !f.endsWith('.test.ts'))) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toMatch(/ANTHROPIC_API_KEY|api\.anthropic\.com|@anthropic-ai|from ['"](\.\.\/)+api\//);
    }
  });
});
