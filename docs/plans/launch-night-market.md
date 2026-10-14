# Launch checklist: Night Market

**Owner:** Guest lane (#373) for the Night Market bundles. Side Games Dev Lead keeps Little Ranch and Lantern Bowl.
**Core:** IDLE-CORE is merged (#393, `shared/idle-core.js`). Games keep their own saves. The core is not rebuilt for this checklist.
**The build:** IDLE-NM1, Night Market Stalls. **#403** is merged (`d9cde61`). The hub entry was not in that pull.
**Ruling:** Evan, 2026-10-14. Night Market is a launch game. IDLE-NM1 is the build that fills this checklist. IDLE-SS1, IDLE-CS1 and IDLE-DP1 wait until Night Market has been playtested.
**Dates:** measured 2026-10-14, then counted as bundles. See [launch-summary.md](launch-summary.md). The 29 October and 22 November dates are placeholders.
**Chunks** (Evan, 2026-10-14): one pull request per fix list or feature area, and one game per pull request. Split only when one area gets genuinely risky. Guardrails stay: tests green, old saves load, screenshots, Game Art Director reviews any art, and no save-format change without Evan.

Spec: [office-idle-progression.md](../research/office-idle-progression.md) §4A and §8, and the house rules in [village-and-business-review.md](../research/village-and-business-review.md). You do the job yourself before you hire. Offline earnings are capped. There is no multiplier treadmill.

Playtester scores the first session once the stall exists, then every week. Finished means it is playable and fun. Merging #403 does not finish it. Playtester or Evan confirms it.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **NML-1** | #403 is merged. A newcomer still cannot find the stall from the hall. **NM-HUB** needs its own claim |
| Playtester rates the first session as fun | **NML-2** | **5/10** on 2026-10-14. The bar is at least 7/10. This does not pass |
| No crashes and no broken saves | **NML-3** | #403 keeps the stall on the idle core. **NM-FIX-6:** "Your save" should do something. A reload must show the away summary and leave every other game's save alone |
| Plays well on a phone | **NML-4** | **NM-FIX-7.** The phone layout still needs a playtest. Owner: Playtester |
| One clear goal | **NML-5** | One stall you work yourself. Payback hint and the time-to-afford line are done (#421). **NM-PLAY** still has the pour: 25 clicks, then the button vanishes |
| Known bugs are fixed | **NML-6** | The offline label is done (#421). **NM-VIS** is visual life, one pull. **NM-PHONE** is the back control and the fold. **NM-RETUNE** still waits for the district slice. **NM-CLAMP** is below |

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
6. A hub and launcher entry, so a newcomer can open the stall (**NM-HUB**). One pull. Not part of #403.
7. Done (#421, `1459413`): the payback line tells the truth (**NM-LABEL**, **NM-FIX-1**).
8. Done (#421, `1459413`): offline earnings stay at 50% and the screen says so (**NM-FIX-2**).
9. Visual life, one pull (**NM-VIS**), spec from Game Art Director. Lane-strip canvas, coin pop and flicker (**NM-FIX-3**), plus steam, flash and passers-by (**NM-FIX-4**).
10. "Back to the arcade" is large enough and does not cover another button, and a stall is on screen on a phone (**NM-PHONE**, **NM-FIX-8**).
11. The pour keeps a button after 25 clicks, "Your save" does something, and a time hint does not print a trailing zero (**NM-PLAY**: **NM-FIX-5**, **NM-FIX-6**).
12. A phone layout playtest (**NM-FIX-7**). Owner: Playtester.

## Playtest gaps (2026-10-14, fun 5/10)

These are bundles, not one pull each. Guest lane (#373) owns them. Payback hint and offline label are done (#421, `1459413`).

| ID | Owner | What |
|---|---|---|
| NM-PLAY | Guest lane (#373) | First bundle. Pour flow (NM-FIX-5), save controls (NM-FIX-6), and the 22.0s trailing-zero fix |
| NM-VIS | Guest lane (#373) | Visuals, one pull: lane-strip canvas, coin pop and flicker (NM-FIX-3), plus steam, flash and passers-by (NM-FIX-4). Spec from Game Art Director, who reviews the art |
| NM-PHONE | Guest lane (#373) | "Back to the arcade" is 112×17 px and overlaps a button. The stalls sit below the fold (NM-FIX-8) |
| NM-HUB | Guest lane (#373) | Hall and launcher entry. #403 did not add this |
| NM-FIX-7 | Playtester | The phone layout still needs a playtest. Not a build pull |

**Reviewer notes that do not block the first session:**

- **NM-RETUNE.** 1M lifetime coins arrives in about 8 minutes. [office-idle-progression.md](../research/office-idle-progression.md) §8 wants the district move at about 45–75 minutes. Retune before that slice.
- **NM-CLAMP.** The idle-core per-tick clamp under-credits a hidden tab that has been asleep more than 4 hours. Section 8 says there is no clamp while the page is loaded. Shared Systems Architect rules on this. It is off the blocking path.
- Moving to a new district, permits, and a collection of vendor stories, once NM-RETUNE has landed.
- IDLE-SS1, IDLE-CS1 and IDLE-DP1. They wait on the shelf until Night Market has been playtested.
- More stall types beyond the first sitting.

## Timeline

Measured 2026-10-14. Night Market's feature rate is 2 pulls in 7 days (0.29 a day) and the same 2 in 14 days (0.14 a day): IDLE-CORE and #403. The maths is in [launch-summary.md](launch-summary.md).

**Bundles left that block finish:** 4. #403 is merged. Payback hint and offline label are done (#421, `1459413`). NM-FIX-7 is not a bundle. NM-RETUNE and NM-CLAMP are not in this count. Visuals 1 and 2 are one pull. The per-pull rate applied to these bundles makes the dates estimates, and the small sample makes them placeholders.

| ID | What is inside |
|---|---|
| NM-PLAY | Pour flow, save controls, and the 22.0s trailing-zero fix |
| NM-VIS | Lane strip, coin pop, flicker, steam, flash, and passers-by. One pull. Game Art Director reviews the art |
| NM-PHONE | The back control and the stalls below the fold |
| NM-HUB | Hall and launcher entry |

**Likely:** 4 / 0.29 days of build, plus 1 confirmation day, plus 0 buffer. **2026-10-29.**
**Slower:** 4 / 0.14 days of build, two playtest rounds, and a 2-day buffer. **2026-11-22.**

## Owner and the first bundle

**Owner:** Guest lane (#373).

1. **NM-PLAY.** Pour flow, save controls, and the trailing-zero fix, in one pull.
