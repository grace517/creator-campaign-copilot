# Decisions

Newest first. Each entry: what I decided, why, and what would change my mind.

## 2026-11-10: The demo cache is model output, generated in CI and reviewed before it's committed

**Decision:**
- **What's cached:** starter DMs for all ten creators and the claim judgments on every message the app shows now come from the real prompts, replacing the design copy.
- **How it's made:** a GitHub Actions workflow (read-only, with the repository's API key) generates them and uploads them for review. A person checks them before they go in through a PR.
- **Claim judgment context:** it now gets the product name and offer.

**Why:**
- **Real output:** the build plan's demo mode is "generated once from the real prompts", so the demo should show what the model actually writes and flags, not the design's ideal copy.
- **Review step:** the first generation flagged the product's own name, "the barrier repair serum", as an unapproved claim in 3 of 6 starters, even though a name isn't a claim. Reviewing before committing is how that got caught. Giving the judgment the name fixed it, and both starters are now eval cases (22, 23).

**Known difference from the design:**
- **Three "Needs a person" results:** the model marks three messages "unsure", so the Drafts counts differ from the mockup (2 passing and 3 needing review, not 3 and 2): @calm.complexion's edit and starter ("Redness-prone friends…") and @nightshift.nia's starter ("…for shift skin").
- **Open question:** whether an audience callout counts as a claim is a product call, not a prompt tweak.

**Would change if:** the brand decides audience callouts aren't claims. The judgment prompt would then say so, with eval cases first.

## 2026-11-09: Claim judgment runs on Claude Opus 5.5 at high effort, and an unreadable answer means "Needs a person"

**Decision:**
- **Model:** the claim judgment is pinned to `claude-opus-5-5` with effort `high`.
- **Fallback:** server-side fallback is on, so a safety decline is re-run on another model instead of failing.
- **Bad answers:** one bad-shape answer (wrong JSON, or a highlighted phrase not copied exactly from the message) gets one retry. After a second bad answer, or a refusal, the result is "unsure": approval is blocked and a person decides.
- **Live endpoint:** `/api/check-claims` stays off (503) unless `LIVE_AI_ENABLED=true`.

**Why:**
- **Misses ship:** a missed health claim goes out under a creator's name, while a false flag costs a click. That's why effort is high and why "can't tell" never becomes "pass".
- **Pinned model:** keeps eval results comparable from run to run.
- **Endpoint off by default:** keeps a public preview link from spending credits before the Live AI toggle and its rate limit exist (feat/10).

**Would change if:** evals show a cheaper effort or model holds 100% recall with ≤10% false flags. That change would be its own PR with a full eval run, per docs/TESTING.md.

## 2026-11-09: Exact checks count "#ad" anywhere, as a whole tag

