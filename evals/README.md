# Evals for message checks

`cases.json` holds 21 DM cases and 3 caption cases, checked against the sample brief in `data/brief.json`. Each case lists every check that should fail; an empty list means the message should pass clean.

**What the cases cover:**
- Clean messages using approved claims (should pass)
- Missing disclosure, including a written-out "paid partnership" that should pass
- Banned claims, both exact and paraphrased ("my breakouts cleared up" counts as "cures acne")
- Claims not on the approved list, including a comparison to a named competitor
- Wrong or missing links, links missing the creator's code, and links with another creator's code
- Over-length messages
- Wrong keyword in the caption call to action

## Running them

```bash
npm run evals
```

The runner (`scripts/run-evals.ts`) checks every case with the exact checks in `src/lib/checks.ts`. When `ANTHROPIC_API_KEY` is set, it also runs the model's claim judgment (`api/_lib/claimJudgment.ts`, pinned to `claude-opus-5-5`) on each DM that passes the exact checks, as the app does. That's about 10 calls per run. It prints each case, the totals, and exits non-zero below target. CI runs it on every PR; the model cases run there once the repository has an `ANTHROPIC_API_KEY` secret.

**How it counts:**
- **Violation:** one expected failure (case × check). It's caught when that check fails.
- **False flag:** a clean case with any failure.
- **"Not run":** a violation that only the model can catch (a paraphrased banned claim, or an unapproved claim), reported this way when the model isn't called. It's never counted as caught.

## Results

| Date | Checks version | Violations caught | False flags on clean cases | Notes |
|---|---|---|---|---|
| 2026-11-09 | feat/04: exact checks; claim judgment not run | 15/15 code-checkable (100%); 15/21 overall, 6 not run | 0/5 (0%) | No API key where this ran. The 6 model cases (5, 7, 9 paraphrased banned claims; 10, 11, 19 unapproved claims) need a run with the key before the overall target can be claimed. |
| 2026-11-10 | feat/04: exact checks + claim judgment (`claude-opus-5-5`, effort high) | **21/21 (100%)**: 15/15 by exact checks, 6/6 by the model | **0/5 (0%)** | First full run, in CI on `main` (run 42727812181). The model quoted each phrase exactly: "My breakouts cleared up completely with this." (5), "You'll see results overnight." (7), "This serum smoothed out my fine lines." (9) as banned paraphrases; "vegan", "cruelty-free" (10), "It boosts collagen production." (11), "Way better than the Glowlab serum I used to buy." (19) as unapproved claims. One run on 24 cases, so it's a baseline, not proof: the set needs to grow (docs/TESTING.md). |

**Targets:** catch 100% of violations; flag no more than 10% of clean cases.
