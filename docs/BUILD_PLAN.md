# Build plan

Target: a hosted prototype someone outside can click through in under 5 minutes.

## Stack

- Claude Code (or Replit) to build; repo on GitHub with small, frequent commits
- A single-page web app (React + Vite, or Replit's default)
- Claude API for drafting and the readout; the API key lives in an environment secret, never in the repo
- Seed data from `data/`; no database needed for v1 (state in memory, optionally localStorage)
- Host on Vercel, Netlify, or Replit Deployments

## Screens

1. **Brief.** Form prefilled from `data/brief.json`, editable.
2. **Roster.** Table from `data/roster.csv`; select creators; shows fee, past CPA, past CPL, past DM-to-purchase rate, past engagement rate, and committed spend total. No campaign status or post dates here; those start at screen 4. Sort by past CPA; "new" tag when there's no history. CSV upload as a second path.
3. **Drafts and checks.** One row per creator: keyword, starter DM (written from the creator's past DMs), caption CTA, creator brief. The creator edits or accepts; checks re-run on every version; the brand approves last. Check results as pass/fail chips with reasons. Approve, send back with a fix, remind.
4. **Creator status.** Invited / accepted / declined / connected / ready, with post date and a "not ready by deadline" flag. AI-drafted nudge; swap in a backup.
5. **Readout.** From `data/results.csv`: a verdict, a fee-vs-purchases scatter with the CPA goal line, and one pool per creator by the exact rule in `docs/UX_SPEC.md`, each with CPA, cost per lead, and cost per 1,000 impressions against their targets. Table and Funnel views with filters below.

## Data model

- `Campaign`: name, product, offer, link, code_param, approved_claims[], banned_claims[], disclosure, window_start, window_end, budget_usd, paid_social_cpa_benchmark_usd, secondary_goal (metric, target)
- `Creator`: handle, niche, followers, fee_usd, past_dm_count, past_dm_sample, sample_captions[], status, post_date, is_backup, past_campaigns, past_engagement_rate, past_dm_to_purchase_rate, past_cpa_usd, past_cpl_usd
- `Draft`: creator_handle, keyword, starter_dm, creator_dm, stage (with_creator, edited, accepted), share_changed, caption_cta, creator_brief, checks[], approved
- `Check`: name, passed, reason
- `Pool`: name, metric, target, order (five defaults plus any the brand adds)
- `Result`: creator_handle, hook_used (tagged by the AI from the post caption), impressions, comments, keyword_comments, dms_sent, link_clicks, purchases, email_sms_signups

## Checks (deterministic first, model second)

Run the cheap, exact checks in code; use the model only for judgment calls.

| Check | How |
|---|---|
| Disclosure present | Code: the DM or caption CTA contains `#ad`, `#sponsored`, or "paid partnership" |
| Correct link | Code: the DM contains the campaign link with this creator's code (`?code=NURSE20`) |
| Correct keyword | Code: the caption CTA contains the creator's code, which is also their comment keyword |
| Length | Code: DM under the limit set in the brief |
| Banned claims | Code for exact phrases, then the model for paraphrases ("clears breakouts" ≈ "cures acne") |
| Unapproved claims | Model: flags any product claim not on the approved list |

## Build order

1. Scaffold the app and load seed data on screens 1 and 2.
2. Drafting with Claude, one call per creator; show results on screen 3.
3. Code checks, then model checks; run `evals/cases.json` and record the pass rate in `evals/README.md`.
4. Approval actions and creator status (screen 4).
5. Readout screen and AI brief (screen 5).
6. Deploy; add the live link and screenshots to the README.
7. Test with 2–3 campaign managers; log what they changed in `docs/DECISIONS.md`.
