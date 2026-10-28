# NM-FUN-PASS

Fresh-session findings on main `b17ae6be` (that commit already includes #614), and the measurements for this pull. Seconds below are simulated, not a person's clock.

Reproduce both buyers with `node tools/night-market-pacing.cjs --check`. The sensible buyer does one hand action each second on the earliest stall nobody has taken, adds that second of stall income, then buys one copy of the hired stall that pays for itself soonest. If that copy costs more than the coins on hand, the buyer waits. A worse stall is not a substitute. The other buyer is the same minute, except they buy the affordable stall that pays for itself soonest.

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

## After, on this pull

The curve Playtester scored (`08c860f9`) is the middle column. This pull is the last column. Seconds are simulated.

A fast buyer pours every 120ms until someone is hired, then once a second buys one copy of the affordable stall that pays for itself soonest. A human-pace buyer pours every 1.2 seconds and, from 30 seconds on, considers a buy every 7 seconds. They take it when it pays for itself within 6 minutes, or when that stall is within 12 of a 25, 50 or 100 doubling.

| | Desktop, real clicks | Human pace on `08c860f9` | Human pace now | Fast buyer on `08c860f9` | Fast buyer now |
| --- | --- | --- | --- | --- | --- |
| 0:30 | 25 coins, 0/s | 25 coins, 0/s | 25 coins, 0/s | | |
| 3:00 | 375 coins, 11.3/s | 305 coins, 9.9/s | 458 coins, 9.5/s | | |
| 6:00 | 2.23K, 45/s | 2.43K, 42.3/s | 4.11K, 42.3/s | 112/s, best 3m 45s | 271/s, best 2m 40s |
| 9:00 | 1.78K, 82/s | 1.25K, 80.3/s | 11.1K, 132/s | 186/s, best 7m 24s | 487/s, best 2m 40s |
| 12:00 | 8.29K, 152/s | 21.3K, 155/s | 9.89K, 305/s | 226/s, best 11m 28s | 919/s, best 2m 40s |
| 15:00 | | 49.2K, 155/s | 26.8K, 650/s | 252/s, best 11m 28s | 1.32K/s, best 3m 45s |

On the old curve the human-pace income sits next to the desktop (about 0, 12, 6 and 2 percent off through minute 9, then 2 percent high at minute 12). Cash at minute 12 is higher in the sim because a line longer than 6 minutes is skipped, while the desktop session kept saving toward the 11K Mooncake Table. The best line from minute 8 to 15 ran to 6m 37s. The fast buyer on that same curve ran to 11m 28s. Playtester's scripted pace was 91, 183, 226 and 291 coins a second at minutes 6, 9, 12 and 15.

On this curve both buyers stay under 5 minutes from minute 8 to 25. Through minute 15 the fast buyer's longest best line is 225 seconds and the human-pace buyer's is 269 seconds. The human buyer reaches 50 Tea Stalls at 8:12 (the awning) and 25 Dumpling Carts at 14:09. The fast buyer reaches 25 Lantern Stands at 10:08. Minutes 0 to 15 are the approved curve: same income, same stalls owned, same best line.

The Incense Tray is the one stall that changes. It used to cost 150K, earn 55 a second, and show a 45 minute payback, so coins saved after the quarter hour had nowhere useful to go. The first tray now costs 52.4K and earns 540 a second, so it pays for itself in 1 minute 37 seconds. The next one takes 1 minute 42 seconds. It opens once twelve mooncake tables are wrapping. Ten trays still open the Story Mat. Tea, dumplings, lanterns, mooncakes and the story mat are unchanged.

| | Human pace, minute 15 | Human pace, minute 20 | Human pace, minute 25 | Fast buyer, minute 15 | Fast buyer, minute 20 | Fast buyer, minute 25 |
| --- | --- | --- | --- | --- | --- | --- |
| Income | 650/s | 2.92K/s | 33.2K/s | 1.32K/s | 2.02K/s | 5.06K/s |
| Coins on hand | 26.8K | 34.2K | 153K | 5.79K | 10.7K | 18.6K |
| Best line | 4m 21s | 1m 37s | 3m 10s | 3m 45s | 1m 37s | 1m 37s |
| Stalls owned | 69, 31, 14, 10, 0, 0 | 70, 36, 25, 31, 0, 0 | 70, 36, 25, 31, 28, 0 | 107, 80, 37, 7, 0, 0 | 116, 91, 47, 20, 0, 0 | 127, 103, 57, 34, 0, 0 |

The longest best line from minute 8 to 25 is 287 seconds for the fast buyer and 298 seconds for the human-pace buyer. By minute 25 the human-pace buyer has bought 28 incense trays. The fast buyer is still saving toward the first one, and that tray is already the short line on the table.

The sensible buyer, who waits for the single best copy:

| Mark | Time | Income at 5, 10, 15 and 30 min |
| --- | --- | --- |
| 1K | 1:49 | 179 / 673 / 7.15K / 214K coins a second |
| 10K | 4:04 | |
| 100K | 8:59 | |
| 1M | 15:02 | |

Minute 5 is the same 179 coins a second. From minute 6 to 15 the longest wait for the next stall is 71 seconds, and the longest of those lines is 4 minutes 45 seconds. The longer wait is the first Incense Tray: once twelve mooncake tables are wrapping, that tray is the line worth saving for. Doing it yourself still leads for the first minute and a bit. Stalls pass ten clicks a second at 81 seconds. At minute 6 the stalls earn 227/s and the hand earns 10/s. Every stall pays 1 coin a click. The 25 cups stay at 25.

The first Dumpling Cart still pays for itself in 1m 29s. The 18th, which had grown to 8m 44s, now pays for itself in about 4 minutes. Tea, dumplings, lanterns and mooncakes all grow more gently. A doubling still arrives at 25, and the awning still arrives at 50. Nothing else stacks on top of those.

## The buyer who spends whatever is affordable

Same minute as the sensible buyer, except this one buys the affordable stall that pays for itself soonest. They do not save for a better stall. This is the playtest buyer.

| | 100K | 1M | Longest purchase, minute 6 to 15 |
| --- | --- | --- | --- |
| Before, `b17ae6be` | 15:20 | 65:18 | 66 min |
| `08c860f9` | 13:52 | 45:47 | 36 min (2176s, 22 of 53 over 15 min) |
| This pull | 8:47 | 20:51 | 42 min (2526s, 37 of 100 over 15 min) |

100K still arrives inside 15 minutes. The million arrives after that, at 1251 seconds. Holding every one of those purchases under 5 minutes, and also holding the million back past 45 minutes, did not fit in one curve. The 5 minute bar is the one this pull keeps, for both the fast buyer and the human-pace buyer. The buyer who spends whatever is affordable still sees some long lines. They are no longer the only thing on the table from minute 8 to 15.

## What was ruled out

A Lantern Stand priced at 720 coins with 575 on hand is not a purchase. The quote count is 0, Buy and Buy max both fail, and the coins and the stall count stay put. The button reads "Buy 1 · 720 coins" and stays disabled, the same shape as a button you can afford. Max, when you can afford it, stays one short line ("Max · 14 · 526") so the row does not grow. The test sets the price to 720 and the cash to 575, then puts the live price back.

The number on a Max button is the number that tap buys. The button stores that count when it is drawn, and the tap spends exactly that count. Coins that arrive between the draw and the tap do not raise it. A test checks the label against the stall count that was actually bought, including a coin tick between the two.

The away box credits its coins once, when the page loads. The test stops the clock, waits without pressing "Put the box away", and the coins stay. It then presses the button. The note hides and the coins stay.

## Shots

`before-*.png` is the old screen. `after-*.png` is this pull. Each set is 1280×800, 390×844 and 844×390, for a fresh lane, a buying lane, and the open save row. `after-390x844-goal.png` is the phone goal pin after the lane has scrolled away. `after-844x390-goal.png` is the short landscape screen with the goal in the header, not pinned over the lane. `after-1280x800-coins.png` is the desktop coin total, pinned only after the coins and the lane have scrolled away.

The save key is still `night-market-save-v1`. The old v1 fixture in `docs/playtests/nm-retune/legacy-v1.json` loads on the real page.
