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

Pending: final-head GitHub aggregate checks, existing responsive/input regressions, actual browser before/after captures at 320×568, 375×812, 390×844, 667×375, 812×375, 1366×768, 1920×1080, 3440×1440; real animated first-road touch; rendered exact timed routes; independent source/visual review. Local Chromium could not be used in the preceding task, so GitHub Actions supplies browser execution. Chromium emulation is not physical-device or Safari testing.
