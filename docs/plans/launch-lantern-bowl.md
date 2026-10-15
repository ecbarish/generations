# Launch checklist: Lantern Bowl

**Owner:** Side Games Dev Lead.
**Build on main:** v0.1.6. One match at Lamplight Field. The save is `lantern-bowl-save-v1`, file version 2.
**Ruling:** Evan, 2026-10-14, via the Director. Lantern Bowl is a team manager like Retro Bowl, and better. The approved scope is a franchise season on `shared/sports-office.js`, real blocking set by the line versus the pass rush, per-player ratings from 35 to 90, an expanded playbook with breaking routes, player progression, and a defence choice for each opponent drive. Round 5 still counts: #371, and #383 (5a). #432, the play screen, is merged. On a phone it is landscape-only. Held upright, it shows "Turn your phone sideways", the way ALL-22 does. Portrait shows that prompt and will not get its own layout.
**Reference rule:** describe Retro Bowl's and ALL-22's techniques only, and never copy their code or assets.
**Dates:** recounted 2026-10-14 from the Lantern Bowl merges on main. See [launch-summary.md](launch-summary.md).
**Chunks** (Evan, 2026-10-14): one pull request per fix list or feature area, and one game per pull request. Split only when one area gets genuinely risky. Guardrails stay: tests green, old saves load, screenshots, Game Art Director reviews any art, and no save-format change without Evan.

Playtester scores every week. Finished means the game is playable and fun. Merging a pull request does not finish it. Playtester or Evan confirms it.