**Decision:** The disclosure check passes when the message contains `#ad`, `#sponsored`, or "paid partnership" anywhere, in any case. `#ad` must be a whole tag ("#adorable" doesn't count). The brand kit asks for the disclosure on the first line, but the check doesn't enforce position.
**Why:** The build plan defines the check as "contains". The eval set doesn't test placement. Failing every message with `#ad` at the end would add false flags the targets don't allow for.
**Would change if:** the brand's legal guidance requires the disclosure up front. The check would then fail any disclosure after the first line, with eval cases added for it first.

## 2026-11-09: Roster warning thresholds, and what counts as one niche

**Decision:**
- **Mix warning:** fires when one niche group is more than half of the picks.
- **Niche groups:** skincare, skincare education, sensitive skin, and budget beauty count as one "skincare" group. Every other niche is its own group.
- **Suggested fixes:** unpicked creators outside that group whose fee fits the remaining budget. A fix never includes anyone who'd trigger the 3x CPA warning: unpicking @sunlit.sam shouldn't lead the brand straight back to him.
- **Budget bar:** turns amber at 90% of the budget and blocks "Draft messages" over 100%.
- **New creators:** going over the limit also blocks, and the reason sits under the bar.

**Why:** These rules reproduce the design's numbers from the sample data (5 of 8 skincare, @runwithrio as the fix). The design also asks for a warning that names a fix, not one that hands the brand a new problem.
**Would change if:** brands care about a different split (audience gender, platform, follower tier), or set their own niche groups in the brand kit.

## 2026-11-09: The Brief's starter preview is cached; edits re-run the checks, not the wording

**Decision:** In demo mode, the three starter DMs beside the brief come from `data/cached/starter_dms.json`. Editing the brief re-runs the Disclosure, Claims, and Link checks on them at once. The wording stays as cached, and a note says so once the brief differs from the one they were written for. For now the cached text is copied from the Brief design, labeled `"source": "design"`. It gets regenerated from the real prompt when starter generation lands (feat/05-drafts), where the build plan puts it.
**Why:** The public link shouldn't spend API credits on every keystroke, and no model output exists yet to cache. Re-running the checks keeps "updates as you edit the brief" true where it matters most: change the product link and every starter's Link check fails, with the reason, before anyone moves on.
**Would change if:** testers expect the wording itself to change as they type, in which case the Live AI toggle should regenerate starters (debounced) when the brief changes.

## 2026-11-09: Public demo runs on cached AI output; live AI sits behind a toggle

**Decision:** The hosted prototype serves cached model outputs by default, generated from the real prompts. A rate-limited "Live AI" toggle calls the API through a serverless function.
**Why:** Anyone with the link should see the whole flow instantly, and an open link shouldn't spend API credits or expose the key.
**Would change if:** the audience is a small, known group, in which case live calls by default show the AI working.

## 2026-11-09: Design every screen before the build

**Decision:** The app-level screens (Campaigns, Creators, Brand kit), the Funnel view, phone layouts for status and readout, and the empty, loading, and error states are designed and specified, not left to the coding agent. Every model call has a written prompt spec.
**Why:** What isn't designed gets invented during the build, and invented screens drift from the product's logic.
**Would change if:** a screen turns out to need nothing beyond an existing pattern.

## 2026-11-09: CPA replaces CAC as the deciding metric

**Decision:** Creators are judged on cost per acquisition (CPA): fee divided by purchases, whether the buyer is new or returning. The paid social benchmark is CPA too. Earlier entries below say CAC; read them as CPA.
**Why:** A brand running a creator campaign wants purchases. Whether a buyer is new matters less here than whether the creator drove the sale, and most brands can't reliably tell new from returning at the creator level anyway.
**Would change if:** a brand's goal is specifically new-customer growth, in which case CAC (new customers only) is the right lens and the data needs a new-customer flag.

## 2026-11-09: Brands can add custom pools; hooks are tagged from posts

**Decision:** Beyond the five default pools, a brand can define its own (name, metric, target, order), saved to the brand. Hooks are tagged by the AI from each post's caption after it runs.
**Why:** Brands value creators for things the defaults don't cover, like sign-ups or content they can reuse as ads. Tagging hooks from the post adds no work for creators and records what they actually did, not what they planned.
**Would change if:** captions don't carry the angle (for example, it's all in the video), in which case the tag needs the transcript, or the creator names the angle when sending their draft back.

## 2026-11-09: The readout sorts creators into pools, by an exact rule

