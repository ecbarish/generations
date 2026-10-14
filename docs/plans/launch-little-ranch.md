# Launch checklist: Little Ranch

**Owner:** Side Games Dev Lead. Grok and dot help.
**Build on main:** v0.16.0 (`games/little-ranch/game.js`).
**Ruling:** Evan, 2026-10-14. Little Ranch is a launch game. Only work that ticks an item below. No new place until this checklist is done, except #400, which may finish.
**Chunks** (Evan, 2026-10-14): one pull request per fix list or feature area, and one game per pull request. Split only when one area gets genuinely risky. Guardrails stay: tests green, old saves load, screenshots, Game Art Director reviews any art, and no save-format change without Evan.

Playtester scores every week. The lowest-scoring part becomes the next task. Finished means the game is playable and fun. Merging a pull request does not finish it. Playtester or Evan confirms it.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **LRL-1** | Bedtime in the first sitting is in review (#417). Pass 2 never reached it |
| Playtester rates the first session as fun | **LRL-2** | **7/10** on 2026-10-14. That meets the bar. The same session still left the gaps below |
| No crashes and no broken saves | **LRL-4** | Pass 2 had no page error. The visit itself is not saved. Only the sound preference is stored (`little-ranch-settings-v1`). A reload check is still missing |
| Plays well on a phone | **LRL-3** | **LRL-11.** The phone layout still needs a playtest. Owner: Playtester |
| One clear goal | **LRL-1** | The visit should show one day and then bedtime. That pull is in review (#417) |
| Known bugs are fixed | **LRL-5** | The layout row is done (#424, `e66ddbc`): the cookie clears the cutter, and the phone overlaps are gone. **LR-POLISH** still has the dough dots, the fox, and the sign wiggle |

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer plays the first visit without help.
- Playtester scores fun at least **7/10**. That is the target. It is high enough that a weak session does not pass, and low enough that extra toys are not required. Confirm or change it when the dev lead checks the dates.
- No blocker and no major bug.
- It plays on a phone (taps and drags).
- One clear goal: play through the day, then bedtime.

**Must-haves** (these block finish):

1. The first visit reaches bedtime without a grown-up explaining it (LRL-1). In review (#417).
2. The sound choice is still there after the page is reloaded (LRL-4).
3. Nothing crashes, and a reload does not break the page (LRL-4, LRL-5).
4. A phone session of the current build plays well (LRL-3).
5. Playtester's fun score is at least 7/10 (LRL-2). The 2026-10-14 score is 7/10.
6. **LR-POLISH**, one pull. Done in #424 (`e66ddbc`): the cookie no longer overlaps the cutter (LRL-8, LRL-9), and on a phone the cheese and sponge block clears the flowers, and sideways the flowers clear the ball (LRL-12). Still open in this pull: the Dough Table's colour dots tint the dough (LRL-6), feeding the fox has a clear response (LRL-7), and signs wiggle so they invite a tap (LRL-10). Game Art Director reviews any art.
7. A phone layout playtest (LRL-11). Owner: Playtester.

## Playtest gaps (2026-10-14, fun 7/10)

These are bundles. Side Games Dev Lead owns them. Toy polish comes before the first visit.

| ID | Owner | What |
|---|---|---|
| LR-POLISH | Side Games Dev Lead | First bundle. The layout row is done (#424, `e66ddbc`): cookie and cutter, and the phone overlaps. Still in this pull: dough dots (LRL-6), the fox (LRL-7), and the sign wiggle (LRL-10). Game Art Director reviews any art |
| LR-VISIT | Side Games Dev Lead | Bedtime in the first sitting (LRL-1, in review as #417) and the sound preference after a reload (LRL-4). No save-format change |
| LRL-11 | Playtester | The phone layout still needs a playtest. Not a build pull |

**Does not block finish:**

- **LR18 Dough Table** (#400) and **LR17 Busy Barn Door** (#381) are merged. The checklist does not wait on another toy.
- **LR19 Block Tower, LR20 Little Garden, LR21 Barn Band, LR22 Feel-Better Corner.** On the shelf in [ideas.md](../ideas.md) until this checklist calls for them.
- More spoken lines, more places, a saved visit beyond the sound choice.

## Timeline

Measured on 2026-10-14. The count, the split into build, playtest and buffer, and both dates are in [launch-summary.md](launch-summary.md). Little Ranch's feature rate is 21 pulls in 7 days (3.00 a day) and the same 21 in 14 days (1.50 a day).

**Bundles left that block finish:** 2. The layout row is done (#424, `e66ddbc`), and LRL-1 is in review (#417). Neither changes the bundle count, so the dates stay. The per-pull rate is applied to bundles, so these dates are estimates. LRL-11 is not a bundle. LR17 and LR18 are merged. #404 and #409 are on hold.

| ID | What is inside |
|---|---|
| LR-POLISH | Dough dots, the fox, and the sign wiggle. The layout row is done (#424, `e66ddbc`) |
| LR-VISIT | Bedtime in the first sitting (in review, #417), and the sound preference after a reload |

**Likely:** 2 / 3.00 days of build, plus 1 confirmation day, plus 0 buffer. **2026-10-16.**
**Slower:** 2 / 1.50 days of build, two playtest rounds, and a 2-day buffer. **2026-10-20.**

## Owner and the first bundle

**Owner:** Side Games Dev Lead.

1. **LR-POLISH.** What is left of toy polish, one pull. The layout row is done.
