# NM-G8: Night Market Playtester fix bundle

Five guest-safe items from the Playtester's Night Market report (7/10), in one pull. Each was re-checked on `main` (`b8493ff0`) first. All five reproduced, one of them only under a condition CI never has (a classic scrollbar). No `model.js`, save, `shared/`, `sw.js` or root `index.html` change, no pack, no version bump.

## What each item was, and what changed

1. **"Fold a dumpling" held on past 12 of 12 before Bo was hired.** Hold-to-repeat (`game.js`) now stops at the vendor's count while the stall is not hired, for every stall (tea 25, dumpling 12, lantern 10, and so on). A plain click still serves once and still pays the hand amount, as #434 decided; a hold that starts at the count does nothing until release, and the release is that one click. After the hire a hold runs as before. The line under the bar now reads `12 of 12 dumplings · now press “Ask Bo to take the cart”`, using the Ask button's own words, and the button is shown at that count. Below the count it still says `press and hold to keep going`.
2. **Sideways scrollbar.** Reproduced, but only with a classic scrollbar (15px; Chrome's headless default hides it, which is why CI never saw it). `lane.js` sized the strip once from `documentElement.clientWidth`; once the stalls filled in and a scrollbar appeared, the page was 15px narrower, the strip stayed 8px too wide and `scrollWidth` exceeded `clientWidth` by 8px at 320, 360, 390, 768, 1024, 1152, 1366 and 1920 (24 of 30 size-and-market combinations in `scrollbar-before.txt`; the two landscape-phone widths were not affected). The strip is now sized from the page body's width and refitted by a `ResizeObserver` on the body, so a scrollbar that comes or goes refits it. `scrollbar-after.txt`: no combination spills. The checks cannot show a scrollbar in headless Chrome, so they take 15px off the body's width without a window resize (the same effect) and require the strip to refit.
3. **Walkers cut across the counters.** The design put passers-by at rows 48 to 72 over the counters (rows 48 to 62). A walker is 20px tall and the stalls end at row 66, so no spot in a 72px strip clears them. The strip is now **384x88**: the stalls are unchanged in the top 66 rows and walkers have their own cobbled lane in rows 67 to 86. The lane floor is the existing `mute` stone with `timber` seams, because a dark walker on the old dark floor disappeared. Same 12 palette colours, no new hex. The strip is 16px taller (32px at 2x, 48px at 3x). Before and after are in `shots/`.
4. **`/favicon.ico` returned 404.** `games/night-market/index.html` now names `../../icons/arcade.svg`, as Little Ranch does. `scrollbar-before.txt` lists the 404; `scrollbar-after.txt` has none.
5. **The lane did not get busier.** `walkerCap()` topped out at 2. It is now by stalls owned in all (counting open stalls): 0 for none, 1 from the first, 2 from 20, 3 from 30, 4 from 50, 5 from 66, and 0 under reduced motion. The old rule gave 2 from four running stalls, which cannot happen before 30 owned (a stall opens at 10 owned in the one before), so it jumped from 1 to 3 in effect; 2 from 20 keeps the steps even.

## Checks (`tests/night-market.html`, 423 before, 454 now)

31 new checks, plus three existing ones updated for the taller strip and the new cap (`384x72` to `384x88`, the palette read of the canvas, and "at most two" walkers to "at most the lane's cap"). New: the hold stops at 12 of 12 (from 9, so three more, exactly 6 coins), stays there while held, its release is not another serve, a plain click still pays, a hold at the count does not repeat, the hint names the Ask button, a hold after the hire still repeats; scroll width at 320, 390, 844, 1366 and 1920 (with the strip inside the page column), and the same with 15px taken off and put back (refit and grow back); the strip is 88 tall with stalls ending at row 66 and the walker box starting at 67; across 700 steps no walker box meets a counter box, rows 40 to 65 of the drawn lane are untouched by walkers, and each walker is drawn below; 12 palette colours; `walkerCap` at 0, 1, 19, 20, 29, 30, 49, 50, 65 and 66 owned and under reduced motion; up to 5 people on the lane at 66 owned; the page names `icons/arcade.svg` and it loads.

By hand, against the new checks, I broke each fix in turn (walker row back to 52, body width back to the window's, hold ignoring the count, hold at the count repeating, hint text removed, icon removed, the 66 tier lowered, reduced-motion zero removed) and each made at least one check fail.

## Not fixed, and for review

- **GAD:** the strip is 16px taller and gains a stone street under the stalls; please look at `shots/compare-lane-*.png` (top before, bottom after). If the street is not wanted, the other way to clear the counters is to shrink the walkers to about 10px, which loses their legs.
- Not tried on a real phone or with a real finger hold; the hold is dispatched as pointer events.
- Switching to reduced motion mid-session leaves any walker on screen frozen in the still frame (the hidden-tab path clears them; this one does not). It was like that before and does not happen when the page loads with reduced motion on. Not changed here.
- A single click past 12 of 12 still pays, by #434; the stop is for the hold only.

## Reproduce

`CHROME_PATH=/usr/bin/google-chrome node docs/playtests/nm-playtest-fixes-2/capture.cjs scrollbar` prints the table and any 404; `... capture.cjs shots <dir> <tag>` saves the lane at four sizes. Neither is run by CI.
