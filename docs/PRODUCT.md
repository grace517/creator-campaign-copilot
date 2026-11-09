# Creator Campaign Copilot: product brief

A prototype for brand and agency teams that run influencer campaigns with comment-to-DM automation. It does two jobs: launch a campaign across a creator roster without rebuilding the setup for each creator, and read out which creators drove action so the team knows where to move budget.

**Who it's for:** we assume our user is on the creator-partnerships team of a D2C skincare brand, running campaigns among many other priorities.

Everything here is built on public information and clearly labeled sample data. It is my read from the outside, written to serve as a starting point for product and design conversations.

## How influencer campaigns work (background assumptions)

These are working assumptions from public sources. In a real product build, we'd firm these up from real user interviews/product feedback, usage data, internal documentation, and competitive analyses (where applicable).

1. **Busy teams run campaigns among many other priorities.** We're building for a brand's influencer or creator-partnerships team, or an agency running campaigns for several brands at once.
2. **Creators are recruited before launch.** Brands find creators through discovery platforms, agencies, or their own network, then sign a contract (a statement of work) covering deliverables, posting dates, fee, content usage rights, and disclosure.
3. **Comment-to-DM sits after the contract.** Some brands now write comment-to-DM automation into the deal. The automation has to run on the account that published the post, so each creator connects their own Instagram account. A brand can't DM people who commented on a creator's post.
4. **Fees are mostly fixed.** Creators are usually paid a flat fee per deliverable, sometimes plus an affiliate commission. The floor of a campaign's cost is known once contracts are signed.
5. **The flow:** brief → creators accept → each creator connects and the automation is set → brand approves content and messages → creator posts → followers comment the keyword → DMs go out → clicks → purchases → readout → the brand sorts creators into pools for future campaigns.
6. **The brand is on the hook for what's said.** Sponsored posts need a clear disclosure (such as #ad), and brands in regulated categories (skincare, supplements, finance) have claims they can and can't make. Messages go out under the creator's name, but the brand carries the risk.
7. **Brands judge creators on cost per acquisition (CPA).** We assume the deciding metric for a D2C skincare brand is CPA from each creator (cost per purchase, from a new or returning customer), compared with CPA from paid social ads. Secondary: cost per lead (CPL), where a lead is someone who raises their hand by commenting the keyword and getting the DM; email or SMS sign-ups captured in the DM; and whether a creator's content is worth reusing as an ad. Reach and engagement help explain results but don't decide rebooking. This shapes both ends of the product: setup gives every creator a unique code, used as both their comment keyword and their checkout code, so each purchase traces to one creator whether the buyer taps the link or types the code, and the readout leads with CPA by creator.

## Core problems

| Problem | Evidence |
|---|---|
| **1. Setup repeats for every creator.** Each creator needs their own keyword, message, and automation, so a 30-creator campaign is 30 setups. | Vendors in this space market "launch once across many creators" as a selling point, which implies it's manual today. Agencies in DM-automation community forums describe managing one account per client and tracking logins in spreadsheets. |
| **2. Brand voice vs. creator voice.** Copy that sounds like the brand underperforms; copy that sounds like the creator can drift off-message or miss a disclosure. | Brand and agency teams need approvals before anything goes out under their name. Disclosure and claims rules apply to every sponsored post. |
| **3. Creators aren't ready by post date.** Connecting an account requires a professional account and, for some connection methods, admin access to a linked Facebook Page. | Instagram's connection requirements for automation tools; forum threads about failed (sometimes silent) connections. |
| **4. Brands don't have time to decipher dashboards.** They need the answer plainly: which creators worked, for what, and where to use them next. | Creator-campaign tools sell insight on "where your dollars go." Influencer teams are small relative to the number of creators they manage. |

## Goal

A brand manager can launch a campaign across a full creator roster in minutes, with every message checked before it goes out, and can tell from the readout, within a minute, whether creators beat paid social and where each creator goes next.

## What the prototype does

