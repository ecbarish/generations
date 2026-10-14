# Launch checklist: Night Market

**Owner:** Side Games Dev Lead.
**Core:** IDLE-CORE is merged (#393, `shared/idle-core.js`). Games keep their own saves. The core is not rebuilt for this checklist.
**The build:** IDLE-NM1, Night Market Stalls. **#403** was built on 2026-10-14. 56 tests pass. It goes to ready once its own checks are green. The hub entry is not in that pull.
**Ruling:** Evan, 2026-10-14. Night Market is a launch game. IDLE-NM1 is the build that fills this checklist. IDLE-SS1, IDLE-CS1 and IDLE-DP1 wait until Night Market has been playtested.
**Dates:** checked by dev lead, 2026-10-14.

Spec: [office-idle-progression.md](../research/office-idle-progression.md) §4A and §8, and the house rules in [village-and-business-review.md](../research/village-and-business-review.md). You do the job yourself before you hire. Offline earnings are capped. There is no multiplier treadmill.

Playtester scores the first session once the stall exists, then every week. Finished means it is playable and fun. Merging #403 does not finish it. Playtester or Evan confirms it.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **NML-1** | The stall is built in #403 (56 tests pass). A newcomer still cannot find it from the hub. That entry is a separate small pull |
| Playtester rates the first session as fun | **NML-2** | No score yet. The bar is at least 7/10, confirmed. A tuning pull is planned after that pass |
| No crashes and no broken saves | **NML-3** | #403 keeps the stall on the idle core. A reload must show the away summary and leave every other game's save alone. Confirm that on the build once checks are green |
| Plays well on a phone | **NML-4** | Not tested yet. The stall has to be playable on a phone |
| One clear goal | **NML-5** | One stall you work yourself. The next buy is visible. A hire comes only after that hand work. The hub entry has to make that stall obvious |
| Known bugs are fixed | **NML-6** | None from a played session yet. This stays open until Playtester's first session |

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer runs the stall for a first session without help.
- Playtester scores fun at least **7/10**. Confirmed by the dev lead.
- No blocker and no major bug.
- It plays on a phone.
- One clear goal: serve at your stall, then earn the first help.

**Must-haves** (these block finish). The stall is #403. The hub entry is the separate small pull.

1. One stall you work yourself before any hire (NML-1, NML-5). The spec's first sitting: serve by hand, a named vendor after enough serves, and a second stall type only if it still fits that first sitting.
2. Capped offline earnings and an away summary, using the merged idle core (NML-3).
3. A reload keeps the stall and does not touch other games' saves (NML-3).
4. The stall plays on a phone (NML-4).
5. Playtester's fun score is at least 7/10 (NML-2).
6. A hub and launcher entry, so a newcomer can open the stall (NML-1). Size S. Claimed separately from #403.

**Does not block finish:**

- Moving to a new district, permits, and a collection of vendor stories.
- IDLE-SS1, IDLE-CS1 and IDLE-DP1. They wait on the shelf until this game has been playtested.
- More stall types beyond the first sitting.

## Timeline

Checked by dev lead. In the same 14-day squash count (2026-09-30 through 2026-10-14), Night Market landed **1 squash merge**: IDLE-CORE, #393. That is 0.5 a week, and it was the shared core. The dates below are the lead's. The stall itself was built the same day as this note.

**Pulls left:**

| ID | Size | What |
|---|---|---|
| IDLE-NM1 / NML-1–NML-6 | L | #403. Built 2026-10-14. 56 tests pass. Ready once its checks are green |
| Hub entry | S | Launcher and hub link, claimed separately from #403. A must-have |
| Tuning | S | Planned after the Playtester pass |

**Likely:** **2026-11-04.**
**Slower:** **2026-11-18.**

## Owner and the first three tasks

**Owner:** Side Games Dev Lead.

1. **Land #403.** The stall is built and the 56 tests pass. It goes to ready once checks are green.
2. **Hub and launcher entry.** A separate small pull, so a newcomer can open the stall. Do not fold it into #403.
3. **Playtester, then tuning.** Ask for the 7/10 score and a phone session. The tuning pull is the small one planned after that pass.
