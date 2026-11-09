# Design mockups

Every screen, as designed on the Claude Design canvas:

| Screen | Source | Rendered |
|---|---|---|
| 1. Brief | `Main.dc.html` | [screens/1-brief.png](screens/1-brief.png) |
| 2. Roster | `Roster.dc.html` | [screens/2-roster.png](screens/2-roster.png) |
| 3. Drafts and checks | `Drafts.dc.html` | [screens/3-drafts.png](screens/3-drafts.png) |
| 4. Creator status | `Status.dc.html` | [screens/4-status.png](screens/4-status.png) |
| 5. Readout | `Readout.dc.html` | [screens/5-readout.png](screens/5-readout.png) |
| 5b. Readout, Funnel view | `ReadoutFunnel.dc.html` | [screens/5b-readout-funnel.png](screens/5b-readout-funnel.png) |
| 4b. Creator status, phone | `PhoneStatus.dc.html` | [screens/4b-status-phone.png](screens/4b-status-phone.png) |
| 5c. Readout, phone | `PhoneReadout.dc.html` | [screens/5c-readout-phone.png](screens/5c-readout-phone.png) |
| 6. Campaigns home | `Campaigns.dc.html` | [screens/6-campaigns.png](screens/6-campaigns.png) |
| 7. Creators and pools | `Creators.dc.html` | [screens/7-creators.png](screens/7-creators.png) |
| 8. Brand kit | `BrandKit.dc.html` | [screens/8-brand-kit.png](screens/8-brand-kit.png) |
| 9. Empty, loading, and error states | `States.dc.html` | [screens/9-states.png](screens/9-states.png) |

The `.dc.html` files are the source: plain HTML with inline styles, plus a small `renderVals()` block where a screen repeats rows. They render on the canvas, not on their own, so use the PNGs to see each screen and the source for exact copy, colors, and spacing. `canvas.json` holds the layout and the UX notes beside each screen. The reasoning is in [docs/UX_SPEC.md](../docs/UX_SPEC.md).

All brands, creators, and numbers are fictional sample data from `data/`.
