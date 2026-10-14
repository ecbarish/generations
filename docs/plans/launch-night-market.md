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
| Playtester rates the first session as fun | **NML-2** | **5/10** on 2026-10-14. The bar is at least 7/10. This does not pass |
| No crashes and no broken saves | **NML-3** | #403 keeps the stall on the idle core. **NM-FIX-6:** "Your save" should do something. A reload must show the away summary and leave every other game's save alone |
| Plays well on a phone | **NML-4** | **NM-FIX-7.** The phone layout still needs a playtest. Owner: Playtester |
| One clear goal | **NML-5** | One stall you work yourself. **NM-FIX-1** and **NM-LABEL:** the payback hint shows "2s" on every stall, and the line shows time-to-afford. **NM-FIX-5:** the pour takes 25 clicks and then the button vanishes |
| Known bugs are fixed | **NML-6** | **NM-FIX-2:** say the 50% offline rate on screen. **NM-FIX-3** and **NM-FIX-4:** visual life, two pulls. **NM-FIX-8:** the back control and the fold. **NM-RETUNE** still waits for the district slice. **NM-CLAMP** is below |

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
7. The payback line tells the truth (**NM-LABEL**, **NM-FIX-1**). The hint shows "2s" on every stall. Relabel "pays for itself in N seconds", or show real payback. These two may be one pull.
8. Offline earnings stay at 50% and the screen says so (**NM-FIX-2**).
9. Visual life, two pulls, spec from Game Art Director. **NM-FIX-3:** lane-strip canvas, coin pop and flicker. **NM-FIX-4:** steam, flash and passers-by.
10. "Back to the arcade" is large enough and does not cover another button, and a stall is on screen on a phone (**NM-FIX-8**).
11. The pour keeps a button after 25 clicks (**NM-FIX-5**).
12. "Your save" does something (**NM-FIX-6**).
13. A phone layout playtest (**NM-FIX-7**). Owner: Playtester.

## Playtest gaps (2026-10-14, fun 5/10)

These come before the older gaps. Guest bots are welcome on the Side Games Dev Lead rows. One pull each.

| ID | Size | Owner | What |
|---|---|---|---|
| NM-FIX-3 | S | Side Games Dev Lead | First task. Visual life, pull 1 of 2: lane-strip canvas, coin pop and flicker. Spec from Game Art Director |
| NM-FIX-4 | S | Side Games Dev Lead | Visual life, pull 2 of 2: steam, flash and passers-by. Spec from Game Art Director. After NM-FIX-3 |
| NM-FIX-8 | S | Side Games Dev Lead | "Back to the arcade" is 112×17 px and overlaps a button. The stalls sit below the fold on a phone |
| NM-FIX-1 | S | Side Games Dev Lead | The payback hint shows "2s" on every stall. May be the same pull as NM-LABEL. Side Games Dev Lead's COMMS claim of 19:38 UTC also named the offline line; that line is NM-FIX-2 |
| NM-FIX-5 | S | Side Games Dev Lead | Pour flow: 25 clicks, then the button vanishes |
| NM-FIX-6 | S | Side Games Dev Lead | "Your save" does something |
| NM-FIX-7 | — | Playtester | The phone layout still needs a playtest. Not a build pull |
| NM-FIX-2 | S | Side Games Dev Lead | Offline honesty, placed before NM-RETUNE. Keep the 50% offline rate and say so, for example "stalls earned 50% while you were away" |

**Reviewer notes that do not block the first session:**

- **NM-RETUNE.** 1M lifetime coins arrives in about 8 minutes. [office-idle-progression.md](../research/office-idle-progression.md) §8 wants the district move at about 45–75 minutes. Retune before that slice.
- **NM-CLAMP.** The idle-core per-tick clamp under-credits a hidden tab that has been asleep more than 4 hours. Section 8 says there is no clamp while the page is loaded. Shared Systems Architect rules on this. It is off the blocking path.
- Moving to a new district, permits, and a collection of vendor stories, once NM-RETUNE has landed.
- IDLE-SS1, IDLE-CS1 and IDLE-DP1. They wait on the shelf until Night Market has been playtested.
- More stall types beyond the first sitting.

## Timeline

Measured 2026-10-14. Night Market's feature rate is 2 pulls in 7 days (0.29 a day) and the same 2 in 14 days (0.14 a day): IDLE-CORE and #403. The maths is in [launch-summary.md](launch-summary.md).

**Pulls left that block finish:** 8 in the likely case, 9 in the slower case. #403 is merged (`d9cde61`). NM-FIX-7 is the confirmation session, not a build pull. NM-RETUNE and NM-CLAMP are not in this count. NM-FIX-1 shares NM-LABEL's pull in the likely count. Visual life is two pulls.

| ID | Size | What |
|---|---|---|
| NM-FIX-3 | S | Lane strip, coin pop, flicker |
| NM-FIX-4 | S | Steam, flash, passers-by |
| NM-FIX-8 | S | Back control and the fold |
| NM-FIX-5 | S | Pour flow |
| NM-FIX-6 | S | "Your save" |
| NM-FIX-2 | S | Offline honesty |
| NM-HUB | S | Hall entry |
| NM-LABEL with NM-FIX-1 | S | Payback. Slower counts NM-FIX-1 as its own extra pull |

**Likely:** 8 / 0.29 days of build, plus 1 confirmation day, plus 0 buffer. **2026-11-12.** Was 2026-10-22.
**Slower:** 9 / 0.14 days of build, two playtest rounds, and a 2-day buffer. **2026-12-27.** Was 2026-11-08.

## Owner and the first tasks

**Owner:** Side Games Dev Lead, with guest bots welcome. The visual-life spec is from Game Art Director.

1. **NM-FIX-3.** Lane-strip canvas, coin pop and flicker.
2. **NM-FIX-4.** Steam, flash and passers-by.
3. **NM-FIX-1.** Fix the "2s" hint. It may land with NM-LABEL.
4. **NM-FIX-2** sits later, immediately before NM-RETUNE.
