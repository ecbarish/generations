# Launch checklist: Little Ranch

**Owner:** Side Games Dev Lead. Grok and dot help, part-time.
**Build on main:** v0.16.0 (`games/little-ranch/game.js`).
**Ruling:** Evan, 2026-10-14. Little Ranch is a launch game. Only work that ticks an item below. No new place until this checklist is done, except #400, which may finish.

Playtester scores every week. The lowest-scoring part becomes the next task. Finished means the game is playable and fun. Merging a pull request does not finish it. Playtester or Evan confirms it.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **LRL-1** | Pass 2 (2026-10-11, about six minutes) never reached bedtime. Bedtime waits for 12 actions or 360 seconds (`BEDTIME_ACTS`, `BEDTIME_SECS`) |
| Playtester rates the first session as fun | **LRL-2** | Not yet scored on the 10-point scale. Pass 2 scored Fun 3 on a 1–5 card. That card is not this scale. The bar is at least 7/10 |
| No crashes and no broken saves | **LRL-4** | Pass 2 had no page error. The visit itself is not saved. Only the sound preference is stored (`little-ranch-settings-v1`). A reload check is still missing |
| Plays well on a phone | **LRL-3** | Pass 2 scored Phone 3 on a 1–5 first look. A played phone session of v0.16.0 is still owed |
| One clear goal | **LRL-1** | The visit should show one day and then bedtime. A six-minute play never got there |
| Known bugs are fixed | **LRL-5** | No player bug is filed. The fresh run confirms this stays clear. A bug found in that run becomes the next gap |

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
5. Playtester's fun score is at least 7/10 (LRL-2).

**Does not block finish:**

- **LR18 Dough Table** (#400, Grok, opened before the hold). It may finish as launch polish. The checklist does not wait on it.
- **LR17 Busy Barn Door** (#381, opened before the hold). It may finish. It is not required.
- **LR19 Block Tower, LR20 Little Garden, LR21 Barn Band, LR22 Feel-Better Corner.** On the shelf in [ideas.md](../ideas.md) until this checklist calls for them.
- More spoken lines, more places, a saved visit beyond the sound choice.

## Timeline

Pending dev-lead check. Guest help is part-time.

**Merge rate used.** First-parent history on `main` from 2026-09-30 through 2026-10-14 (14 days). A squash merge is a commit whose subject ends with `(#NNN)` and does not start with "Merge".

| Game | Squash merges in those 14 days | Per week |
|---|---|---|
| Little Ranch | 1 (#315, a docs ask, not a toy) | 0.5 |
| Lantern Bowl | 3 | 1.5 |
| Night Market | 1 (IDLE-CORE, #393) | 0.5 |
| Wildbond | 6 | 3.0 |

Little Ranch's toys in that same window mostly landed as merge commits, not squashes (about eight feature pulls, plus matching "live" notes). The squash figure alone understates it. The forward dates do not use that burst. Side Games Dev Lead is also on Lantern Bowl and Night Market, and Grok and dot are part-time, so the likely pace is about one small Little Ranch pull a week.

**Pulls left that block finish:**

| ID | Size | What |
|---|---|---|
| LRL-1 | S | The first sitting reaches bedtime, and the day is obvious |
| LRL-4 | S | The sound preference survives a reload, with a check |

LRL-2 and LRL-3 are Playtester sessions. A phone bug found there is another S, and it is in the slower case only.

**Likely:** LRL-1 one week, LRL-4 the next, Playtester the week after. **2026-11-04.**
**Slower:** the first fun score is under 7/10, and the phone session needs a fix. **2026-11-18.**

LR18 can land beside this. It does not move either date.

## Owner and the first three tasks

**Owner:** Side Games Dev Lead. Grok and dot may take a gap when they are free.

1. **LRL-1.** Make the first visit reach bedtime without help.
2. **LRL-4.** Keep the sound preference across a reload, and show that the page still works.
3. **LRL-2 and LRL-3.** Ask Playtester for a fun score out of 10 and a played phone session. Do not fill those from the 2026-10-11 card.
