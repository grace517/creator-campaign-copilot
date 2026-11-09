# Creator Campaign Copilot

Launch an influencer campaign across a whole creator roster in minutes, with every message checked before it goes out, then see which creators actually drove action.

**Status:** prototype in progress. All brands, creators, and results in this repo are fictional sample data.

## Why I built it

Brand teams that use comment-to-DM automation in creator campaigns repeat the same setup for every creator: a keyword, a message, a check that the creator's account is connected. Then they wait on a dashboard to tell them who worked. I wanted to see how much of that an AI could draft and check, and where a person still needs to approve.

## What it does

1. **Brief in:** product, offer, link, approved and banned claims, posting window.
2. **Drafts out, per creator:** a unique keyword, a starter DM written from the creator's past DMs, a caption call to action, and a short creator brief. The creator edits or accepts it in their own words.
3. **Checks on every version:** disclosure, claims, link, keyword, and length, re-run on the creator's edits, each failure with its reason.
4. **Approval board and creator status:** approve, edit, or regenerate; track who has accepted and connected; nudge anyone who isn't ready before their post date.
5. **Readout:** whether creators beat the brand's paid social CPA, shown as a scatter of fee against purchases, and a pool for each creator (Converters, Lead builders, Reach, Test again, Don't rebook) by an exact rule, so the next roster starts from proven groups.

## Docs

- [Product brief](docs/PRODUCT.md): how campaigns work, the problems, goals, and success metrics
- [Decisions](docs/DECISIONS.md): what I chose and why
- [UX spec](docs/UX_SPEC.md): the five screens, their jobs, and the design principles behind them
- [Build plan](docs/BUILD_PLAN.md): screens, data model, and build order
- [Evals](evals/README.md): test cases for the message checks
- [Design](design/README.md): the five screens, as source and as rendered images
- [Sample data](data/README.md): what each file holds

## Run it

_To be filled in once the app is built._
