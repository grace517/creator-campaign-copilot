# Sample data

All fictional. The app reads these files directly; there's no database in v1.

| File | What it holds |
|---|---|
| `brief.json` | The campaign: product, offer, product link, code parameter, claims, disclosure, window, budget, new-creator limit, paid social CPA benchmark, and the secondary goal |
| `roster.csv` | Ten contracted creators: code (their comment keyword and checkout code), fee, post date, status, backup flag, past results with this brand (CPA, CPL, DM-to-purchase rate, engagement), past DM count and a sample DM, and two sample captions |
| `results.csv` | Campaign results per creator: hook, impressions, comments, keyword comments, DMs sent (leads), link clicks, purchases, sign-ups |
| `pools.json` | Readout pool rules: thresholds, targets, order, what each pool is for next, and the result the sample data must produce |
| `demo_state.json` | Seeded state so each screen opens as designed: creators' responses to their starter DMs (Drafts), and readiness on Nov 30 (Creator status) |

Codes: a creator's DM link is `brief.link + "?code=" + code`.
