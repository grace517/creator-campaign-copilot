import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './health';

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

  it('never reads the API key, calls the Claude API, or imports from /api', () => {
    const src = join(__dirname, '../src');
    for (const file of files(src).filter((f) => !f.endsWith('.test.ts'))) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toMatch(/ANTHROPIC_API_KEY|api\.anthropic\.com|@anthropic-ai|from ['"](\.\.\/)+api\//);
    }
  });
});
