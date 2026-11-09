# Build plan

Target: a hosted prototype someone outside can click through in under 5 minutes.

## Stack

- Claude Code (or Replit) to build; repo on GitHub with small, frequent commits
- A single-page web app (React + Vite, or Replit's default)
- Claude API for drafting and the readout; the API key lives in an environment secret, never in the repo
- Seed data from `data/`; no database needed for v1 (state in memory, optionally localStorage)
- Host on Vercel, Netlify, or Replit Deployments

## Screens

Match the mockups in `design/` for layout, copy, and states. `docs/UX_SPEC.md` says why each element is there. Every screen sits in the same shell: an app bar (Campaigns, Creators, Brand kit) and a campaign header with breadcrumb, campaign switcher, and the five-step stepper.

1. **Brief.** Brand kit card and campaign fields prefilled from `data/brief.json`, including the main goal (paid social CPA) and the optional secondary goal. Each creator's code (`code` in `data/roster.csv`) is their comment keyword and checkout code; the DM link is `link + "?code=" + code`. Beside the form: starter DMs for three creators, written by the model from each creator's `past_dm_sample` (captions when they have none), with check chips, and a low-confidence flag under two past DMs.
2. **Roster.** Table from `data/roster.csv`: pick, creator, past CPA (green at or under the benchmark, red over), past CPL, DM-to-purchase rate, engagement, fee. No status or post dates. Summary bar: committed spend against `campaign_budget_usd`, new creators against `max_new_creators`, and set-level warnings (niche mix) that name the creators who would close the gap. A one-creator warning (past CPA 3x the benchmark or more) sits in a row directly under that creator, with Unpick and Keep anyway. Sort by past CPA by default.
3. **Drafts and checks.** Flow: starter drafted from past DMs → creator edits or accepts → checks re-run → brand approves. Seed the creator side from `data/demo_state.json` (`drafts_snapshot`): stage, the creator's edited DM, and share of the starter changed. Failed checks highlight the phrase and block Approve; "Send back with fix" and "Remind" stay available.
4. **Creator status.** One readiness summary: a sentence plus a bar in four groups that never overlap (ready, on track, waiting on a reply, at risk), defined in `data/demo_state.json` (`status_snapshot`, today = Nov 30). At-risk cards with an AI-drafted nudge and Swap in a backup; then a table per creator with a four-step pipeline.
5. **Readout.** From `data/results.csv`: a verdict sentence, a scatter of fee (x) against purchases (y) with the line where CPA equals the benchmark, five pool cards, and a Table / Funnel view below that filters when a pool card is clicked. Pool assignment follows `data/pools.json` exactly and runs in code; the sample data must produce its `expected_sample_result`.

## Data model

- `Campaign`: name, product, offer, link, code_param, approved_claims[], banned_claims[], disclosure, window_start, window_end, budget_usd, max_new_creators, paid_social_cpa_benchmark_usd, secondary_goal (metric, target)
- `Creator`: handle, code, niche, followers, fee_usd, past_dm_count, past_dm_sample, sample_captions[], status, post_date, is_backup, past_campaigns, past_engagement_rate, past_dm_to_purchase_rate, past_cpa_usd, past_cpl_usd
- `Draft`: creator_handle, keyword, starter_dm, creator_dm, stage (with_creator, edited, accepted), share_changed, caption_cta, creator_brief, checks[], approved
- `Check`: name, passed, reason
- `Pool`: name, metric, target, order (five defaults in `data/pools.json`, plus any the brand adds)
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

## Where the model is used

- Starter DMs and caption calls to action, one call per creator, in the creator's voice from their past DMs.
- Judgment checks: paraphrased banned claims and claims not on the approved list.
- Nudges on Creator status.
- Hook tags from post captions (already filled in the sample results).

Everything else is code: the exact checks, readiness groups, CPA, CPL, CPM, beat or at par or missed, and pool assignment.

## Build order

1. Scaffold the app shell (app bar, campaign header, stepper) and load seed data on screens 1 and 2.
2. Drafting with Claude, one call per creator; show results on screen 3 with the seeded creator responses.
3. Code checks, then model checks; run `evals/cases.json` and record the pass rate in `evals/README.md`.
4. Approval actions and creator status (screen 4).
5. Readout (screen 5): metrics and pools in code, checked against `expected_sample_result` in `data/pools.json`; then the scatter, pool cards, and filtered table.
6. Deploy; add the live link and screenshots to the README.
7. Test with 2–3 campaign managers; log what they changed in `docs/DECISIONS.md`.
