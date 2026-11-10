# Context for coding agents

This repo is a prototype: Creator Campaign Copilot. Read `docs/PRODUCT.md`, `docs/BUILD_PLAN.md`, and `docs/UX_SPEC.md` before writing code. The mockups in `design/*.dc.html` are the visual reference for every screen: match their layout, copy, colors, and states. Rendered images are in `design/screens/`. Model calls follow `docs/PROMPTS.md`; tests follow `docs/TESTING.md`.

## Rules

- All data is fictional sample data from `data/`. Never add real brands, creators, or customer data.
- Don't use any real company's name, logo, or branding anywhere in the app.
- Keep the Claude API key in an environment secret. Never commit it.
- Pool assignment, readiness groups, and every metric (CPA, cost per sign-up, CPM) are computed in code from `data/`. The sample data must produce the pools in `data/pools.json` (`expected_sample_result`).
- Exact checks (disclosure, link, keyword, length, exact banned phrases) run in code. Use the model only for judgment calls (paraphrased or unapproved claims).
- After changing the checks, run the eval cases in `evals/cases.json` and update the pass rate in `evals/README.md`.
- Log any product decision in `docs/DECISIONS.md` (newest first).
- Work on a branch, one PR per screen or feature, following the build order in `docs/BUILD_PLAN.md`. Never push to `main`.
- Make small commits with plain messages that say what changed.
- The Claude API is called only from serverless functions in `/api`. Never call it from browser code.
