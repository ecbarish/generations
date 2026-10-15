# LR-G2: Little Ranch layout and depth bundle

Backlog row LR-G2. Five layout and draw-order problems from the Playtester's 8/10 report and the Reviewer's LRL-11 phone notes, fixed in one pull.
Every item was re-checked on current `main` first (commit `e1fd9a2b`). **All five still reproduce on main.** None was dropped.

Little Ranch launches on 16 October. This pull must not merge until the Playtester confirms it does not regress the 8/10 build.

## What each item looked like on main, and what changed

| # | On main | Now |
|---|---------|-----|
| 1 | The fox is drawn after the ball, so it hides 19 to 51 percent of the ball at the start and after a roll. After a roll the baby ran onto the ball's spot and stood on it. | The ball is drawn after the fox and the friend, **unless it would cover a face**: then the fox stands in front (a ball resting further back than the fox's feet is behind the fox's head, as in real depth). On a tall phone the ball now rests on the line of the fox's feet, below its face, so it is in front without covering the face. The baby kicks from beside the ball (`kickStand`) and turns to face it. |
| 2 | On a tall phone the nearest two sign tap circles were 2.01 R apart (they need 2.5 R). | On a tall screen (`!wide` and height at least 1.25 times width) the five signs stand in three rows: paint and wagon low, snack in the middle, dough and barn door high. The nearest two are 2.60 R apart. The dough and barn-door posts are short on those screens, so they do not run through the signs below. Wide and squat screens keep their old places (a check pins the 844x390 positions). |
| 3 | The bubble sat on top of the basket (tall) or on top of the bowl (wide). | `L.item` is picked on a small grid at layout time. Its soft glow must clear the basket and the bowl, its core must stay off every sign board (each board is a box), and it must stay clear of the baby (the existing rule). It then takes the place that covers the least else. If a crowded screen leaves no such place, it first lets the glow touch the basket and the bowl (core still clear), and only then the signs. The tap size is unchanged. |
| 4 | In landscape Pebblit stood 16 to 25 px inside the basket circle when it ate. | On a wide screen Pebblit's eating spot is held to the right of the basket (`friendEatX`). |
| 5 | The puddles sat behind the ball and the bush: at every size at least one of the two was mostly hidden (as little as 0 to 60 percent of it showed). | The two puddles are picked on the same grid: clear of both ball spots, the bush, the basket, the bowl, the sponge and the sign boards. If a screen is crowded they get a little smaller, never under 66 px across on a phone or 84 px on a tablet. |

The grid search runs once per screen size (13 to 23 ms the first time a size is seen on this box, cold; `main` took about 1 ms) and the result is remembered in memory for that size, so turning the phone back is free.

## Review fixes (GAD and Playtester on #514, head `5ba1381f`)

