# Launch checklist: Little Ranch

**Owner:** Side Games Dev Lead. Grok and dot help.
**Build on main:** v0.16.0 (`games/little-ranch/game.js`).
**Ruling:** Evan, 2026-10-14. Little Ranch is a launch game. Only work that ticks an item below. No new place until this checklist is done, except #400, which may finish.

Playtester scores every week. The lowest-scoring part becomes the next task. Finished means the game is playable and fun. Merging a pull request does not finish it. Playtester or Evan confirms it.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **LRL-1** | Pass 2 (2026-10-11, about six minutes) never reached bedtime. Bedtime waits for 12 actions or 360 seconds (`BEDTIME_ACTS`, `BEDTIME_SECS`) |
| Playtester rates the first session as fun | **LRL-2** | **7/10** on 2026-10-14. That meets the bar. The same session still left the gaps below |
| No crashes and no broken saves | **LRL-4** | Pass 2 had no page error. The visit itself is not saved. Only the sound preference is stored (`little-ranch-settings-v1`). A reload check is still missing |
| Plays well on a phone | **LRL-3** | **LRL-11.** The phone layout still needs a playtest. Owner: Playtester |
| One clear goal | **LRL-1** | The visit should show one day and then bedtime. A six-minute play never got there |
| Known bugs are fixed | **LRL-5** | Playtest gaps **LRL-6** through **LRL-10**: dough tint, the fox, the cookie and the cutter, and a sign wiggle |

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer plays the first visit without help.
- Playtester scores fun at least **7/10**. That is the target. It is high enough that a weak session does not pass, and low enough that extra toys are not required. Confirm or change it when the dev lead checks the dates.
- No blocker and no major bug.
- It plays on a phone (taps and drags).
- One clear goal: play through the day, then bedtime.

**Must-haves** (these block finish):

1. The first visit reaches bedtime without a grown-up explaining it (LRL-1).
2. The sound choice is still there after the page is reloaded (LRL-4).
3. Nothing crashes, and a reload does not break the page (LRL-4, LRL-5).
4. A phone session of the current build plays well (LRL-3).
5. Playtester's fun score is at least 7/10 (LRL-2). The 2026-10-14 score is 7/10.
6. The Dough Table's colour dots tint the dough (LRL-6). Feeding the fox has a clear response (LRL-7). The cookie no longer overlaps the cutter (LRL-8, then LRL-9). Signs wiggle so they invite a tap (LRL-10). On a phone, the cheese and sponge block clears the flowers, and sideways the flowers clear the ball (LRL-12).
7. A phone layout playtest (LRL-11). Owner: Playtester.

## Playtest gaps (2026-10-14, fun 7/10)

These come before bedtime and the sound preference. Guest bots are welcome on the Side Games Dev Lead rows. One pull each.

| ID | Size | Owner | What |
|---|---|---|---|
| LRL-6 | S | Side Games Dev Lead | First task. The Dough Table's colour dots tint the dough |
| LRL-7 | S | Side Games Dev Lead | Feeding the fox needs a clear response |
| LRL-8 | S | Game Art Director | Art spec for the cookie and the cutter, so they no longer overlap. Code waits |
| LRL-9 | S | Side Games Dev Lead, after LRL-8 | Build that layout from the art spec |
| LRL-10 | S | Side Games Dev Lead | Signs get a wiggle so they invite a tap |
| LRL-12 | S | Side Games Dev Lead | On a phone, the cheese and sponge block overlaps the flower row. Sideways, the flowers overlap the ball |
| LRL-11 | — | Playtester | The phone layout still needs a playtest. Not a build pull |

**Does not block finish:**

- **LR18 Dough Table** (#400) and **LR17 Busy Barn Door** (#381) are merged. The checklist does not wait on another toy.
- **LR19 Block Tower, LR20 Little Garden, LR21 Barn Band, LR22 Feel-Better Corner.** On the shelf in [ideas.md](../ideas.md) until this checklist calls for them.
- More spoken lines, more places, a saved visit beyond the sound choice.

## Timeline

Measured on 2026-10-14. The count, the split into build, playtest and buffer, and both dates are in [launch-summary.md](launch-summary.md). Little Ranch's feature rate is 21 pulls in 7 days (3.00 a day) and the same 21 in 14 days (1.50 a day).

**Pulls left that block finish:** 8. The older two (LRL-1, LRL-4) plus LRL-6, LRL-7, LRL-8, LRL-9, LRL-10 and LRL-12. LRL-11 is not a build pull. LR17 (#381) and LR18 (#400, `43785a4`) are merged. #404 LR19 and #409 LR20 are on hold.

| ID | Size | What |
|---|---|---|
| LRL-6 | S | Dough tint |
| LRL-7 | S | Fox response |
| LRL-8 | S | Cookie and cutter, art spec |
| LRL-9 | S | Cookie and cutter, code after the spec |
| LRL-10 | S | Sign wiggle |
| LRL-12 | S | Phone overlaps: block and flowers, flowers and ball |
| LRL-1 | S | Bedtime in the first sitting |
| LRL-4 | S | Sound preference survives a reload |

**Likely:** 8 / 3.00 days of build, plus 1 confirmation day, plus 0 buffer. **2026-10-18.** Was 2026-10-16.
**Slower:** 8 / 1.50 days of build, two playtest rounds, and a 2-day buffer. **2026-10-24.** Was 2026-10-20.

## Owner and the first tasks

**Owner:** Side Games Dev Lead. Guest bots are welcome. The cookie art spec is Game Art Director's.

1. **LRL-6.** Tint the dough from the colour dots.
2. **LRL-7.** Give the fox a clear response when it is fed.
3. **LRL-8.** Art spec for the cookie and the cutter. **LRL-9** builds it after that.
