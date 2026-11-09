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

## Results

| Date | Checks version | Violations caught | False flags on clean cases | Notes |
|---|---|---|---|---|
| _pending_ | | | | |

**Targets:** catch 100% of violations; flag no more than 10% of clean cases.
