# AC3.1 Brisket playtest fixes

Draft PR #180. Local model checks and syntax/diff checks pass. The main-branch model reproduces the immediate post-hit hop; the updated model rejects it during recovery and until held movement is released. Pause freezes recovery. Score save key and v1 format are unchanged.

The browser check page adds five ready-screen keys, held-input release gating, and old-score reload through the actual loader. Existing scenario setup resets transient recovery only when planting a separate collision fixture.

Visual verification is outstanding: the local Chromium executable was removed between sessions; Playwright's replacement download returned a truncated archive. No screenshots have been generated or reviewed. Keep this PR draft until phone, landscape and desktop captures are inspected.

Run from the repository root:

```
node tools/brisket-model-checks.cjs
node tools/run-all-checks.cjs briskets-crossing
node docs/playtests/brisket-ac3-1/capture.cjs
```

Set NODE_PATH to Playwright's modules if needed and CHROME_PATH to an installed Chromium executable. capture.cjs generates both normal and frozen recovery views at 375x812, 812x375 and 1366x768. Check the larger mule, tipped recovery pose, readable prompt and controls. Capture files are not present yet.
