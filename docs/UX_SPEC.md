# UX spec

Five campaign screens, one per step a brand takes (brief, roster, drafts, creator status, readout), plus three app-level screens (Campaigns, Creators, Brand kit), phone layouts for status and readout, and the empty, loading, and error states. Mockups live in `design/` (source and rendered images) and use the sample data in `data/`.

## Principles

- **Start mostly done.** Every screen opens prefilled from the brand kit, the roster, or the last campaign. The brand edits; it rarely types from scratch.
- **Show the result while it's still cheap to change.** The brief previews real DMs as it's edited; the roster shows the budget as creators are picked.
- **Flag, explain, then block.** Problems surface in plain words with the cause highlighted. Only a failed check blocks an action, and the block says what fixes it.
- **One metric decides.** CPA orders the roster and is checked first when the readout places creators in pools. Past CPL, sign-ups, engagement, and reach stay visible for context but never set the order.
- **Every AI claim is checkable.** The readout's verdict and each decision tag sit next to the numbers behind them.

## Navigation

- **App level:** Campaigns, Creators, and Brand kit in the top bar. Creators and the brand kit are shared across campaigns; campaigns are where work happens.
- **Campaign level:** every campaign screen opens with a campaign header: breadcrumb (Campaigns / campaign name), the campaign name, its product, window, and budget, and a campaign switcher. The five steps sit under the name as a stepper, so they read as this campaign's progress, not app navigation.
- **Stepper:** connected circles. Completed steps are filled green with a check, the current step is white with a green outline, and steps not started are light grey. Every step is a link, and screen readers hear each step's state.

## 1. Brief

**Job:** set up a campaign in minutes, on-brand by default.

- Brand kit card, prefilled and labeled as such: voice, disclosure, approved claims (green chips), banned claims (red chips).
- Campaign fields: product, offer, product link, posting window, campaign budget, main goal (paid social CPA to beat), and an optional secondary goal: email and SMS sign-ups (the default, with an optional target cost per sign-up) or reach (always against the campaign average). The readout uses the secondary goal to say why a creator who missed on CPA may still be worth keeping. Each creator gets a code (NURSE20) that is both their comment keyword and their checkout code; the DM link carries it so it applies at checkout (…/serum?code=NURSE20).
- Starter DMs beside the form: the starter DM three creators will receive, written from each creator's past DMs, with disclosure, claims, and link check chips. Each shows how many past DMs its voice comes from, and flags low confidence when there are fewer than two. Updates on every edit to the brief.
- Primary action: **Next: pick creators**.

## 2. Roster

**Job:** choose who to include, within budget.

- Summary bar on top: committed spend against the campaign budget, count of creators and new creators against the limit, and set-level warnings (for example, too many picks from one niche). Turns amber near the limit before it blocks.
- Warnings live where they apply. A warning about one creator sits in the table, directly under that creator's row, with the reason in numbers and Unpick or Keep anyway. A warning about the whole pick list sits in the summary bar and names the fix: the unpicked creators who would close the gap and fit the remaining budget, linked to their rows, with **Show in table** to filter to them. Those rows carry a chip saying what they add (for example, "Adds a non-skincare niche"). Nothing makes the brand hunt through the table for what a warning means.
- Benchmark legend above the table: the paid social CPA to beat, where it came from (the brief), and what green and red mean.
- Sort and filter row: sort by past CPA (default), CPL, fee, or followers; filter by niche, proven or new, backups only, and fits remaining budget.
- Table: pick checkbox, creator (niche, followers, backup tag), past CPA against the benchmark (green under, red over), past CPL, DM-to-purchase rate, engagement, and fee. Creators with no history show a "new" tag, not blanks.
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

- **Verdict and scatter, always on top.** One sentence with the number that matters ("Creators beat paid social by 24%, once you take out @sunlit.sam"), a short line of facts (CPA with and without the outlier, purchases, hooks that converted with **Use in next brief**), then a scatter: fee across, purchases up, and the line where CPA equals the paid social goal. Above the line beats ads. Dots are colored by pool and labeled directly; hover shows creator, CPA, and one line. Position against a reference line is read before any text, so the outlier needs no sentence. On a phone, the scatter becomes a ranked list.
- **Where each creator goes next: pool cards.** One card per pool: name, count, the stat that placed them against its target (same format on every card), who's in it, what to use the pool for next, **View in table**, and **Save pool**. Creator-level numbers live once, in the table below; clicking a card filters the table to that pool, the same flag-then-show pattern as the roster's warnings.
- **Exact rules, one tap away.** In a tooltip next to "Create a custom pool", where a brand is deciding on a rule of its own. Beat: 10% or more better than the target. At par: within 10% either way. Missed: more than 10% worse. Targets come from the brief (CPA goal, secondary goal); a metric with no target uses the campaign average. A creator joins the first pool they qualify for: Converters (beat CPA), List builders (beat cost per sign-up), Reach (beat reach cost). Anyone who beats nothing goes to Test again on a first campaign with the brand, otherwise Don't rebook.
- **Custom pools.** A brand can add its own pool: a name, a metric (for example, DM-to-purchase rate, engagement, content reused as an ad), a target, and where it's checked in the order. It's saved to the brand and applied to every future readout. Once saved, its card and table rows show who it took.
- **Empty pools stay out of the way.** A pool with no creators this campaign gets no card, legend entry, or filter option. One muted line under the cards names them ("No creators this campaign: List builders"), so a custom pool that came out empty is still visible and removable.
- **Hooks.** A hook is the angle a creator's post used ("nurse explains sensitive skin"). The AI tags it from each post's caption after it runs, so the readout can say which angles converted. The creator isn't asked to define one.
- **Campaign data, below.** Views switch between Table and Funnel; filter by pool (set by clicking a pool card) and creator; group by pool. The last three columns are the goals, with the target in each header (CPA, goal $65; cost per sign-up, goal or campaign average; per 1,000 impressions, campaign average). Each value says beat, at par, or missed, and the value that placed the creator is outlined.
- Attribution: a purchase counts to a creator whenever their code is used, whether it came from the link or was typed at checkout. Codes that leak to coupon sites are flagged when a creator's code use far outruns their DMs.