1. **Campaign brief:** product, offer, link, approved claims, banned claims, posting window, campaign budget, the paid social CPA to beat, and an optional secondary goal (cost per lead, sign-ups, or reach).
   - **Brand kit, set once:** voice, approved and banned claims, disclosure wording, and the product catalog. Every new brief starts prefilled from it, so campaigns stay on-brand without anyone retyping the rules.
   - **Start from a product link:** paste the product page and AI drafts the product, offer, and key benefits, using only approved claims. Anything on the page that isn't on the approved list gets flagged before it reaches a creator.
   - **Learn from past campaigns:** AI suggests the offer and hooks that brought in purchases at the lowest CPA last time, with the numbers behind the suggestion.
   - **See it before you send it:** as the brand edits the brief, it sees the starter DM two or three creators will receive, written from each creator's past DMs, so the brand sees what followers will likely get.

   The prototype builds the brand kit and the starter DM preview. Starting from a product link and learning from past campaigns come later.
2. **Roster:** pick creators already under contract (seeded from a sample roster; CSV import as a second path). Each creator shows their past results with this brand, ranked by CPA, with CPL, DM-to-purchase rate, and engagement rate beside it. Creators with no history are tagged "new."
   - **Sort by** past CPA (the default), CPL, fee, or follower count.
   - **Filter by** niche, track record (proven or new), backups only, and fee within the remaining budget.
   - **Prioritize against the budget:** as the brand picks creators, a running total shows committed spend against the campaign budget. The brand can set how many new creators to include, so it tests new talent without betting the campaign on it.
   - **Flag gaps in the mix:** too many creators in one niche, with the unpicked creators who would close the gap.
3. **Drafts per creator (AI):** a unique comment keyword, a starter DM in the creator's voice (written from their past DMs), a caption call to action, and a short creator brief. The creator edits or accepts the starter in their own words, and every version is re-checked before the brand approves it.
4. **Checks:** disclosure present, only approved claims, correct link and keyword, and message length. Every failure shows its reason.
5. **Approval board:** approve, send back with a fix, or remind each creator. Approve stays disabled while a check fails.
6. **Creator status:** invited → accepted or declined → account connected → ready. Anyone not ready 3 days before their post date gets an AI-drafted nudge, and the brand can swap in a backup from the roster. The screen sums up every creator as ready, on track, waiting on a reply, or at risk.
7. **Cost:** committed spend (the sum of contracted fees) up front, then actual CPA and CPL by creator in the readout.
8. **Campaign readout (AI):** a verdict on whether creators beat paid social, a scatter of fee against purchases with the CPA goal line, and a pool for each creator (Converters, Lead builders, Reach, Test again, Don't rebook) by an exact rule, plus custom pools. Pools save to the brand, so the next roster starts from them. Table and Funnel views sit below for checking. Runs on clearly labeled sample results.

## Success metrics (prototype targets)

| Metric | Target | How it's measured |
|---|---|---|
| Time to launch a campaign across 8 creators | Under 10 minutes | Timed in user tests |
| Starter DMs creators accept with light or no edits | 70% or more | Share of the starter changed, from Drafts |
| Rule violations caught by checks | 100% on the eval set | `evals/` pass rate |
| False flags on clean messages | 10% or less on the eval set | `evals/` pass rate |
| Testers who can say whether creators beat paid social, and which pool a creator is in | 3 of 3, within a minute | User tests |
| Creators ready by post date | Tracked, no target yet | Status board |

## Out of scope

- Recruiting new creators, negotiating fees, and contracts. Discovery platforms and agencies own this today.
- Real Instagram, TikTok, or automation-platform connections. All data is sample data.
- Payments to creators.
- Multi-touch attribution models.

## Open questions

- Do brands bring a contracted roster, or would they want help recruiting within the product?
- Who approves messages today: the brand, the agency, or the creator?
- Who pays for the automation account: the brand, the agency, or the creator?
- Is CPA the metric that decides rebooking, with CPL second, or is it something else?
  - Do these vary by brand? To what extent?
