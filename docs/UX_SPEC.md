# UX spec

Five screens, one per step a brand takes: brief, roster, drafts, creator status, readout. Mockups live in `design/` (Claude Design canvas source) and use the sample data in `data/`.

## Principles

- **Start mostly done.** Every screen opens prefilled from the brand kit, the roster, or the last campaign. The brand edits; it rarely types from scratch.
- **Show the result while it's still cheap to change.** The brief previews real DMs as it's edited; the roster shows the budget as creators are picked.
- **Flag, explain, then block.** Problems surface in plain words with the cause highlighted. Only a failed check blocks an action, and the block says what fixes it.
- **One metric decides.** CAC orders the roster and the readout. CPL, engagement, and reach stay visible for context but never set the order.
- **Every AI claim is checkable.** The readout's recommendations link to the rows behind them.

## 1. Brief

**Job:** set up a campaign in minutes, on-brand by default.

- Brand kit card, prefilled and labeled as such: voice, disclosure, approved claims (green chips), banned claims (red chips).
- Campaign fields: product, offer, tracked link, posting window, campaign budget, paid social CAC to beat.
- Live preview beside the form: sample DMs in three creators' voices, each with disclosure, claims, and link check chips. Updates on every edit.
- Primary action: **Next: pick creators**.

## 2. Roster

**Job:** choose who to include, within budget.

- Budget bar on top: committed spend against the campaign budget, plus count of creators and new creators against the limit. Turns amber near the limit before it blocks.
- Mix warnings above the table, inline: a creator whose past CAC is far above the benchmark, or too many picks from one niche.
- Sort and filter row: sort by past CAC (default), CPL, fee, followers, or post date; filter by status, niche, proven or new, backups only, and fits remaining budget.
- Table: pick checkbox, creator (niche, followers, backup tag), past CAC (green under benchmark, red over), past CPL, DM-to-purchase rate, engagement, fee, post date, status chip. Creators with no history show a "new" tag, not blanks.
- Primary action: **Draft messages for N creators**.

## 3. Drafts and checks

**Job:** approve every message without reading every message closely.

- Summary line: how many pass every check, how many need a fix.
- One card per creator: unique keyword, DM, caption call to action, and a check chip ("All 6 checks pass" or the failed check).
- A failed check highlights the offending phrase and explains it in one sentence with a fix (for example, a paraphrased banned claim, or a link missing its tracking tag).
- Approve is disabled on failed rows; Edit and Regenerate stay available.
- Bulk actions: **Approve all passing** and **Regenerate flagged**.

## 4. Creator status

**Job:** get every creator ready 3 days before they post.

- Counts: ready, accepted or connected, invited with no reply, past or near deadline.
- **Needs attention** cards first: creator, post date, deadline badge, what's missing, and an AI-drafted nudge with Send and Edit. A creator at risk also offers **Swap in a backup**.
- Pipeline table: four-segment bar (invited, accepted, connected, ready), post date, and a note. Declined creators show who replaced them.

## 5. Readout

**Job:** decide who to rebook and where the budget goes, in 30 seconds.

- AI brief first: a one-line headline, then Rebook, Drop, and Watch cards, each naming creators with their CAC and linking to their rows. A short line on which hooks worked and where to move budget, with its assumption stated.
- Four tiles: blended CAC against the benchmark, new customers, leads and CPL, email and SMS sign-ups.
- CAC by creator: horizontal bars against a dashed benchmark line. Green beats paid social; orange loses to it. Outliers cap at the edge with their value shown.
- Funnel table: hook, fee, comments, leads, clicks, customers, sign-ups, CPL, CAC.

## States to design next

- Empty: first campaign with no brand kit and no history (roster shows every creator as "new").
- Loading: drafts generating per row, with rows appearing as they finish.
- Errors: a creator's account disconnects mid-campaign; the model can't judge a claim and asks a person.
- Mobile: status and readout are the screens a brand checks on a phone; brief, roster, and drafts are desktop-first.
