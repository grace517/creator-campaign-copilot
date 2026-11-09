# Decisions

Newest first. Each entry: what I decided, why, and what would change my mind.

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
