# NM-HEADER-FIT

Claimed by Codex for Evan, 2026-10-17. Explicit request: resolve the Night Market baseline failure before continuing Wildbond registry integration.

Scope: reproduce and fix Back/cash layout at 568×320, preserve enlarged-text reflow and existing saves, run the unchanged layout checks and inspect screenshots. No progression, balance or save-format changes.

## Cause and fix

On the short landscape layout, the left column received 0.9fr while the work column received 1.1fr. At 568px, the header had only 236.875px. The Back target (152.3125px), 25-coins label (78.578125px) and 0.6rem gap need about 240.49px. The initial single-digit balance fit, but earning the 25 cups moved cash onto a second row.

The CSS now divides the two columns equally. The header has 263.203125px, so Back and 25 coins share a row. Both remain normal-flow flex items; enlarged text can still wrap. There is no text-size reduction, hidden label, forced no-wrap row or test relaxation.

The unchanged Night Market suite passes **423 checks**, including fresh/ready-to-hire/hired layouts, portrait and landscape controls, 200% text, save reloads and unrelated-save isolation. Before/after captures and measured boxes cover 568×320, 390×844, 844×390, 1366×768, 3440×1440 and 390×844 at 200% text. All after captures were inspected. These are browser engineering checks, not a physical-device playtest.

Evidence: [screenshots and capture script](../screenshots/night-market-header-fit/README.md). The required full aggregate run is recorded before submission.