Round 5's bar is the note on [#371](https://github.com/ecbarish/generations/issues/371#issuecomment-6170087937): a new player can name the down, the distance and which way the goal is within a few seconds, and a played match can move the ball and score. Playtester also has to say it **reads as football in 5 seconds**.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **LBL-1** | The play screen is done (#432, `0bf5f0d`). **LB-GAMEFLOW** is in progress, and its pull request is still pending |
| Playtester rates the first session as fun | **LBL-2** | **6/10** on 2026-10-14. The bar is at least 7/10. This does not pass. 5a (#383) is merged (`253c545`) |
| No crashes and no broken saves | **LBL-3** | A save is written after every play. An older file steps up to version 2 and keeps the match. **LB-SEASON** changes the save format, and that design needs Evan's sign-off via the Director before merge |
| Plays well in landscape on a phone | **LBL-4** | Done inside **LB-PLAYSCREEN** (#432). In landscape the field fills the screen. Held upright, the player sees "Turn your phone sideways", the way ALL-22 does. Portrait will not get its own layout |
| One clear goal | **LBL-5** | The thin HUD and the routes shown before the snap landed in **LB-PLAYSCREEN**. The season, in **LB-SEASON**, is the longer goal |
| Known bugs are fixed | **LBL-6** | Playtester's five #432 bugs ride in **LB-GAMEFLOW**: aim feedback and the catch window, the quarterback at the screen edge, the hidden toast, the target receiver highlight, and run labels |

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer plays the first match without help.
- Playtester scores fun at least **7/10**. Confirmed by the dev lead.
- No blocker and no major bug.
- It plays in landscape on a phone, with the field filling the screen and a thin HUD. Held upright, it shows "Turn your phone sideways", the way ALL-22 does. Portrait will not get its own layout.
- One clear goal: it reads as football in 5 seconds. Move the ball, know the down, and know which way the goal is.

**Must-haves** (these block finish):

1. A field a newcomer can follow (LBL-2, round 5a, #383). Art approved. Merged.
2. **LB-PLAYSCREEN** is done. It is #432 (`0bf5f0d`), which replaces #422. In landscape the field fills the screen, with a thin HUD, drag-to-throw passing with visible routes, steering and juking on runs, a small play-call overlay, and no rating narration. Held upright, it shows "Turn your phone sideways", the way ALL-22 does. Portrait will not get its own layout.
3. **LB-GAMEFLOW**, in progress, pull request pending, owned by Side Games Dev Lead. It covers 5c, a defence choice for each opponent drive, a slower clock, field goals and punts, varied quick-pass yardage, and Playtester's five #432 bugs.
4. **LB-FEEL**, the game-feel items from the comparison, owned by Side Games Dev Lead.
5. **LB-MANAGER**, owned by Side Games Dev Lead: ratings from 35 to 90, line versus rush blocking, and the expanded playbook. **LB-PLAYBOOK-DATA**, the play and route definitions as a data file with no engine changes, is its own row, owned by the guest AI dot, and it feeds LB-MANAGER.
6. **LB-SEASON**, the season and progression, owned by Side Games Dev Lead. This changes the save format. The save design needs Evan's sign-off via the Director before merge.
7. A landscape phone session plays well, because the field fills the screen (LBL-4). That landed in LB-PLAYSCREEN. Portrait shows the rotate prompt and will not get its own layout.
8. Playtester's fun score is at least 7/10, and the match reads as football in 5 seconds (LBL-2, LBL-5). The 2026-10-14 score is 6/10.

## Playtest gaps (2026-10-14, fun 6/10)

Evan played Lantern Bowl on his phone and stopped the small 5b fixes. The play screen then landed as #432. The Director has since approved the team-manager scope. These are the bundles now, in this order. Side Games Dev Lead owns them, except LB-PLAYBOOK-DATA. Describe Retro Bowl's and ALL-22's techniques only, and never copy their code or assets. The comparison is [lantern-bowl-deep-comparison.md](../research/lantern-bowl-deep-comparison.md).

| ID | Owner | What |
|---|---|---|
| LB-PLAYSCREEN | Side Games Dev Lead | Done (#432, `0bf5f0d`), which replaces #422. In landscape the field fills the screen, with a thin HUD, drag-to-throw passing with visible routes, steering and juking on runs, a small play-call overlay, and no rating narration. Held upright, it shows "Turn your phone sideways". Portrait will not get its own layout |
| LB-GAMEFLOW | Side Games Dev Lead | First open bundle. In progress, pull request pending. One pull for 5c, a defence choice for each opponent drive, a slower clock, field goals and punts, varied quick-pass yardage, and Playtester's five #432 bugs: aim feedback and the catch window, the quarterback at the screen edge, the hidden toast, the target receiver highlight, and run labels. Phones stay landscape-only |
| LB-FEEL | Side Games Dev Lead | The game-feel items from the comparison. Sound on by default, a touchdown fanfare and banner, a short hit-stop and a small shake on a tackle or a catch, a crowd bed, a guided first snap, and a two-tap kick. The behind-the-play camera can be the default, with side-on kept as an option |
| LB-PLAYBOOK-DATA | dot (guest AI) | The play and route definitions as a data file, with no engine changes. Breaking routes (a stem, then a break). This row feeds LB-MANAGER |
| LB-MANAGER | Side Games Dev Lead | Ratings from 35 to 90, real blocking set by the line versus the pass rush, and the expanded playbook once LB-PLAYBOOK-DATA is in |
| LB-SEASON | Side Games Dev Lead | The franchise season on `shared/sports-office.js`, and player progression. Save-format change. The save design needs Evan's sign-off via the Director before merge |

Passing, the phone layout and the ratings narration are LB-PLAYSCREEN, and that pull is merged. LB-MATCH's clock, kicks and yardage now sit inside LB-GAMEFLOW, so LB-MATCH is not its own pull. The old LB-SAVE note, moving the match save onto `Arcade.versions` without a format change, is overtaken by LB-SEASON: the season does change the save, and it waits on Evan.

**Does not block finish:**

- Copying Retro Bowl's or ALL-22's code or assets. Techniques may be described. The files may not be copied.
- Ads, energy, or a paid shortcut.
- Another round after this checklist.
- More art on the field beyond what a bundle needs. Game Art Director reviews any new art. #383 is already approved.

## Timeline

Recounted 2026-10-14 from `git log origin/main --first-parent`. A feature pull is a merged Lantern Bowl pull whose subject does not start with `docs:`, `COMMS:` or `QUEUE:`, and does not say bookkeeping. Seven of those landed, all on 13 and 14 October: #346, #348, #352, #356, #369, #383 and #432. The bookkeeping pull #442 and the COMMS claims are not in the rate.

The likely rate divides those 7 by the last 7 days (8–14 October): **7/7 = 1.00 a day**. The slower rate divides them by the last 14 days (1–14 October): **7/14 = 0.50 a day**. Twelve of those 14 days had no Lantern Bowl feature merge. The quiet days still count, which is the same method as the other launch games. The earlier rate was 6/7 and 6/14, before #432. Applying a per-pull rate to a bundle makes the date an estimate, and the season is larger than those seven pulls.

**Bundles left:** 5. LB-PLAYSCREEN is done (#432). LB-GAMEFLOW, LB-FEEL, LB-PLAYBOOK-DATA, LB-MANAGER and LB-SEASON are open. LB-PLAYBOOK-DATA is one of the five.

| ID | What is inside | Likely | Slower |
|---|---|---|---|
| LB-GAMEFLOW | 5c, the defence choice, the clock, field goals and punts, quick-pass yardage, and the five #432 bugs. In progress | 2026-10-16 | 2026-10-22 |
| LB-FEEL | Sound, the touchdown, hit-stop, shake, the crowd, the first snap, and the kick | 2026-10-16 | 2026-10-22 |
| LB-PLAYBOOK-DATA | Route and play data only. Owned by dot. Feeds LB-MANAGER | 2026-10-16 | 2026-10-22 |
| LB-MANAGER | Ratings 35 to 90, line versus rush, and the expanded playbook | 2026-10-16 | 2026-10-22 |
| LB-SEASON | The season, progression, and the save-format change | 2026-10-16 | 2026-10-22 |

A single bundle, on its own, is **likely 2026-10-16** and **slower 2026-10-22**. Likely is 1 / 1.00 days of build, plus 1 confirmation day, plus 0 buffer: 2.00 days, which lands on 16 October. Slower is 1 / 0.50 days of build, two playtest rounds, one extra fix at the 14-day rate (1 / 0.50), and a 2-day buffer: 2 + 2 + 2 + 2 = 8.00 days, which lands on 22 October. Those two dates are the span of one bundle. They are not five finish lines on the same day.

**Launch, all 5 together.** Likely is 5 / 1.00 days of build, plus 1 confirmation day, plus 0 buffer: 6.00 days. **2026-10-20.** Slower is 5 / 0.50 days of build, two playtest rounds, one extra fix at the 14-day rate, and a 2-day buffer: 10 + 2 + 2 + 2 = 16.00 days. **2026-10-30.** The count starts from 2026-10-14 and rounds up. These two numbers were already whole days, so the rounding did not add a day. The earlier launch dates, 19 October and 28 October, were 3 bundles at the old rate of 0.86 and 0.43.

## Owner and the first bundle

**Owner:** Side Games Dev Lead, except LB-PLAYBOOK-DATA, which is dot's.

1. **LB-GAMEFLOW.** In progress, pull request pending. Landscape only on a phone.
