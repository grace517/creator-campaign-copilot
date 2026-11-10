# Model calls

Every place the app calls Claude, with its inputs, the exact output it must return, and its rules. Everything not listed here is code. Each call returns JSON only; the app validates it against the schema and retries once on a bad shape, then shows an error state rather than guessing.

Creator content (past DMs, captions, edits) goes into prompts as quoted data inside clearly marked tags, never as instructions. The system prompt says so, and `docs/TESTING.md` tests it.

## 1. Starter DM and caption call to action

**When:** Brief (preview for three creators) and Drafts (one call per picked creator).

**Input:**
- From the brief: product, offer, disclosure, approved claims, banned claims, `dm_max_chars`.
- From the creator: handle, code, the DM link (`link + "?code=" + code`), up to 3 past DMs (`past_dm_sample`), 2 sample captions, niche.

**Output:**
```json
{
  "dm": "string",
  "caption_cta": "string",
  "claims_used": ["approved claim, exactly as written in the brief"],
  "voice_source": "past_dms | captions"
}
```

**Rules:**
- Sound like the creator's past DMs: length, punctuation, casing, emoji habits. Use captions only when there are no past DMs, and say so in `voice_source`.
- First line starts with the disclosure. Include the offer and the full DM link exactly once.
- Use only approved claims, word for word or as a light rephrase listed in `claims_used`. No other product claims.
- Don't say who the product is for or what skin it suits ("for shift skin") unless that's an approved claim ("suitable for sensitive skin"). The creator's own routine and addressing followers are fine.
- The caption call to action asks followers to comment the creator's code.
- Stay under `dm_max_chars`.

The code checks run on the output before anyone sees it, then the claim judgment (call 2). A starter that fails either, or that the judgment is unsure about, is regenerated once with the failure as feedback; if it fails again, the row shows the failure for a person to fix.

## 2. Claim judgment

**When:** after the exact checks pass, on every starter and every creator edit.

**Input:** the message; approved and banned claims from the brief; the product name and offer, so neither is mistaken for a claim (without the name, the model flagged "the barrier repair serum" as an unapproved claim).

**Output:**
```json
{
  "verdict": "pass | fail | unsure",
  "findings": [
    {
      "phrase": "exact text from the message",
      "type": "banned_paraphrase | unapproved_claim",
      "matches": "the banned claim it paraphrases, if any",
      "reason": "one sentence a brand manager can read",
      "suggested_fix": "an approved claim that could replace it"
    }
  ]
}
```

**Rules:**
- A product claim is anything about what the product does, contains, or is proven to do. The product name, offers, prices, and personal routine ("I use it every night") are not claims.
- `phrase` must be copied exactly from the message, so the app can highlight it.
- When in doubt between fail and pass, return `unsure`. The app shows "Needs review" and blocks approval, the same as a fail.

## 3. Nudge

**When:** Creator status, for each at-risk or waiting creator.

**Input:** creator's handle and first name if known, their code (also their comment keyword, so a test-DM nudge can name it), post date, ready deadline, today, the missing step (accept, connect account, send test DM, approve DM), and the setup link for that step.

**Output:**
```json
{ "message": "string, under 280 characters" }
```

**Rules:** friendly and short; names the one missing step and the deadline; includes the link when the step has one; no guilt, no exclamation pile-ups. The brand can edit before sending.

Code checks on the output: under 280 characters, the setup link present when the step has one, at most one exclamation mark. A nudge that fails is redrafted once with the problem as feedback; if it fails again, the card offers Edit instead of a draft.

## 4. Hook tag

**When:** after a post runs (pre-filled in the sample results).

**Input:** the post caption, and the transcript when there is one.

**Output:**
```json
{ "hook": "3 to 6 words, lower case, the angle the post took" }
```

**Rules:** describe the angle, not the product ("nurse explains sensitive skin", not "barrier serum post"). Reuse an existing hook from this brand when one fits, so the readout can group them.

## Not model calls

The verdict sentence on the readout, pool assignment, readiness groups, metrics, and every exact check are code. The verdict is a template filled from computed numbers, so it can't state a number the data doesn't support.
