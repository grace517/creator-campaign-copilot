# Context for coding agents

This repo is a prototype: Creator Campaign Copilot. Read `docs/PRODUCT.md` and `docs/BUILD_PLAN.md` before writing code.

## Rules

- All data is fictional sample data from `data/`. Never add real brands, creators, or customer data.
- Don't use any real company's name, logo, or branding anywhere in the app.
- Keep the Claude API key in an environment secret. Never commit it.
- Exact checks (disclosure, link, keyword, length, exact banned phrases) run in code. Use the model only for judgment calls (paraphrased or unapproved claims).
- After changing the checks, run the eval cases in `evals/cases.json` and update the pass rate in `evals/README.md`.
- Log any product decision in `docs/DECISIONS.md` (newest first).
- Make small commits with plain messages that say what changed.
