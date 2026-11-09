# UX spec

Five screens, one per step a brand takes: brief, roster, drafts, creator status, readout. Mockups live in `design/` (Claude Design canvas source) and use the sample data in `data/`.

## Principles

- **Start mostly done.** Every screen opens prefilled from the brand kit, the roster, or the last campaign. The brand edits; it rarely types from scratch.
- **Show the result while it's still cheap to change.** The brief previews real DMs as it's edited; the roster shows the budget as creators are picked.
- **Flag, explain, then block.** Problems surface in plain words with the cause highlighted. Only a failed check blocks an action, and the block says what fixes it.
- **One metric decides.** CAC orders the roster and the readout. CPL, engagement, and reach stay visible for context but never set the order.
- **Every AI claim is checkable.** The readout's verdict and each decision tag sit next to the numbers behind them.

## Navigation

- **App level:** Campaigns, Creators, and Brand kit in the top bar. Creators and the brand kit are shared across campaigns; campaigns are where work happens.
- **Campaign level:** every campaign screen opens with a campaign header: breadcrumb (Campaigns / campaign name), the campaign name, its product, window, and budget, and a campaign switcher. The five steps sit under the name as a stepper, so they read as this campaign's progress, not app navigation.
- **Stepper:** connected circles. Completed steps are filled green with a check, the current step is white with a green outline, and steps not started are light grey. Every step is a link, and screen readers hear each step's state.

## 1. Brief

**Job:** set up a campaign in minutes, on-brand by default.

- Brand kit card, prefilled and labeled as such: voice, disclosure, approved claims (green chips), banned claims (red chips).
- Campaign fields: product, offer, product link, posting window, campaign budget, main goal (paid social CAC to beat), and an optional secondary goal (cost per lead, email and SMS sign-ups, or reach) with a target. The readout uses the secondary goal to say why a creator who missed on CAC may still be worth keeping. Each creator gets a code (NURSE20) that is both their comment keyword and their checkout code; the DM link carries it so it applies at checkout (…/serum?code=NURSE20).
- Starter DMs beside the form: the starter DM three creators will receive, written from each creator's past DMs, with disclosure, claims, and link check chips. Each shows how many past DMs its voice comes from, and flags low confidence when there are fewer than two. Updates on every edit to the brief.
- Primary action: **Next: pick creators**.

## 2. Roster

**Job:** choose who to include, within budget.

- Summary bar on top: committed spend against the campaign budget, count of creators and new creators against the limit, and set-level warnings (for example, too many picks from one niche). Turns amber near the limit before it blocks.
- Warnings live where they apply. A warning about one creator sits in the table, directly under that creator's row, with the reason in numbers and Unpick or Keep anyway. A warning about the whole pick list sits in the summary bar and names the fix: the unpicked creators who would close the gap and fit the remaining budget, linked to their rows, with **Show in table** to filter to them. Those rows carry a chip saying what they add (for example, "Adds a non-skincare niche"). Nothing makes the brand hunt through the table for what a warning means.
- Benchmark legend above the table: the paid social CAC to beat, where it came from (the brief), and what green and red mean.
- Sort and filter row: sort by past CAC (default), CPL, fee, or followers; filter by niche, proven or new, backups only, and fits remaining budget.
- Table: pick checkbox, creator (niche, followers, backup tag), past CAC against the benchmark (green under, red over), past CPL, DM-to-purchase rate, engagement, and fee. Creators with no history show a "new" tag, not blanks.
- Not on this screen: campaign status and post dates. No one has been invited yet, so there is no status to show, and post dates are set with each creator after they accept. Both live on Creator status.
- Primary action: **Draft messages for N creators**.

## 3. Drafts and checks

**Job:** approve every message, in each creator's own words, without reading every message closely.

- Flow, shown as four steps at the top: starter drafted from past DMs → creator edits or accepts → checks re-run → brand approves.
- Counts: back from creators and passing, creator edits that need a fix, still with the creator.
- One card per creator: unique keyword, stage chip (with creator, creator edited, creator accepted as-is), the DM, caption call to action, a voice line, and a check chip.
- Voice line: how many past DMs the starter's voice comes from, and how much of the starter the creator changed. Low confidence is flagged when there are fewer than two past DMs, and those creators fall back to captions.
- A failed check highlights the offending phrase in the creator's edit and explains it in one sentence with a suggested fix (for example, a paraphrased banned claim, or a link missing the creator's code).
- Approve is disabled on failed rows; **Send back with fix** returns it to the creator. Rows still with the creator offer **Remind**.
- Bulk actions: **Approve all passing** and **Remind waiting**.

