# Launch checklist: Lantern Bowl

**Owner:** Side Games Dev Lead.
**Build on main:** v0.1.4. One match at Lamplight Field. The save is `lantern-bowl-save-v1`, file version 2.
**Ruling:** Evan, 2026-10-14. Lantern Bowl is a launch game. Round 5 counts: #371, and #383 (5a). No new content after this checklist until it is done.
**Dates:** measured 2026-10-14. See [launch-summary.md](launch-summary.md). The earlier dev-lead dates are replaced.

Playtester scores every week. Finished means the game is playable and fun. Merging a pull request does not finish it. Playtester or Evan confirms it.

Round 5's bar is the note on [#371](https://github.com/ecbarish/generations/issues/371#issuecomment-6170087937): a new player can name the down, the distance and which way the goal is within a few seconds, and a played match can move the ball and score. Playtester also has to say it **reads as football in 5 seconds**.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **LBL-1** | 5b is the controls, the passing, the play art and the tutorial. Split into 5b-1 and 5b-2. Not started |
| Playtester rates the first session as fun | **LBL-2** | **6/10** on 2026-10-14. The bar is at least 7/10. This does not pass. 5a (#383) is merged (`253c545`) |
| No crashes and no broken saves | **LBL-3** | A save is written after every play. An older file steps up to version 2 and keeps the match. A newer file is left alone. Still confirm a reload on the round-5 build. A separate small pull moves the save onto `Arcade.versions` without changing the save format |
| Plays well on a phone | **LBL-4** | **LBL-11.** The phone layout still needs a playtest. Owner: Playtester. The version label is still cut off at 360px wide |
| One clear goal | **LBL-5** | 5c keeps the score, the down and the clock readable. 5b shows the routes before the snap. Playtester's "reads as football in 5 seconds" pass sits here |
| Known bugs are fixed | **LBL-6** | **LBL-12** is first: sideways, Kick off is off screen, and Settings opens nothing. Then **LBL-7** through **LBL-10**. 5c's follow-ups remain |

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer plays the first match without help.
- Playtester scores fun at least **7/10**. Confirmed by the dev lead.
- No blocker and no major bug.
- It plays on a phone, including at 360px wide, where the version label is currently cut off.
- One clear goal: it reads as football in 5 seconds. Move the ball, know the down, and know which way the goal is.

**Must-haves** (these block finish):

1. A field a newcomer can follow (LBL-2, round 5a, #383). Art approved. Merged.
2. **Retro Bowl-feel passing, no auto-aim** (LBL-1, 5b-1).
3. **Play variety, with routes shown before the snap** (LBL-1, 5b-2).
4. Down, distance, score and clock stay readable (LBL-5, round 5c), including the 360px version label and a median carry nearer 3 than 2.7.
5. A reload keeps the same match, and the save rides on `Arcade.versions` with no format change (LBL-3).
6. A phone session of that build plays well (LBL-4).
7. Playtester's fun score is at least 7/10, and the match reads as football in 5 seconds (LBL-2, LBL-5). The 2026-10-14 score is 6/10.
8. Sideways on a phone, the page scrolls so Kick off is on screen, and Settings opens (LBL-12). Rating numbers rewritten or hidden (LBL-7). Throw power or aim shown, and a missed deep pass explained (LBL-8). Opponent drives summarised, and the clock slower (LBL-9). Field goals on 4th down, and varied quick-pass yardage (LBL-10).
9. A phone layout playtest (LBL-11). Owner: Playtester.

## Playtest gaps (2026-10-14, fun 6/10)

These come before 5b. Guest bots are welcome. One pull each.

| ID | Size | Owner | What |
|---|---|---|---|
| LBL-12 | S | Side Games Dev Lead | First task. Sideways, the page does not scroll, so Kick off is off screen. Settings opens nothing |
| LBL-7 | S | Side Games Dev Lead | Rewrite or hide the rating numbers |
| LBL-8 | S | Side Games Dev Lead | Show throw power or aim, and explain why a deep pass missed |
| LBL-9 | S | Side Games Dev Lead | Summarise the opponent's drives, and slow the clock |
| LBL-10 | S | Side Games Dev Lead | Minor: field goals on 4th down, and varied quick-pass yardage |
| LBL-11 | — | Playtester | The phone layout still needs a playtest. Not a build pull |

**5b is not only a tutorial.** Evan's passing slice is:

- Retro Bowl passing: pull back for power, aim with the drag, no auto-aim by default. Quarterback ratings set the aim arc's length and the accuracy. Power sets the range and the landing radius.
- An optional All 22 / Madden mode, with a button per receiver.
- Juke, spin, and a joystick.
- Play art: routes drawn before the snap, and play-call diagrams.
- A playbook across formations, from hand-ported MIT code.
- A tutorial and a throwaway.

**Does not block finish:**

- A league, money, scouting, a draft, box scores, or a career save. Those stay in [lantern-bowl.md](lantern-bowl.md) under Later.
- Another round after this checklist.
- More art on the field. Game Art Director has already approved #383.

## Timeline

Measured 2026-10-14. Lantern Bowl's feature rate is 6 pulls in 7 days (0.86 a day) and the same 6 in 14 days (0.43 a day). The maths is in [launch-summary.md](launch-summary.md).

**Pulls left:** 5a (#383) is merged.

| ID | Size | What |
|---|---|---|
| 5b-1 / LBL-1 | M | Controls and passing. Together with 5b-2 this is one L, split in two |
| 5b-2 / LBL-1 | M | Play art and the playbook |
| 5c / LBL-5 | S | Score, down and clock, the version label at 360px, and median carry 2.7 against a target of 3 |
| Save cleanup / LBL-3 | S | Onto `Arcade.versions`. No save format change |

The playtest adds **5** pulls (LBL-12 and LBL-7 through LBL-10). LBL-11 is not a build pull. Likely counts **9** (those 5, plus the 4 already listed, with the label and the carry inside 5c). Slower counts **10**, with the label and the carry as their own small pull.

**Likely:** 9 / 0.86 days of build, plus 1 confirmation day, plus 0 buffer. **2026-10-26.** Was 2026-10-20.
**Slower:** 10 / 0.43 days of build, two playtest rounds, and a 2-day buffer. **2026-11-13.** Was 2026-11-01.

## Owner and the first tasks

**Owner:** Side Games Dev Lead. Guest bots are welcome.

1. **LBL-12.** Sideways, bring Kick off on screen, and make Settings open.
2. **LBL-7.** Rewrite or hide the rating numbers.
3. **LBL-8.** Show throw power or aim, and explain a missed deep pass.
4. **LBL-9.** Summarise the opponent's drives and slow the clock.
5. **5b-1** stays next among the older gaps. 5a (#383) is merged. Side Games Dev Lead already claimed 5b-1.
