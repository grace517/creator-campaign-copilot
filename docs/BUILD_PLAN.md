# Build plan

Target: a hosted prototype someone outside can click through in under 5 minutes.

## Stack

- React + Vite + TypeScript, deployed on Vercel
- Claude API calls go through Vercel serverless functions (`/api/*`). The API key lives in a Vercel environment variable and never reaches the browser.
- Seed data from `data/`; no database in v1 (state in memory, light preferences in localStorage)
- **Demo mode by default.** The public link serves cached model outputs (`data/cached/`, generated once from the real prompts), so visitors see the full flow instantly and the API isn't open to anyone with the link. A "Live AI" toggle calls the API for real and is rate-limited per visitor.
- Vitest for unit tests, Playwright for end-to-end tests, GitHub Actions for CI

## Workflow

- `main` is protected: changes land through pull requests only, and CI must pass.
- One branch and one PR per screen or feature, in the build order below (`feat/01-app-shell`, `feat/02-brief`, …).
- Each PR: what it builds, a screenshot next to the matching image in `design/screens/`, what was tested, and any decision logged in `docs/DECISIONS.md`.
- Vercel builds a preview link for every PR, so each screen can be clicked through before it merges.
- CI runs type checks, unit tests, and the eval cases on every PR (see `docs/TESTING.md`).

## Screens

Match the mockups in `design/` for layout, copy, and states. `docs/UX_SPEC.md` says why each element is there. Every screen sits in the same shell: an app bar (Campaigns, Creators, Brand kit) and a campaign header with breadcrumb, campaign switcher, and the five-step stepper.

1. **Brief.** Brand kit card and campaign fields prefilled from `data/brief.json`, including the main goal (paid social CPA) and the optional secondary goal. Each creator's code (`code` in `data/roster.csv`) is their comment keyword and checkout code; the DM link is `link + "?code=" + code`. Beside the form: starter DMs for three creators, written by the model from each creator's `past_dm_sample` (captions when they have none), with check chips, and a low-confidence flag under two past DMs.
2. **Roster.** Table from `data/roster.csv`: pick, creator, past CPA (green at or under the benchmark, red over), past CPL, DM-to-purchase rate, engagement, fee. No status or post dates. Summary bar: committed spend against `campaign_budget_usd`, new creators against `max_new_creators`, and set-level warnings (niche mix) that name the creators who would close the gap. A one-creator warning (past CPA 3x the benchmark or more) sits in a row directly under that creator, with Unpick and Keep anyway. Sort by past CPA by default.
3. **Drafts and checks.** Flow: starter drafted from past DMs → creator edits or accepts → checks re-run → brand approves. Seed the creator side from `data/demo_state.json` (`drafts_snapshot`): stage, the creator's edited DM, and share of the starter changed. Failed checks highlight the phrase and block Approve; "Send back with fix" and "Remind" stay available.
4. **Creator status.** One readiness summary: a sentence plus a bar in four groups that never overlap (ready, on track, waiting on a reply, at risk), defined in `data/demo_state.json` (`status_snapshot`, today = Nov 30). At-risk cards with an AI-drafted nudge and Swap in a backup; then a table per creator with a four-step pipeline.
5. **Readout.** From `data/results.csv`: a verdict sentence, a scatter of fee (x) against purchases (y) with the line where CPA equals the benchmark, five pool cards, and a Table / Funnel view below that filters when a pool card is clicked. Pool assignment follows `data/pools.json` exactly and runs in code; the sample data must produce its `expected_sample_result`.
6. **Campaigns home.** Four sample campaigns at different steps; "Next for you" comes from each campaign's state.
7. **Creators and pools.** Pool tabs filter the roster; "Start a campaign with these N" opens a brief with those creators picked.
8. **Brand kit.** Edits here change every new brief and every check.
9. **Phone layouts** for Creator status and Readout, and the **empty, loading, and error states**, as drawn in `design/`.

Model calls, their inputs, and their exact outputs are defined in `docs/PROMPTS.md`.

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

## Build order (one PR each)

1. `feat/01-app-shell`: Vite + TypeScript scaffold, app bar, campaign header and stepper, routing between screens, data loaders, CI (types, Vitest), Vercel project with the API key set.
2. `feat/02-brief`: Brief screen, brand kit card, goals, and the starter DM preview (cached in demo mode).
3. `feat/03-roster`: Roster table, sort and filters, summary bar, inline and set-level warnings.
4. `feat/04-checks`: the exact checks in code with unit tests; the claim judgment call; the eval runner in CI; record the pass rate in `evals/README.md`.
5. `feat/05-drafts`: Drafts screen with starter generation, seeded creator responses, approve, send back, remind.
6. `feat/06-status`: Creator status, readiness groups, nudges, backup swap.
7. `feat/07-readout`: metrics and pools in code (must match `expected_sample_result`), verdict, scatter, pool cards, Table and Funnel views.
8. `feat/08-app-screens`: Campaigns home, Creators and pools, Brand kit.
9. `feat/09-phone-and-states`: phone layouts and the empty, loading, and error states.
10. `feat/10-e2e`: Playwright run through all screens, accessibility checks, demo-mode cache, README with the live link and screenshots.
11. Test with 2–3 campaign managers; log what they changed in `docs/DECISIONS.md`.

## Hosting

- Vercel, connected to the GitHub repo: every merge to `main` deploys the public link, and every PR gets its own preview link.
- The repo can stay private while the deployed link is public; when the repo goes public, its README leads with the live link.
- If the link is shared beyond a few people, Vercel's password protection (or an unlisted URL) keeps the Live AI toggle from being found by crawlers.
