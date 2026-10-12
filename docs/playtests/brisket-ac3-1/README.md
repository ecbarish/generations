# AC3.1 Brisket responsive presentation review

## Published and verified

[Play Brisket v0.1.1](https://ecbarish.github.io/generations/games/briskets-crossing/). Adam approved merge and live verification at 16:26 UTC. #180 merged as `19a7ee377e8097b3cdd47a7e15152663bbd7455e`. [Pages deployment](https://github.com/ecbarish/idle-arcade/actions/runs/38277598883) and the merged-main [19-suite run](https://github.com/ecbarish/idle-arcade/actions/runs/38277600145) passed.

The [public runtime verifier](https://github.com/ecbarish/idle-arcade/actions/runs/38278202817) passed **31 checks at 2026-10-12 16:34:14.742 UTC**: eight public game/shared files exactly match their reviewed SHA-256 values; public localhost-only debug hook is absent; three browser sizes show preserved old scores, keyboard start, uniform rendering, readable real-hit recovery, pause/rotation/resume, unchanged score reload and no runtime errors. These are actual public URL interactions, without injected game hooks. A separate network read independently matched all eight Git blob hashes at 16:32 UTC.

[Machine-readable live verification](live/verification.json) · [independent hashes](live/independent-hashes.json) · [portrait recovery](live/375x812-recovery.png) · [landscape recovery](live/812x375-recovery.png) · [desktop recovery](live/1366x768-recovery.png). Live images are original and inspected. Full six-image artifact [11759379108](https://github.com/ecbarish/idle-arcade/actions/runs/38278202817/artifacts/11759379108), ZIP SHA-256 `58f286a91d3df60e8841155be128ba7fa3818126531c3790bc9106c57ad5662b`, retained through 2027-01-10.

The first public-verifier run incorrectly asked Playwright to wait for a hidden element to be visible; the game had correctly hidden the caption. The verifier now explicitly waits for hidden state and passed. No game changes were needed. #231 is the scoped documentation/verifier handoff; release gameplay bytes stay identical.

The remainder records development and historical pre-release decisions; earlier statements of no merge approval or draft status are superseded by this publication record.

## Responsive correction, approved 2026-10-12

Adam approved continuing #180 to fix the landscape squash and tiny recovery caption. The crossing still fills the available cabinet: its 13 columns and 11 lanes adapt to the viewport, while the mule and decorative details use one uniform scale. The responsive grid intentionally has rectangular cells; this is not a letterboxed square world or a claim of square cells.

Canvas drawing uses uniform device-pixel scaling. Mule normal/recovery bounds fit their cells, wheels stay square, and item widths still span their exact logical collision width. Recovery and release guidance use a separate pointer-transparent DOM overlay at **16–20 CSS pixels**, respecting text settings. Lantern-clear text also uses CSS-pixel sizing. The existing save-error notice remains separate.

No changes to model rules, collision dimensions, movement speed, recovery timing, scores, save keys/formats or input actions in this responsive follow-up. The existing inverse tap mapping is preserved.

## Final verified implementation

Head `527b28a900b36e155c4bde1969fd5fcc324f6e6e` passes [all 19 aggregate suites](https://github.com/ecbarish/idle-arcade/actions/runs/38276247750), including native Wildbond 1,510 and Starfall 264. The [final responsive rerun](https://github.com/ecbarish/idle-arcade/actions/runs/38276247762) passes the old-fixture reproduction, 57 Brisket checks and 336 responsive checks, producing 70 fresh images. The bounded-hop synchronization change passes. Final artifact 11759600233, ZIP SHA-256 `c9c2678ce8ee480cfb5ff96a43aac54f25322021160f78ad44089b2059057a01`. Subsequent check-in edits are documentation only; latest-head status remains in the PR.

## Evidence and independent review

Render implementation and capture head: `1bda9e51f44a5044d274ce8a18d1f8869605da25`; CI merge: `88861482ce9b5f6414951f665647956a66cea042`, based on main `07403b4b7512da4abef44704d7fda510914030b0`.

[Responsive review run](https://github.com/ecbarish/idle-arcade/actions/runs/38275487015) passes **336 checks** in **14 configurations**, producing **70 screenshots**:
- 320×568, 375×812, 667×375, 812×375, 1366×768, 1920×1080, 3440×1440, each at DPR 1 and 2.
- Normal, recovery, awaiting release, lantern-clear and paused states.
- All four actual touchscreen tap directions before/after repeated rotation; final position and lives checked.
- Full available world, uniform canvas transform, ≥44px controls, no document overflow, readable captions, pointer transparency, preserved injected save-warning fixture, caption clearing on title/next-player transitions, and zero browser runtime errors.
- The unchanged Brisket suite passes all **57 checks**, including keyboard/touch/gamepad flows, two-player turns and actual v1-score reload. Model/recovery checks pass.
- A first, older harness iteration used a fixed 230ms delay and intermittently asserted before an ultrawide DPR2 hop finished. The final harness waits up to 3 seconds for the expected completed hop, retaining the same final position and life assertions. No retry input or skipped assertions.

Independent review inspected source and 13 representative images spanning every size and all five states, with no blocking code or visual finding. Reviewed improvements: normal/tipped mule proportions, square wagon details, legible captions, clean wrapping on 320px, menus/controls within screen, and full cabinet use. Final-head CI and the harness-only synchronization adjustment are recorded in [PR #180](https://github.com/ecbarish/idle-arcade/pull/180); the existing full `Checks` workflow and aggregate runner are unmodified.

### Retained original responsive captures

- [Small phone](responsive/320x568-dpr1-normal.png)
- [Portrait recovery](responsive/375x812-dpr1-recovery.png)
- [Landscape normal](responsive/812x375-dpr1-normal.png)
- [Landscape recovery](responsive/812x375-dpr1-recovery.png)
- [Landscape release](responsive/812x375-dpr1-release.png)
- [Desktop](responsive/1366x768-dpr1-normal.png)
- [All measured configurations](responsive/summary.json)

All 70 original images: [artifact 11759161059](https://github.com/ecbarish/idle-arcade/actions/runs/38275487015/artifacts/11759161059), retained through 2027-01-10. Downloaded ZIP SHA-256: `ccf7da9ff4b438404e3adfe75a6504d0f236ed2fc02451f2f3ac0976e0ad460a`. The six selected PNGs are committed unchanged; original pre-correction PNGs below are preserved separately.

## Limits

Chromium viewport/touch emulation is not physical Android/iOS or Safari validation. Existing HUD placement can overlap parts of the top home-post area; ultrawide artwork retains a modest deliberate size cap. These are existing presentation limits, not new blockers found in this scoped correction. Human fun validation remains separate. No merge or publication is authorized; the PR remains draft for Adam's decision.

---

## Historical fixture-repair and pre-correction review

The following is the original 15:34 review. Its landscape caveat motivated the approved responsive correction above; its screenshots deliberately retain the **before** state.

## Verified repair, 2026-10-12

Adam transferred completion of draft #180 to dot's engineering task, including narrow fixture repair, current-main conflict cleanup, full checks and visual QA. No merge or publication is authorized.

Implementation head: `3d371915237e67ed879ecfde392f1137efffac56`. Reconciled main: `66bd60ee88a4c6c81f22dfc4d1861e7eb05752b3`. GitHub tested merge tree: `370808826607f3c3f2634e0f46ba22baa3ba44ba`.

The five launch-key cases left the game playing. The following two-player case clicked a title-menu button that was no longer present. The repair calls `H.title()` before that click. No assertions were removed, skipped or weakened; gameplay/model code is unchanged from the original #180.

- [Before/after browser run](https://github.com/ecbarish/idle-arcade/actions/runs/38270050294): the original test from `037a003` reproduces `Cannot read properties of null (reading 'click')`, then the repaired page passes all **57 checks**.
- [Full current aggregate](https://github.com/ecbarish/idle-arcade/actions/runs/38270050134): **all 19 suites pass**, including Wildbond Godot 1,510 and Starfall Godot 248, with zero failures.
- Brisket model and held-input recovery regressions pass locally and in CI. Syntax checks pass.
- The browser suite covers all five launch keys, no launch hop, keyboard/touch/gamepad movement, pause/resume, repeated injury and release gating, separate two-player turns, score entry and actual old-v1-score reload. Six layout sizes and larger phone text retain the existing assertions.

## Actual browser screenshots

These six PNGs are original, unmodified Chromium 141 / Playwright 1.56.1 screenshots, generated by `capture.cjs` on the implementation head above. Their blob hashes match the downloaded artifact. Normal and recovery states are intentionally frozen using the localhost-only test hook; they are not claims of physical-device testing.

| View | Normal | Recovery |
|---|---|---|
| Portrait 375×812 | [phone](phone.png) | [phone recovery](phone-recovery.png) |
| Landscape 812×375 | [landscape](landscape.png) | [landscape recovery](landscape-recovery.png) |
| Desktop 1366×768 | [desktop](desktop.png) | [desktop recovery](desktop-recovery.png) |

Artifact [11755999176](https://github.com/ecbarish/idle-arcade/actions/runs/38270050294/artifacts/11755999176), ZIP SHA-256 `ad7d27d666ae68873154cb713a61db8b561e38f488101cd717d4c76981d5b8f5`, retained through 2027-01-10. Retained PNGs remain available in this repository.

## Visual caveat: not a full landscape-quality pass

All six images were inspected. The bigger mule, tipped recovery pose, controls and pause button are visible. However, the existing canvas stretches its 640×640 world independently in X/Y. At 812×375 the world is approximately 794×266 CSS pixels, a roughly 3:1 distortion. The new 18px recovery caption becomes approximately 7.5 CSS pixels high, and the mule is flattened. Portrait is vertically stretched; desktop is widened.

The nonuniform renderer scaling predates #180 and was not changed by the fixture repair. Its effect on #180's new caption is newly documented here. Passing overflow/target-size assertions does **not** establish readable canvas art. Treat aspect-correct scaling/caption legibility as unresolved visual polish for the merge decision; do not describe this review as a full landscape-quality pass.

## Scope and limits

Current shared documentation was preserved and the specific AC3.1 claim/session notes restored. The branch is conflict-free against the reconciled main. No unrelated game, save format, global runner or existing Checks workflow was changed. The extra read-only review workflow reproduces the old fixture in a temporary working copy and restores the committed test before running the repaired suite.

Local Chromium launch is blocked by this cloud sandbox's socket restrictions, including the escalation attempt; actual browser verification ran in GitHub Actions instead. Screenshots use desktop Chromium viewports, not real Android/iOS hardware or Safari. Human fun validation is separate. The draft stays unmerged and unpublished.