## 4. Creator status

**Job:** get every creator ready 3 days before they post.

- What this screen must say, in order: will every post go out on time; who needs action today, and what action; everyone else is fine.
- Readiness summary first: one sentence ("3 of 8 creators are ready. 2 are at risk."), then one bar split into four groups that never overlap: ready, on track, waiting on a reply, at risk. Each creator counts once, in their most urgent group, so the groups add up to the creators in the campaign. A declined creator who was replaced isn't counted.
- **Ready** means accepted, connected, test DM arrived, and DM approved.
- **At risk: act today** cards next: creator, post date, deadline badge, what's missing, and an AI-drafted nudge with Send and Edit. A creator at risk also offers **Swap in a backup**.
- Pipeline table: four-segment bar (invited, accepted, connected, ready), post date, and a note. Declined creators show who replaced them.

## 5. Readout

**Job:** in a minute, see whether creators beat paid social, and decide where each creator goes next.

The next campaign is usually a different launch, not a rerun, so the readout's output is a pool for each creator, saved to Creators, not a rebook list.

- **Verdict and scatter, always on top.** One sentence with the number that matters ("Creators beat paid social by 24%, once you take out @sunlit.sam"), a short line of facts (CAC with and without the outlier, new customers, hooks that converted with **Use in next brief**), then a scatter: fee across, new customers up, and the line where CAC equals the paid social goal. Above the line beats ads. Dots are colored by pool and labeled directly; hover shows creator, CAC, and one line. Position against a reference line is read before any text, so the outlier needs no sentence. On a phone, the scatter becomes a ranked list.
- **Where each creator goes next: one table.** The goals are the column headers, two lines each ("Primary goal / $65 customer acquisition cost", "Secondary goal / $4.00 cost per lead", "Reach (no goal set) / $17.45 per 1,000 impressions, average"). Pools are row groups, each opened by the same headline format: count and pool, the metric that placed them against its target, and a save action. Creator rows show only the value and beat, at par, or missed under each goal. The cell that placed them is outlined. One table, not separate cards, so every value sits under its goal.
- **Exact rules, printed on the page.** Beat: 10% or more better than the target. At par: within 10% either way. Missed: more than 10% worse. Targets come from the brief (CAC goal, secondary goal); a metric with no target uses the campaign average. A creator joins the first pool they qualify for: Converters (beat CAC), Lead builders (beat cost per lead), Reach (beat reach cost). Anyone who beats nothing goes to Test again on a first campaign with the brand, otherwise Don't rebook.
- **Custom pools.** A brand can add its own pool: a name, a metric (for example, cost per sign-up, DM-to-purchase rate, engagement, content reused as an ad), a target, and where it's checked in the order. It's saved to the brand and applied to every future readout, with a preview of who would qualify in this campaign.
- **Hooks.** A hook is the angle a creator's post used ("nurse explains sensitive skin"). The AI tags it from each post's caption after it runs, so the readout can say which angles converted. The creator isn't asked to define one.
- **Campaign data, below.** Views switch between Table and Funnel; filter by creator and pool; group by pool. The table includes impressions, leads, customers, sign-ups, CPL, and CAC.
- Attribution: a purchase counts to a creator whenever their code is used, whether it came from the link or was typed at checkout. Codes that leak to coupon sites are flagged when a creator's code use far outruns their DMs.

## States to design next

- Empty: first campaign with no brand kit and no history (roster shows every creator as "new").
- Loading: drafts generating per row, with rows appearing as they finish.
- Errors: a creator's account disconnects mid-campaign; the model can't judge a claim and asks a person.
- Creator side: the screen where a creator gets the starter DM, edits it, and sees checks before sending it back.
- Mobile: status and readout are the screens a brand checks on a phone; brief, roster, and drafts are desktop-first.