- **The ball covered the fox's face while it ate.** The ball is no longer drawn after the fox in every case. It is drawn after the fox unless it would cover a head; then the fox is in front. On a tall phone the ball also rests lower, on the line of the fox's feet (it was 48 canvas px behind them), so it is in front of the fox's body and below its face. The new check puts the fox in 13 places along the yard, looking each way, with the ball on either side (52 cases) and finds at most 2 percent ball colour on its face at six sizes. At 844x390, 1024x594 and 1920x1080 the fox is in front when it stands at the ball, so the ball is hidden by up to 26 percent when the fox looks straight at it at home (74 to 78 percent shows); on tall phones at least 90 percent still shows.
- **The bubble sat on the barn-door sign at 1920x1080 and covered a cheek at 844x390.** The core of the bubble is now kept off every sign board, as a hard limit like the puddles. At 1920x1080, 1024x594, 667x375 and 844x390 the core is clear of all five boards (0.6 to 215 px), and at 844x390 it now stands at the right edge, well clear of the fox. At 1024x594, 667x375 and 1920x1080 the soft glow still touches the bush and the edge of the fox's cheek or the ball, because there is no free place near the baby on those screens; the core never does.
- **The top of the wagon sign was unreliable (Playtester).** I could not reproduce a miss in the middle or top of the wagon board at any size, but the old tap rule gave up to 22 of the 285 test points on a board (mostly along its lower edge) to the bush, the sun or a neighbour. A tap on a drawn board now counts as that sign (it wins unless something is much closer to its own centre). On the four tall phone sizes every point in the top half of every board is its own sign, and 98 percent or more of each board is (the bush that is drawn over the wagon board's lower corner still takes those few points). Wide screens already matched main for the top of the boards.
- **The Playtester's note that the ball sits in front of the fox's mouth and belly** is the same fix: the face is never covered, and on tall phones the ball sits below the face.
- **The right puddle was a little hidden by the bush's shadow at 390x844 after the ball moved** (82 percent); the shadow is now an obstacle too.

## What was not changed

- No toys, timings, sounds or art. No `shared/`, `sw.js`, root `index.html` or `games/little-ranch/index.html` edit. No pack rebuild. No `LR.VERSION` bump.
- No save change: `little-ranch-settings-v1` is still the only stored value. The placement cache is memory only.
- The held toy pulls #404, #409, #411 and #412 stay on hold. They will conflict with this one, as the backlog says.

## Not fixed here (please look at these)

- **Tall phones: Pebblit still stands on the hat basket when it eats.** The bowl is on the left, the basket is next to it, and the baby eats on the bowl's right at the same time, so there is no clear spot without moving the baby's eating spot or the basket. The backlog row says landscape only, so I left it. A follow-up could move the basket or the baby's eating spot.
- **1024x768 (a wide tablet) is crowded in the old layout:** the paint and dough signs overlap there, and the puddles have no clear spot. Wide stays as it is, per the row. Not part of the four sizes.
- **Squat screens** (height under 1.25 times width, for example a split-screen window) keep the old sign places, which still overlap.
- At dusk on a phone the bubble now sits above-right of the fox, over the bush and just under the wagon sign's board (its core touches no board). The glow, which is see-through, still lies over the bush and a corner of the ball's side. There is no spot near the baby that is clear of everything.
- At 1024x594, 667x375 and 1920x1080 the bubble stands in the one free place to the right of the fox, so its glow brushes the bush, the fox's cheek and the ball's right spot. A wide tablet at 1024x768 is the exception: the core cannot clear the wagon and the barn-door signs there at all, so the bubble keeps the old fallback.
- The wagon sign's lower corner is still covered by the bush on tall phones, which is how it is drawn.
- Posts of the top-row signs still stop in mid-air on a tall phone (GAD's non-blocking note); a short rail or fence post is a later art pass.

## The new checks (`tests/little-ranch.html`, section LR-G2)

- The ball is in front of the fox at the start, on both sides, and after four rolls at 390x844, 844x390, 360x780 and 1024x594 (at least 85 percent of the ball's disc shows its red on tall phones, at least 70 percent on wide screens where the fox stands in front of a ball it looks at). The baby stands at least a ball radius plus 0.9 of its size away after each roll.
- The ball never covers the fox's face: 13 places along the yard, both ways the fox can look, ball on either side (52 cases), at 390x844, 844x390, 360x780, 1024x594, 375x812 and 1920x1080 (at most 2 percent of the face area shows ball colour).
- No two sign tap circles overlap, no sign board or post is drawn over another sign, each sign is its own tap, and every board is on screen, at 390x844, 360x780, 375x812, 430x932 and 820x1180. The 844x390 sign places are pinned.
- The bedtime bubble, glow included, clears the basket and the bowl at eight sizes, and is still the hint target and clear of the baby. Its core also stays off every sign board at eight sizes (390x844, 844x390, 360x780, 1024x594, 375x812, 667x375, 1920x1080, 820x1180).
- Every tap on the top half of a sign board is that sign, and at least 90 percent of every board is, at 390x844, 360x780, 375x812 and 430x932.
- Pebblit walks in, eats at the bowl and never enters the basket circle at 844x390, 1024x594 and 667x375.
- Both puddles show (at least 85 percent of each, read from the drawn pixels) with the ball on either side, and each is its own tap across its middle, at 390x844, 844x390, 360x780, 1024x594, 375x812, 667x375 and 820x1180.

Run against `main`'s `game.js`, 41 of them fail (all five items, plus the new board-tap check). Run against the first head of this pull (`5ba1381f`), 13 of them fail (the face check at six sizes and the bubble-off-the-signs check at seven). Run against this branch, the whole page passes: 618 checks.

## Screenshots

`before/` is `main`, `after/` is this branch. Four sizes, seven moments each (28 per folder), plus the big desktop window 1920x1080 with three moments (`1a`, `3`, `4`), and a side-by-side sheet per size: `compare-390x844.png`, `compare-360x780.png` (portrait: top row before, bottom row after), `compare-844x390.png`, `compare-1024x594.png` and `compare-1920x1080.png` (landscape: left column before, right column after).

The moments, in order: `1a` fox and ball at the start, `1b` after a roll, `2` the five signs, `3` the bedtime bubble, `4` Pebblit eating, `5a` and `5b` the puddles with the ball on each side.

Taken with Chrome (headless, touch, device scale 1) by `shots.cjs`:

    node docs/playtests/lr-layout-depth/shots.cjs <repo-root> <out-dir>

GAD: please look at the compare sheets, especially the three-row sign stand on a phone and the dusk bubble.
