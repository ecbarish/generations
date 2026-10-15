# LR-G2: Little Ranch layout and depth bundle

Backlog row LR-G2. Five layout and draw-order problems from the Playtester's 8/10 report and the Reviewer's LRL-11 phone notes, fixed in one pull.
Every item was re-checked on current `main` first (commit `e1fd9a2b`). **All five still reproduce on main.** None was dropped.

Little Ranch launches on 16 October. This pull must not merge until the Playtester confirms it does not regress the 8/10 build.

## What each item looked like on main, and what changed

| # | On main | Now |
|---|---------|-----|
| 1 | The fox is drawn after the ball, so it hides 19 to 51 percent of the ball at the start and after a roll. After a roll the baby ran onto the ball's spot and stood on it. | `drawBall()` is called after the fox and the friend, so the ball is always in front. The baby kicks from beside the ball (`kickStand`, one ball width plus one baby width toward the middle) and turns to face it, so the ball does not now hide the fox's face. |
| 2 | On a tall phone the nearest two sign tap circles were 2.01 R apart (they need 2.5 R). | On a tall screen (`!wide` and height at least 1.25 times width) the five signs stand in three rows: paint and wagon low, snack in the middle, dough and barn door high. The nearest two are 2.60 R apart. The dough and barn-door posts are short on those screens, so they do not run through the signs below. Wide and squat screens keep their old places (a check pins the 844x390 positions). |
| 3 | The bubble sat on top of the basket (tall) or on top of the bowl (wide). | `L.item` is picked on a small grid at layout time. Its soft glow must clear the basket and the bowl, it must stay clear of the baby (the existing rule), and it stays near the baby. It then takes the place that covers the least else. The tap size is unchanged. |
| 4 | In landscape Pebblit stood 16 to 25 px inside the basket circle when it ate. | On a wide screen Pebblit's eating spot is held to the right of the basket (`friendEatX`). |
| 5 | The puddles sat behind the ball and the bush: at every size at least one of the two was mostly hidden (as little as 0 to 60 percent of it showed). | The two puddles are picked on the same grid: clear of both ball spots, the bush, the basket, the bowl, the sponge and the sign boards. If a screen is crowded they get a little smaller, never under 66 px across on a phone or 84 px on a tablet. |

The grid search is cheap (about 6 ms on this box, once per screen size; the result is remembered in memory for that size, so turning the phone back is free).

## What was not changed

- No toys, timings, sounds or art. No `shared/`, `sw.js`, root `index.html` or `games/little-ranch/index.html` edit. No pack rebuild. No `LR.VERSION` bump.
- No save change: `little-ranch-settings-v1` is still the only stored value. The placement cache is memory only.
- The held toy pulls #404, #409, #411 and #412 stay on hold. They will conflict with this one, as the backlog says.

## Not fixed here (please look at these)

- **Tall phones: Pebblit still stands on the hat basket when it eats.** The bowl is on the left, the basket is next to it, and the baby eats on the bowl's right at the same time, so there is no clear spot without moving the baby's eating spot or the basket. The backlog row says landscape only, so I left it. A follow-up could move the basket or the baby's eating spot.
- **1024x768 (a wide tablet) is crowded in the old layout:** the paint and dough signs overlap there, and the puddles have no clear spot. Wide stays as it is, per the row. Not part of the four sizes.
- **Squat screens** (height under 1.25 times width, for example a split-screen window) keep the old sign places, which still overlap.
- At dusk on a phone the bubble sits above-left of the fox, over the paint sign and the edge of the ball. It clears the basket and the bowl, which is the check. There is no spot near the baby that is clear of everything.

## The new checks (`tests/little-ranch.html`, section LR-G2)

- The ball is in front of the fox at the start, on both sides, and after four rolls at 390x844, 844x390, 360x780 and 1024x594 (at least 85 percent of the ball's disc shows its red). The baby stands at least a ball radius plus 0.9 of its size away after each roll.
- No two sign tap circles overlap, no sign board or post is drawn over another sign, each sign is its own tap, and every board is on screen, at 390x844, 360x780, 375x812, 430x932 and 820x1180. The 844x390 sign places are pinned.
- The bedtime bubble, glow included, clears the basket and the bowl at eight sizes, and is still the hint target and clear of the baby.
- Pebblit walks in, eats at the bowl and never enters the basket circle at 844x390, 1024x594 and 667x375.
- Both puddles show (at least 85 percent of each, read from the drawn pixels) with the ball on either side, and each is its own tap across its middle, at 390x844, 844x390, 360x780, 1024x594, 375x812, 667x375 and 820x1180.

Run against `main`'s `game.js`, 37 of them fail (all five items). Run against this branch, the whole page passes: 600 checks.

## Screenshots

`before/` is current `main`, `after/` is this branch. Four sizes, seven moments each (28 per folder), plus a side-by-side sheet per size: `compare-390x844.png`, `compare-360x780.png` (portrait: top row before, bottom row after), `compare-844x390.png` and `compare-1024x594.png` (landscape: left column before, right column after).

The moments, in order: `1a` fox and ball at the start, `1b` after a roll, `2` the five signs, `3` the bedtime bubble, `4` Pebblit eating, `5a` and `5b` the puddles with the ball on each side.

Taken with Chrome (headless, touch, device scale 1) by `shots.cjs`:

    node docs/playtests/lr-layout-depth/shots.cjs <repo-root> <out-dir>

GAD: please look at the compare sheets, especially the three-row sign stand on a phone and the dusk bubble.
