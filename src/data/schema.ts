import { z } from 'zod';

/** ISO calendar date, e.g. 2026-12-01. */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const handle = z.string().regex(/^@[\w.]+$/, 'expected an @handle');

export const secondaryGoalMetric = z.enum(['cpl_usd', 'email_sms_signups', 'reach']);

export const briefSchema = z.object({
  campaign_name: z.string().min(1),
  brand: z.string().min(1),
  product: z.string().min(1),
  offer: z.string().min(1),
  link: z.string().url(),
  code_param: z.string().min(1),
  disclosure: z.string().min(1),
  dm_max_chars: z.number().int().positive(),
  approved_claims: z.array(z.string().min(1)).min(1),
  banned_claims: z.array(z.string().min(1)).min(1),
  window_start: isoDate,
  window_end: isoDate,
  ready_deadline_days_before_post: z.number().int().nonnegative(),
  campaign_budget_usd: z.number().positive(),
  max_new_creators: z.number().int().nonnegative(),
  paid_social_cpa_benchmark_usd: z.number().positive(),
  secondary_goal: z.object({ metric: secondaryGoalMetric, target: z.number().positive() }),
});
export type Brief = z.infer<typeof briefSchema>;

export const creatorStatus = z.enum(['invited', 'accepted', 'declined', 'connected', 'ready']);
export type CreatorStatus = z.infer<typeof creatorStatus>;

/** One row of data/roster.csv after parsing. Past metrics are null for creators with no history ("new"). */
export const creatorSchema = z.object({
  handle,
  code: z.string().regex(/^[A-Z0-9]+$/),
  niche: z.string().min(1),
  followers: z.number().int().nonnegative(),
  fee_usd: z.number().nonnegative(),
  post_date: isoDate,
  status: creatorStatus,
  is_backup: z.boolean(),
  past_campaigns: z.number().int().nonnegative(),
  past_engagement_rate: z.number().min(0).max(1).nullable(),
  past_dm_to_purchase_rate: z.number().min(0).max(1).nullable(),
  past_cpa_usd: z.number().nonnegative().nullable(),
  past_cpl_usd: z.number().nonnegative().nullable(),
  past_dm_count: z.number().int().nonnegative(),
  past_dm_sample: z.string().nullable(),
  sample_captions: z.array(z.string().min(1)),
});
export type Creator = z.infer<typeof creatorSchema>;

export const resultSchema = z.object({
  handle,
  hook_used: z.string().min(1),
  impressions: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  keyword_comments: z.number().int().nonnegative(),
  dms_sent: z.number().int().nonnegative(),
  link_clicks: z.number().int().nonnegative(),
  purchases: z.number().int().nonnegative(),
  email_sms_signups: z.number().int().nonnegative(),
});
export type Result = z.infer<typeof resultSchema>;

export const poolId = z.enum(['converters', 'lead_builders', 'reach', 'test_again', 'dont_rebook']);
export type PoolId = z.infer<typeof poolId>;

export const poolsConfigSchema = z.object({
  thresholds: z.object({ beat: z.string(), at_par: z.string(), missed: z.string() }),
  targets: z.record(z.string(), z.object({ source: z.string(), label: z.string() })),
  metrics: z.object({ cpa_usd: z.string(), cpl_usd: z.string(), cpm_usd: z.string() }),
  order: z
    .array(z.object({ id: poolId, name: z.string(), rule: z.string(), use_next_for: z.string() }))
    .length(5),
  custom_pools: z.string(),
  expected_sample_result: z.record(poolId, z.array(handle)),
});
export type PoolsConfig = z.infer<typeof poolsConfigSchema>;

export const draftStage = z.enum(['with_creator', 'edited', 'accepted']);

export const demoStateSchema = z.object({
  drafts_snapshot: z.array(
    z.object({
      handle,
      stage: draftStage,
      share_changed: z.number().min(0).max(1).optional(),
      creator_dm: z.string().optional(),
      expected_fail: z.array(z.string()).optional(),
    }),
  ),
  status_snapshot: z.object({
    today: isoDate,
    test_dm_sent: z.record(handle, z.boolean()),
    swaps: z.array(z.object({ declined: handle, replaced_by: handle, on: isoDate })),
    ready_means: z.string(),
    groups: z.object({
      ready: z.string(),
      at_risk: z.string(),
      waiting_on_reply: z.string(),
      on_track: z.string(),
    }),
  }),
});
export type DemoState = z.infer<typeof demoStateSchema>;

export const brandKitSchema = z.object({
  voice: z.string().min(1),
  disclosure_placement: z.string().min(1),
  last_changed: isoDate,
  products: z
    .array(z.object({ name: z.string().min(1), link: z.string().url(), default_offer: z.string().min(1) }))
    .min(1),
});
export type BrandKit = z.infer<typeof brandKitSchema>;

/** Output of docs/PROMPTS.md call 1 (starter DM and caption call to action). */
export const starterOutputSchema = z.object({
  dm: z.string().min(1),
  caption_cta: z.string().min(1),
  claims_used: z.array(z.string()),
  voice_source: z.enum(['past_dms', 'captions']),
});
export type StarterOutput = z.infer<typeof starterOutputSchema>;

export const cachedStartersSchema = z.object({
  source: z.enum(['design', 'model']),
  model: z.string().optional(),
  generated_at: z.string().optional(),
  written_for: z.object({ product: z.string(), offer: z.string(), link: z.string().url() }),
  starters: z
    .array(
      starterOutputSchema.extend({
        handle,
        /** Exact checks the starter still failed after one regeneration (shown for a person to fix). */
        failures: z.array(z.string()).default([]),
      }),
    )
    .min(1),
});
export type CachedStarters = z.infer<typeof cachedStartersSchema>;

/** Output of docs/PROMPTS.md call 2, cached by the exact message text it judged. */
export const claimFindingSchema = z.object({
  phrase: z.string(),
  type: z.enum(['banned_paraphrase', 'unapproved_claim']),
  matches: z.string(),
  reason: z.string(),
  suggested_fix: z.string(),
});
export type ClaimFinding = z.infer<typeof claimFindingSchema>;

export const claimJudgmentSchema = z.object({
  verdict: z.enum(['pass', 'fail', 'unsure']),
  findings: z.array(claimFindingSchema),
  note: z.string().optional(),
});
export type ClaimJudgment = z.infer<typeof claimJudgmentSchema>;

export const cachedJudgmentsSchema = z.object({
  model: z.string(),
  generated_at: z.string(),
  judgments: z.array(claimJudgmentSchema.extend({ message: z.string().min(1) })),
});
export type CachedJudgments = z.infer<typeof cachedJudgmentsSchema>;
