# NM-LAUNCH-POLISH

Evidence for the Night Market polish pull. The game version, the README changelog and the checklist ticks stay with the Reviewer.

## What a player sees

On a phone layout, the line under the pour bar is 16px. It was 14.72px, from `0.92rem`. A wide window still uses 0.92rem. The phone layout is the same cutoff the page already uses, `max-width: 1000px`, so 390, 844 and an 820-wide tablet all get 16px. 1280 and 1920 stay 14.72px.

If reduced motion turns on while someone is walking the lane, that person leaves the picture. The lane holds a still frame. A sale can still show one still coin.

Your save downloads this game's version 1 file, refuses another game's file without asking to replace anything, and a reload after time away shows "While you were away". A second reload keeps the stall. Other games' saves stay byte for byte as they were.

## Checks

`node tools/run-all-checks.cjs night-market` passed 462 checks on this tree. The full `node tools/run-all-checks.cjs` then passed 24 suites on this machine. Godot was skipped here because the console executable is not installed. CI runs that suite. The new checks are the 16px count at 390 and 844, the wide window staying at 0.92rem, an existing version 1 save loading as version 1 under `night-market-save-v1`, the reload keeping the stall, other games' saves staying unchanged, the download being this game's version 1 file, a touch hold pouring several cups and then stopping, and reduced motion removing the passer-by from the lane.

`model.js` is unchanged. The save key is still `night-market-save-v1`.

## Shots for Game Art Director

`shots/` has the page and the count line before and after, at the seven lane sizes from the Night Market tests plus 390x844, 844x390 and an iPad at 820x1180 with device pixel ratio 2.

The seven sizes are 320x640, 375x700, 390x700, 768x800, 820x800, 1280x800 and 1920x900.

`measurements-before.json` records 14.72px at every size, and one passer-by still on the lane after reduced motion. `measurements-after.json` records 16px below 1000px, 14.72px at 1280 and 1920, and zero passers-by after reduced motion. `shots/before-lane-reduced.png` and `shots/after-lane-reduced.png` are that lane at 1280x800.

Re-run with `node docs/playtests/nm-launch-polish/capture.cjs before` or `after`. The command needs Playwright on `NODE_PATH` and Chrome on `CHROME_PATH`.

## Your save and the reload

`save/1-your-save-open.png` is Your save at 390x844, with Download my save, Load a save file and Automatic backups. `save/downloaded-save.json` is the file that button handed over. `save/2-away-summary-after-reload.png` is the reload after two hours away. It says 2h and 36.0K coins. `save/3-wrong-file-refused.png` is another game's file refused, with no replace question.

The older `docs/playtests/nm-save-reload/reload-check.cjs` run produced the first two shots and the download, then timed out on the file load. The tools redraw when Your save opens, and that run set the file on the input that the redraw had just replaced. A follow-up that waits for the redraw loaded a file with cash 12345 after the replace question, and refused the wildbond file. The check page covers the same behavior on every run.

## Phone pre-check for NM-FIX-7

`phone/` is a fresh Chromium pass of `node tools/playtest/night-market-phone.cjs`. 264 checks passed, including real touch taps, a held touch, a cancelled touch, hiring, buying, rotation, and the away summary in `phone/away-portrait.png`. This is a pre-check for Playtester. It is not the played phone session, and it does not tick NM-FIX-7.
