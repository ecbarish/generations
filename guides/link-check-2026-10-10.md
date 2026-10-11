# Guide link and picture check — 2026-10-10

AR2.4 / X2, PR #158. Checked main `a925437a372c3e66d251b49389792adb8cafe7ed`. **No broken local links, missing fragments, invalid pictures or browser failures found. No reader-page repair was necessary.**

| Check | Coverage | Result |
| --- | --- | --- |
| HTML destinations and fragments | 6 guide pages + playtest.html; 140 local href/src references | all files and HTML fragment IDs exist |
| Image files | 22 distinct images | Pillow verifies every file |
| Actual browser rendering | 7 pages × desktop 1366×768 / phone 375×812 | 14 views, no horizontal overflow or page errors |
| Browser image decoding | 52 image appearances across both sizes | all decode with positive native dimensions |
| Local HTTP destinations | 45 unique page / asset URLs | all return success |
| External issue-form links | bug.yml and feedback.yml | both templates exist at the checked revision |

[Browser evidence](link-check-2026-10-10.json) records each page, viewport, image dimensions and HTTP destination/status. Links are checked with Python's HTMLParser: local destinations are resolved relative to each page and fragment IDs matched against the target HTML. Images are verified with Pillow and decoded again by Playwright Chromium headless shell. Browser contexts are isolated; no games are played and no player saves are used.

Scope is `guides/*.html` and `playtest.html`, including their linked local targets and displayed pictures. No assertion about the correctness of game instructions, future content changes, live deployment or signed-in GitHub issue submission is made. External issue links are validated against repository templates; no issue is submitted.

Only evidence and task/status notes are added. No game, shared engine, reader HTML/CSS, picture, save, version or preview-export changes. GitHub CI must still run before any merge; this task's relevant static and browser checks passed locally.