## 6. Campaigns home

**Job:** see every campaign and the one thing each needs next.

- Table: campaign, a five-dot stepper with the current step named, "Next for you" (amber when something is at risk or failing), creators, committed against budget, and the result once there is one.
- Filters: Needs you, Live, Finished, All. **+ New campaign** opens a brief.
- Below: CPA from Converters against the paid social goal across campaigns, and **Start a campaign from Converters**, which opens a brief with the roster pre-picked from that pool.

## 7. Creators and pools

**Job:** keep the roster sorted by what each creator is good for, across campaigns.

- Pool tabs with counts (the five defaults, then custom pools, then **+ New pool**). Selecting one shows what the pool means, what it's for next, and **Start a campaign with these N**.
- Table: creator, pool, niche, campaigns run, last CPA, last cost per sign-up, fee, last campaign.
- A creator's pool is their latest readout's result. History is kept and shown ("Test again in Oct → Don't rebook in Dec"). A brand can pin a creator to a pool by hand; pins are labeled.

## 8. Brand kit

**Job:** set the rules once; every campaign and every check uses them.

- Voice, disclosure, and DM length limit.
- Goals: the paid social CPA to beat, with where it came from (entered by hand, or **Connect ad account** to compute spend ÷ purchases over the last 90 days), and the default secondary goal.
- Claims: approved and banned chips, each removable, with **+ Add**. Checks use these exactly; the AI also flags paraphrases of banned claims.
- Pools: the order they're checked, each rule in plain words, what each is for, custom pools marked as custom, and **+ New pool**. Drag to reorder.
- Products: name, link, default offer. A new brief picks a product and starts from its link and offer.

## Readout: Funnel view

The second view of the readout's data section. One row per creator plus a campaign total: impressions → comments → leads → clicks → purchases, each with its count and its rate from the step before. Grouped by pool by default. The footnote names the weakest step for the outlier, since that's where to look.

## Phone layouts

Status and readout are the screens a brand checks on a phone; brief, roster, and drafts are desktop-first.

- **Header:** menu button, product name, then a campaign strip with breadcrumb, campaign name, and "Step N of 5: screen name".
- **Creator status, phone:** the readiness sentence and bar, at-risk cards with full-width 44px buttons (Send nudge, Edit or Swap in backup), then everyone else as a list with one status chip each.
- **Readout, phone:** the verdict, then CPA by creator as a ranked list with the goal line, since a scatter doesn't read at 390px. Each row shows CPA and pool; an outlier bar caps at the edge and says "off scale." Pools are a tappable list that opens each pool's creators. The full table points to desktop.

## Empty, loading, and error states

- **Roster, first campaign:** every creator shows "new", never blanks or zeros; the roster sorts by fee and says it will sort by CPA after the first readout.
- **Drafts, writing starters:** a progress bar ("3 of 8") and rows that fill in as each starter finishes, so review can start early.
- **Drafts, the AI is unsure:** the phrase is highlighted, "Needs review" explains both readings, and Approve is blocked. **Mark as OK for this message** is logged and added to the eval set.
- **Drafts, a model call fails:** one automatic retry, then "Couldn't write a starter" with **Try again** and **Write it yourself**. Other rows aren't affected.
- **Status, an account disconnects mid-campaign:** pinned above everything until fixed. Says what stopped (DMs), what's still working (comments), how many people are waiting, and the 24-hour window to reply. **Send reconnect link**.
- **Readout, results still coming in:** labeled "Early results" with how many posts have run 7 days. Pools aren't set until the last post reaches 7 days.
- **Seeing these in the prototype:** the sample campaign never reaches these states on its own, so each of these screens has a "Sample state" picker (or `?state=` in the URL: `first-campaign`, `writing`, `failed`, `disconnected`, `early`).
