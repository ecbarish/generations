# DM3: coach hiring and development evidence

Base: latest main `92cd25e` (including LB1 shared sports-office), integrated into the task branch. No shared-module edits.

- `node tools/run-all-checks.cjs`: all browser pages and native suites; see PR #196 for final counts.
- `node tests/diamond-coaches-ui.cjs http://localhost:8770`: isolated browser contexts at 375x812, 1366x768, 1920x1080, 3440x1440. The server is a temporary serve.ps1 instance pointed at this task checkout; no other server or player's saves are used.
- Seed 177 plays season one, completes its draft, opens the actual Coaches tab, verifies six candidates, hires Fara Morrow through the button, and checks cash goes from 1000 to 750 exactly once. It resolves expiring contracts using real roster functions, fills any gaps with league-minimum free agents, starts season two, and simulates it and its final.
- Season two's report names five actual coached players and their rating gains; the staff contract expires, and season-three candidates appear. No horizontal document overflow or browser exceptions at any size.
- The 63 Diamond Manager checks include ten new coach cases: old saves, deterministic offers/RNG isolation, role/phase/affordability/duplicate safeguards, exact development increments, age/ceiling/rating caps, contract reload, genuine report/expiry and malformed imported reports.

`candidates-*`, `hired-*` and `report-*` are real browser screenshots, not mockups. Phone cards replace the initial cramped table; the clipboard scrolls inside the game window. These checks establish functionality and readability, not long-term economic balance. Costs ($250K youth, $300K speciality, $350K general) and one-season cash contracts are initial design choices for review.
