import Papa from 'papaparse';
import { z } from 'zod';
import {
  brandKitSchema,
  briefSchema,
  cachedJudgmentsSchema,
  campaignsFileSchema,
  cachedNudgesSchema,
  cachedStartersSchema,
  creatorSchema,
  demoStateSchema,
  poolsConfigSchema,
  resultSchema,
  type BrandKit,
  type Brief,
  type CachedJudgments,
  type CampaignsFile,
  type CachedNudges,
  type CachedStarters,
  type Creator,
  type DemoState,
  type PoolsConfig,
  type Result,
} from './schema';

/** Pure parsers: each takes a file's text and returns validated, typed data, or throws naming the file and field. */

function csvRows(text: string, file: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    const e = parsed.errors[0]!;
    throw new Error(`${file}: CSV error on row ${e.row ?? '?'}: ${e.message}`);
  }
  return parsed.data;
}

function validate<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) {
    const issue = r.error.issues[0]!;
    throw new Error(`${where}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  return r.data;
}

const blankToNull = (s: string | undefined) => (s === undefined || s.trim() === '' ? null : s.trim());

function num(s: string | undefined): number | null {
  const v = blankToNull(s);
  if (v === null) return null;
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`not a number: "${v}"`);
  return n;
}

/** "4.8%" → 0.048. */
function percent(s: string | undefined): number | null {
  const v = blankToNull(s);
  if (v === null) return null;
  if (!v.endsWith('%')) throw new Error(`expected a percentage: "${v}"`);
  return num(v.slice(0, -1))! / 100;
}

function bool(s: string | undefined): boolean {
  if (s === 'true') return true;
  if (s === 'false') return false;
  throw new Error(`expected true or false: "${s}"`);
}

function stripNotes(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripNotes);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, stripNotes(v)]),
    );
  }
  return obj;
}

const json = (text: string) => stripNotes(JSON.parse(text));

export function parseBrief(text: string): Brief {
  return validate(briefSchema, json(text), 'brief.json');
}

export function parseBrandKit(text: string): BrandKit {
  return validate(brandKitSchema, json(text), 'brand_kit.json');
}

export function parseCachedJudgments(text: string): CachedJudgments {
  return validate(cachedJudgmentsSchema, json(text), 'cached/claim_judgments.json');
}

export function parseCachedNudges(text: string): CachedNudges {
  return validate(cachedNudgesSchema, json(text), 'cached/nudges.json');
}

export function parseCampaigns(text: string): CampaignsFile {
  return validate(campaignsFileSchema, json(text), 'campaigns.json');
}

export function parseCachedStarters(text: string): CachedStarters {
  return validate(cachedStartersSchema, json(text), 'cached/starter_dms.json');
}

export function parsePools(text: string): PoolsConfig {
  return validate(poolsConfigSchema, json(text), 'pools.json');
}

export function parseDemoState(text: string): DemoState {
  return validate(demoStateSchema, json(text), 'demo_state.json');
}

export function parseRoster(text: string): Creator[] {
  return csvRows(text, 'roster.csv').map((row, i) => {
    const where = `roster.csv row ${i + 2}`;
    try {
      return validate(
        creatorSchema,
        {
          handle: row.handle,
          code: row.code,
          niche: row.niche,
          followers: num(row.followers),
          fee_usd: num(row.fee_usd),
          post_date: row.post_date,
          status: row.status,
          is_backup: bool(row.is_backup),
          past_campaigns: num(row.past_campaigns),
          past_engagement_rate: percent(row.past_engagement_rate),
          past_dm_to_purchase_rate: percent(row.past_dm_to_purchase_rate),
          past_cpa_usd: num(row.past_cpa_usd),
          past_cpl_usd: num(row.past_cpl_usd),
          past_dm_count: num(row.past_dm_count),
          past_dm_sample: blankToNull(row.past_dm_sample),
          sample_captions: [row.sample_caption_1, row.sample_caption_2].filter(
            (c): c is string => blankToNull(c) !== null,
          ),
        },
        where,
      );
    } catch (e) {
      throw e instanceof Error && e.message.startsWith(where) ? e : new Error(`${where}: ${(e as Error).message}`);
    }
  });
}

export function parseResults(text: string): Result[] {
  return csvRows(text, 'results.csv').map((row, i) =>
    validate(
      resultSchema,
      {
        handle: row.handle,
        hook_used: row.hook_used,
        impressions: num(row.impressions),
        comments: num(row.comments),
        keyword_comments: num(row.keyword_comments),
        dms_sent: num(row.dms_sent),
        link_clicks: num(row.link_clicks),
        purchases: num(row.purchases),
        email_sms_signups: num(row.email_sms_signups),
      },
      `results.csv row ${i + 2}`,
    ),
  );
}
