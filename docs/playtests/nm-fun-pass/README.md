# NM-FUN-PASS

Fresh-session findings on main `b17ae6be` (that commit already includes #614), and the measurements for this pull. Seconds below are simulated, not a person's clock.

Reproduce the curve with `node tools/night-market-pacing.cjs --check`. The buyer does one hand action each second on the earliest stall nobody has taken, adds that second of stall income, then buys one copy of the hired stall that pays for itself soonest. If that copy costs more than the coins on hand, the buyer waits. A worse stall is not a substitute.

## Why the checklist says 8 minutes and the playtest did not

The NM-RETUNE note, "1M lifetime arrives in about 8 minutes", is the pre-retune active bot: 485 simulated seconds, recorded in `docs/playtests/nm-retune/`. On `b17ae6be` that same active bot takes about 65 minutes. A sensible buyer on that build takes 65:32 and is looking at a best line of about 15 to 34 minutes. A buyer who spends on any affordable stall sees lines of 15 to 66 minutes. The playtest at 14.5 minutes, about 207 coins a second and 33K on hand, then a stop, matches that second buyer. The 33K is coins in hand, not lifetime. Both the 8 minute note and the playtest are true. They describe different builds and different buyers.

## Before, on b17ae6be

| Mark | Time | Income at 5, 10, 15 and 30 min |
| --- | --- | --- |
| 1K | 1:54 | 59.5 / 151.5 / 183 / 261 coins a second |
| 10K | 5:09 | |
| 100K | 15:47 | |
| 1M | 65:32 | |

From minute 6 to 15 the best line ran as long as 34 minutes. The longest wait for that next stall was 52 seconds. At minute 6 the stalls earned 64.5/s. Ten clicks a second on the best open stall earned 40/s, because the lantern paid 4 a click. The mooncake button paid 8. The reported 430/s is not ten clicks a second, and it is not the press-and-hold (about eight pours a second).

## After

| Mark | Time | Income at 5, 10, 15 and 30 min |
| --- | --- | --- |
| 1K | 2:22 | 59.7 / 158.8 / 258.4 / 462 coins a second |
| 10K | 5:35 | |
| 100K | 15:23 | |
| 1M | 46:35 | |

From minute 6 to 15 the longest wait for the best stall is 68 seconds. Purchases in that window pay back between 14 seconds and 16.3 minutes, and the median is about 10 minutes. Many of those buys are only a few seconds apart, because a cheap best deal is often affordable immediately. The 30 to 90 second band is the ceiling on the wait, not the gap between every purchase. Pushing every gap into that band brought the long payback lines back.

Doing it yourself still leads for the first minute and a half. Stalls pass ten clicks a second at 103 seconds. At minute 6 the stalls earn 71/s and the hand earns 10/s. Every stall pays 1 coin a click. The 25 cups at the tea stall are unchanged. The opening line says to hold the pour.

## What was ruled out

A Lantern Stand at 720 coins with 575 on hand was not a purchase the model would make. The quote count was 0 and the button was disabled. The label "Buy max · 720 coins" looked like an offer. The button now says what one stall costs, and it stays disabled. A test sets the cash to one coin under the live price.

The away box credits its coins once, when the page loads. "Put the box away" only hides the note. Leaving the note up does not pay them again. The test stops the clock, waits, then presses the button.

## Shots

`before-*.png` is the old screen. `after-*.png` is this pull. Each set is 1280×800, 390×844 and 844×390, for a fresh lane, a buying lane, and the open save row. `after-390x844-goal.png` and `after-844x390-goal.png` show the green goal still on screen after a scroll.

The save key is still `night-market-save-v1`. The old v1 fixture in `docs/playtests/nm-retune/legacy-v1.json` loads on the real page.
