# Launch checklist: Night Market

**Owner:** Side Games Dev Lead.
**Core:** IDLE-CORE is merged (#393, `shared/idle-core.js`). Games keep their own saves. The core is not rebuilt for this checklist.
**The build:** IDLE-NM1, Night Market Stalls. Draft **#403** is that launch task. The stall is not playable yet.
**Ruling:** Evan, 2026-10-14. Night Market is a launch game. IDLE-NM1 is the build that fills this checklist. IDLE-SS1, IDLE-CS1 and IDLE-DP1 wait until Night Market has been playtested.

Spec: [office-idle-progression.md](../research/office-idle-progression.md) §4A and §8, and the house rules in [village-and-business-review.md](../research/village-and-business-review.md). You do the job yourself before you hire. Offline earnings are capped. There is no multiplier treadmill.

Playtester scores the first session once the stall exists, then every week. Finished means it is playable and fun. Merging #403 does not finish it. Playtester or Evan confirms it.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **NML-1** | No stall yet. #403 is the build. The first session is one stall, worked by hand |
| Playtester rates the first session as fun | **NML-2** | No score yet, because there is nothing to play. The bar is at least 7/10 |
| No crashes and no broken saves | **NML-3** | No market save yet. A reload must keep the stall, show the away summary, and leave every other game's save alone |
| Plays well on a phone | **NML-4** | Not tested. The stall has to be playable on a phone |
| One clear goal | **NML-5** | One stall you work yourself. The next buy is visible. A hire comes only after that hand work |
| Known bugs are fixed | **NML-6** | None yet. This stays open until Playtester's first session. Do not invent bugs ahead of that |

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer runs the stall for a first session without help.
- Playtester scores fun at least **7/10**. Same target as the other launch games. Confirm or change it when the dev lead checks the dates.
- No blocker and no major bug.
- It plays on a phone.
- One clear goal: serve at your stall, then earn the first help.

**Must-haves** (these block finish, and they are what #403 is for):

1. One stall you work yourself before any hire (NML-1, NML-5). The spec's first sitting: serve by hand, a named vendor after enough serves, and a second stall type only if it still fits that first sitting.
2. Capped offline earnings and an away summary, using the merged idle core (NML-3).
3. A reload keeps the stall and does not touch other games' saves (NML-3).
4. The stall plays on a phone (NML-4).
5. Playtester's fun score is at least 7/10 (NML-2).

**Does not block finish:**

- Moving to a new district, permits, and a collection of vendor stories.
- IDLE-SS1, IDLE-CS1 and IDLE-DP1. They wait on the shelf until this game has been playtested.
- A hall button. That is a separate claim when the stall is actually fun.
- More stall types beyond the first sitting.

## Timeline

Pending dev-lead check. In the same 14-day squash count (2026-09-30 through 2026-10-14), Night Market landed **1 squash merge**: IDLE-CORE, #393. That is 0.5 a week, and it was the shared core, not a stall.

#403 is one large pull: a new game page, a save, and the first session. The lead is also on Little Ranch and Lantern Bowl.

**Pulls left:**

| ID | Size | What |
|---|---|---|
| IDLE-NM1 / NML-1–NML-6 | L | #403. The playable stall on the merged core |
| Playtest fixes | S | Only if the first session scores under 7/10 or finds a bug. Slower case |
| Phone fix | S | Only if the phone session needs one. Slower case |

**Likely:** about three weeks to a stall someone can play, then a Playtester week. **2026-11-18.**
**Slower:** the slice needs a second pass, and the phone layout needs a fix. **2026-12-16.**

## Owner and the first three tasks

**Owner:** Side Games Dev Lead. #403 is the launch task.

1. **Build the stall in #403.** One stall, worked by hand, on `shared/idle-core.js`. Files: `games/night-market/`, `tests/night-market.html`, and one test-page line. Do not edit the idle core or the hall in that pull.
2. **Show the goal.** The player can see the coins and the next thing the stall is working toward, and a hire waits until the hand work is done.
3. **Prove the save.** Close the page, open it, see the away summary, and check that another game's save is unchanged. Then ask Playtester for the 7/10 score and a phone session.
