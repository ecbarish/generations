# AC3.2: Brisket easier opening

Claim: [draft #233](https://github.com/ecbarish/idle-arcade/pull/233), dot engineering task for Adam, 2026-10-12. Adam reports the opening feels too tightly packed, particularly on his phone. No merge or publication is authorized.

## Focused change

Runs 1–3 ease into the existing crossing. Runs 4 onward have the exact original lanes, widths, positions, speeds and timers. Controls, hop duration, hit recovery, save key/format and old high scores are unchanged.

- Run 1 has three evenly spaced wagons per road instead of four unevenly spaced wagons. Every safe gap is 2.683 columns, rather than three 1.90 gaps and one 0.70 wrap gap. Run 2 keeps three wagons; run 3 restores four, evenly spaced; run 4 restores the original pattern.
- Run 1 base speed is 0.80 rather than 1.15 columns/second. The opening discount tapers to zero at run 4. Road clear windows are 3.16–3.73 seconds instead of the old worst-gap 0.57–0.68 seconds.
- Run 1 logs are 3.50/3.80 columns wide rather than 2.35/3.20, with evenly spaced starts. Fixed-column landing windows are 6.07–7.76 seconds rather than 2.83–4.55 seconds. Brisket still rides moving logs and can be carried off-screen.
- The first road starts with a clear gap at the spawn column. That initial gap lasts approximately 1.86 seconds, rather than placing a random wagon in the first step. It is not immunity.
- Run 1 delivery time rises from 42 to 56 seconds, tapering back to the original timer at run 4. Existing time-left scoring remains, so an equivalent fast first delivery can earn up to 14 extra points. Existing score records are retained unchanged.

The world continues to fill the available screen with 13 columns and 11 rows. The change creates more usable empty road and wider river platforms rather than shrinking artwork. No claim is made that a screenshot or automated solver proves phone enjoyment.

## Verification

Local model regressions pass: original gameplay/recovery checks, 100 seeds of cyclic spacing and first-hop/delayed-hop tests, and exact later-run compatibility across 12 seeds and runs 4–12. An independent exact-model search produced `routes.json`: each of five seeds (1, 2, 3, 17, 424242) reaches all five homes with all three lives, at .35-second decisions. Total first-run paths take 24.5–26.25 seconds. These are constructive reachability witnesses, not human success rates.

`baseline-model.cjs` is the unchanged v0.1.1 model fixture from source `19a7ee377e8097b3cdd47a7e15152663bbd7455e` (same bytes on starting main `0511c156141731aa9d6460f6962830420c423d29`). It is used only by tests/capture comparison, never the shipped game. Routes replay with `advance(.2, input)` followed by `advance(.15, {})`; a single .35 call would hit the model's .25 cap.

## Browser evidence and independent review

Implementation head `09b8603001bfabb07ebab8ce058c853e82c62dc2` passes [all 19 suites](https://github.com/ecbarish/idle-arcade/actions/runs/38280642757), including all 57 Brisket checks and old-v1-score reload. [Browser review](https://github.com/ecbarish/idle-arcade/actions/runs/38280642740) passes the existing 336 responsive/input checks and 448 new opening checks. There are 40 new captures across eight CSS viewports, plus the existing 70 responsive captures. Every viewport passes a real touchscreen first-road hop with intact moving hazards; all five timed route witnesses replay in each actual browser viewport.

At 375×812 the smallest road gap grows from 19.22 to 73.69 CSS pixels. At 320×568 it grows from 16.26 to 62.34 pixels. The canvas dimensions and mule scale stay unchanged. Inspected before/after portrait and landscape screenshots show visibly separated wagons, wider safe log landings and unchanged controls. Existing short-landscape lanes, small ultrawide mule and home-post/HUD overlap remain; this patch does not claim to resolve every layout issue.

Independent source review found no blocker, independently replayed every route witness, and verified later-round behavior. Independent visual review inspected portrait/landscape before-after, first touch, all-home, desktop and ultrawide captures and found no blocker; final-head CI status is tracked in the PR/Tower metadata. A documentation-only final commit may follow this implementation head; screenshots retain their exact source identity.

Selected original screenshots, unchanged from artifact `11761845137` (full ZIP digest `f479a2a86dd9dc29c1a239fd591d9cf5e609f1fd17bbd4f71bb51c8093de85a3`, expires 2027-01-10):

- [375×812 before](captures/375x812-before-opening.png), [after](captures/375x812-after-opening.png), [actual first touch](captures/375x812-after-first-tap.png), [all five lanterns](captures/375x812-after-home-5.png)
- [812×375 before](captures/812x375-before-opening.png), [after](captures/812x375-after-opening.png)
- [320×568 after](captures/320x568-after-opening.png), [1366×768 after](captures/1366x768-after-opening.png)
- [All opening metrics](captures/summary.json)

Local Chromium was unavailable in the preceding task, so GitHub Actions supplied browser execution. Chromium emulation is not physical-device or Safari testing. The timed routes establish reachable crossings, not human reaction success or enjoyment. Existing time-left scoring makes new records easier to achieve; score balance is intentionally changed, while saved records remain compatible.
