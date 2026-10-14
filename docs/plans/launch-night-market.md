# Launch checklist: Night Market

**Owner:** Side Games Dev Lead.
**Core:** IDLE-CORE is merged (#393, `shared/idle-core.js`). Games keep their own saves. The core is not rebuilt for this checklist.
**The build:** IDLE-NM1, Night Market Stalls. **#403** is merged (`d9cde61`). The hub entry was not in that pull.
**Ruling:** Evan, 2026-10-14. Night Market is a launch game. IDLE-NM1 is the build that fills this checklist. IDLE-SS1, IDLE-CS1 and IDLE-DP1 wait until Night Market has been playtested.
**Dates:** measured 2026-10-14. See [launch-summary.md](launch-summary.md). The earlier dev-lead dates are replaced.

Spec: [office-idle-progression.md](../research/office-idle-progression.md) §4A and §8, and the house rules in [village-and-business-review.md](../research/village-and-business-review.md). You do the job yourself before you hire. Offline earnings are capped. There is no multiplier treadmill.

Playtester scores the first session once the stall exists, then every week. Finished means it is playable and fun. Merging #403 does not finish it. Playtester or Evan confirms it.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **NML-1** | #403 is merged. A newcomer still cannot find the stall from the hall. **NM-HUB** needs its own claim |
| Playtester rates the first session as fun | **NML-2** | No score yet. The bar is at least 7/10. A tuning pull follows that pass |
| No crashes and no broken saves | **NML-3** | #403 keeps the stall on the idle core. A reload must show the away summary and leave every other game's save alone |
| Plays well on a phone | **NML-4** | Not tested yet. The stall has to be playable on a phone |
| One clear goal | **NML-5** | One stall you work yourself. **NM-LABEL:** the "pays for itself in N seconds" line shows time-to-afford, not payback. Relabel it, or show the real payback |
| Known bugs are fixed | **NML-6** | **NM-RETUNE:** 1M lifetime coins arrives in about 8 minutes. Section 8's target for the district move is 45–75 minutes. Retune before that slice. It does not block the first session. **NM-CLAMP** is below |

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer runs the stall for a first session without help.
- Playtester scores fun at least **7/10**.
- No blocker and no major bug.
- It plays on a phone.
- One clear goal: serve at your stall, then earn the first help.

**Must-haves** (these block finish). The stall is #403. The hub entry is the separate small pull.

1. One stall you work yourself before any hire (NML-1, NML-5). The spec's first sitting: serve by hand, a named vendor after enough serves, and a second stall type only if it still fits that first sitting.
2. Capped offline earnings and an away summary, using the merged idle core (NML-3).
3. A reload keeps the stall and does not touch other games' saves (NML-3).
4. The stall plays on a phone (NML-4).
5. Playtester's fun score is at least 7/10 (NML-2).
6. A hub and launcher entry, so a newcomer can open the stall (**NM-HUB**). Size S. Its own claim. Not part of #403.
7. The payback line tells the truth (**NM-LABEL**). Relabel "pays for itself in N seconds", or show real payback. Size S.

**Reviewer notes that do not block the first session:**

- **NM-RETUNE.** 1M lifetime coins arrives in about 8 minutes. [office-idle-progression.md](../research/office-idle-progression.md) §8 wants the district move at about 45–75 minutes. Retune before that slice.
- **NM-CLAMP.** The idle-core per-tick clamp under-credits a hidden tab that has been asleep more than 4 hours. Section 8 says there is no clamp while the page is loaded. Shared Systems Architect rules on this. It is off the blocking path.
- Moving to a new district, permits, and a collection of vendor stories, once NM-RETUNE has landed.
- IDLE-SS1, IDLE-CS1 and IDLE-DP1. They wait on the shelf until Night Market has been playtested.
- More stall types beyond the first sitting.

## Timeline

Measured 2026-10-14. Night Market's feature rate is 2 pulls in 7 days (0.29 a day) and the same 2 in 14 days (0.14 a day): IDLE-CORE and #403. The maths is in [launch-summary.md](launch-summary.md).

**Pulls left that block finish:** 2 small ones. #403 is merged (`d9cde61`). Tuning is the fix inside a playtest round, not a third build pull. NM-RETUNE and NM-CLAMP are not in this count.

| ID | Size | What |
|---|---|---|
| NM-HUB | S | Hall and launcher entry. Own claim |
| NM-LABEL | S | Relabel "pays for itself", or show real payback |

**Likely:** 2 / 0.29 days of build, plus 1 confirmation day, plus 0 buffer. **2026-10-22.**
**Slower:** 2 / 0.14 days of build, two playtest rounds, and a 2-day buffer. **2026-11-08.**

## Owner and the first three tasks

**Owner:** Side Games Dev Lead.

1. **NM-HUB.** Claim the hall entry on its own, so a newcomer can open the stall.
2. **NM-LABEL.** Make the payback line say what it measures.
3. **Playtester.** Ask for the 7/10 score and a phone session. Shared Systems Architect rules on NM-CLAMP separately.