**Decision:** The readout leads with a verdict and a fee-vs-customers scatter with the CAC goal line, then puts each creator in one pool (Converters, Lead builders, Reach, Test again, Don't rebook). Beat, at par, and missed are defined to the percent and printed on the page. Saved pools feed Creators so the next roster starts from them.
**Why:** The next campaign is usually a different launch, so "rebook" was the wrong output. A pool says what a creator is good for, including a creator who loses on CAC but wins on leads or reach. A scatter shows spend and results together, which a ranked bar can't.
**Also fixed:** the earlier readout mockup said 435 customers and a $63 blended CAC. The sample data has 415 customers, so blended CAC is $66, and $49 without the outlier.
**Would change if:** brands mostly rerun the same product with the same creators, in which case a rebook list is the simpler output.

## 2026-11-09: The brief sets an optional secondary goal

**Decision:** Beside the paid social CAC benchmark, the brand can pick one secondary goal with a target: cost per lead, email and SMS sign-ups, or reach.
**Why:** CAC still decides, but a creator who misses it can be worth keeping for something else, like cheap leads. Without a stated secondary goal, the readout can only say "close to the line."
**Would change if:** brands rarely set one, or set several, in which case the readout should show all three against campaign averages instead.

## 2026-11-09: Steps belong to a campaign, not the app

**Decision:** The five steps move from the top bar into a campaign header, as a stepper under the campaign name. The top bar holds app-level areas: Campaigns, Creators, and Brand kit. A breadcrumb and campaign switcher show there are other campaigns.
**Why:** A brand runs several campaigns at once. Steps in the top bar read as the whole app, and hid the path to other campaigns.
**Would change if:** brands mostly run one campaign at a time, in which case the campaign list matters less than a fast path to the current one.

## 2026-11-09: Roster shows only what helps pick; warnings sit on the row they're about

**Decision:** The roster drops campaign status and post dates, and shows one-creator warnings directly under that creator's row. Warnings about the whole pick list go in the summary bar.
**Why:** At the roster step no one has been invited, so a status like "accepted" can't be true yet, and post dates get set with each creator after they accept. A warning at the top of the page made the brand search the table for the row it meant.
**Would change if:** brands pick around known availability (for example, a creator already booked that week), in which case an availability column earns its place.

## 2026-11-09: Per-creator codes instead of a shared tracked link

**Decision:** Each creator gets a code (NURSE20) that is both the comment keyword and the checkout code. The DM link carries the code so it applies at checkout, and a purchase counts to the creator whenever the code is used, clicked or typed.
**Why:** Codes are the common pattern in creator deals, and they catch buyers who never tap the link but type the code later. Putting the code in the link keeps the one-tap path. Making the keyword match the code means followers only learn one word.
**Would change if:** code leakage to coupon sites inflates creator numbers enough to distort CAC, in which case link clicks would need to count for more.

## 2026-11-09: Creators edit a starter DM; checks re-run on every edit

**Decision:** The AI writes each creator a starter DM from their past DMs (captions when they have none). The creator edits or accepts it, every version is re-checked, and the brand approves last. Drafts shows each creator's stage, how many past DMs the voice comes from, and how much of the starter they changed.
**Why:** Followers should hear the creator, not the brand, so the creator owns the final words. That only works if most creators start from the suggestion, and if their edits can't slip a banned claim or a broken link past the brand. Past DMs are the closest proxy for DM voice; how much a creator rewrites is a running check on whether the starter sounded like them.
**Would change if:** creators mostly ignore the starter and write from scratch, in which case the brief's preview space should show the rules instead of sample copy.

## 2026-11-09: CAC decides rebooking; CPL is secondary

**Decision:** Customer acquisition cost (CAC, cost per customer who purchases) is the deciding metric, compared against the brand's paid social CAC. Cost per lead (CPL, cost per person who comments the keyword and gets the DM) and email or SMS sign-ups are secondary.
**Why:** A D2C brand weighs creators against its other acquisition channels, and paid social is the usual comparison. Reach and engagement explain results but don't pay back the fee.
**Would change if:** brands say they rebook on something else, or the deciding metric varies too much by brand to default.

## 2026-11-09: Build the brand kit and live DM preview into the brief

**Decision:** The brief starts prefilled from a brand kit (voice, approved and banned claims, disclosure, products), and a live preview shows a sample DM in two or three creators' voices as the brand edits. Drafting from a product link and suggestions from past campaigns come later.
**Why:** These two make the brief fast and on-brand with sample data alone, and they demo well. The other two need real product pages or real campaign history.
**Would change if:** testers say writing the brief isn't where their time goes.

## 2026-11-09: Show past results on the roster, ranked by CAC

**Decision:** When a brand picks creators for a campaign, each creator shows their past CAC, CPL, and DM-to-purchase rate with this brand, plus engagement rate as a secondary column. Creators with no history are tagged "new."
**Why:** The readout from one campaign should shape who gets picked for the next. Engagement predicts reach, not action, so it doesn't decide the ranking.
**Would change if:** campaign managers say they pick creators on something else, such as audience fit or content quality.

## 2026-11-09: Start from a contracted roster, not recruiting

**Decision:** The prototype assumes creators are already under contract. Recruiting and contracts are out of scope.
**Why:** Comment-to-DM runs after a deal is signed, and discovery platforms and agencies already own recruiting. Starting at launch keeps the prototype on the step that's manual today.
**Would change if:** campaign managers say finding and contracting creators is the bigger pain.

## 2026-11-09: Include a campaign readout

**Decision:** Ship a readout screen on sample results alongside the launch flow.
**Why:** The point of the campaign is knowing who to rebook. A launch tool without the readout stops at the step the brand cares about least.
**Would change if:** testers say their existing dashboards already answer this well.

## 2026-11-09: Check every AI draft before a person approves it

**Decision:** Every drafted message runs through disclosure, claims, link, keyword, and length checks before it reaches the approval board. A failed check blocks approval until fixed or overridden with a reason.
**Why:** Messages go out under the creator's name, but the brand carries the risk. Drafting at scale only helps if the checks are trustworthy, so the checks have their own eval set.
**Would change if:** brands say the approval step is enough on its own.

## 2026-11-09: Deprioritize delivery reconciliation

**Decision:** Leave out the comparison of comments vs. DMs sent vs. delivered.
**Why:** Public forums show silent DM failures, but AI-assisted setup and insight is the bigger open opportunity for brand teams, and delivery depends on platform rules a prototype can't test.
**Would change if:** brand teams say delivery accuracy is a known problem for them.
