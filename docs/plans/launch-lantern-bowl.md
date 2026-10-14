# Launch checklist: Lantern Bowl

**Owner:** Side Games Dev Lead.
**Build on main:** v0.1.4. One match at Lamplight Field. The save is `lantern-bowl-save-v1`, file version 2.
**Ruling:** Evan, 2026-10-14. Lantern Bowl is a launch game. Round 5 counts: #371, and #383 (5a). No new content after this checklist until it is done.
**Dates:** checked by dev lead, 2026-10-14.

Playtester scores every week. Finished means the game is playable and fun. Merging a pull request does not finish it. Playtester or Evan confirms it.

Round 5's bar is the note on [#371](https://github.com/ecbarish/generations/issues/371#issuecomment-6170087937): a new player can name the down, the distance and which way the goal is within a few seconds, and a played match can move the ball and score. Playtester also has to say it **reads as football in 5 seconds**.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **LBL-1** | 5b is the controls, the passing, the play art and the tutorial. Split into 5b-1 and 5b-2. Not started |
| Playtester rates the first session as fun | **LBL-2** | Not yet scored on the 10-point scale. The bar is at least 7/10, confirmed. 5a (#383) is the readable field. Game Art Director and Reviewer approved it at `77361c6`. It is merging, not open work |
| No crashes and no broken saves | **LBL-3** | A save is written after every play. An older file steps up to version 2 and keeps the match. A newer file is left alone. Still confirm a reload on the round-5 build. A separate small pull moves the save onto `Arcade.versions` without changing the save format |
| Plays well on a phone | **LBL-4** | The page is phone-first. A played phone session of round 5 is still owed. Game Art Director: the version label is cut off at 360px wide |
| One clear goal | **LBL-5** | 5c keeps the score, the down and the clock readable. 5b shows the routes before the snap. Playtester's "reads as football in 5 seconds" pass sits here |
| Known bugs are fixed | **LBL-6** | 5c's follow-ups: the version label at 360px, and a median carry of 2.7 against a target of 3. A new crash or a broken save jumps this row |

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer plays the first match without help.
- Playtester scores fun at least **7/10**. Confirmed by the dev lead.
- No blocker and no major bug.
- It plays on a phone, including at 360px wide, where the version label is currently cut off.
- One clear goal: it reads as football in 5 seconds. Move the ball, know the down, and know which way the goal is.

**Must-haves** (these block finish):

1. A field a newcomer can follow (LBL-2, round 5a, #383). Art approved. The pull is merging.
2. **Retro Bowl-feel passing, no auto-aim** (LBL-1, 5b-1).
3. **Play variety, with routes shown before the snap** (LBL-1, 5b-2).
4. Down, distance, score and clock stay readable (LBL-5, round 5c), including the 360px version label and a median carry nearer 3 than 2.7.
5. A reload keeps the same match, and the save rides on `Arcade.versions` with no format change (LBL-3).
6. A phone session of that build plays well (LBL-4).
7. Playtester's fun score is at least 7/10, and the match reads as football in 5 seconds (LBL-2, LBL-5).

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

Checked by dev lead. The measured squash count (2026-09-30 through 2026-10-14) is still **3 Lantern Bowl squash merges, 1.5 a week** (#369, #356, #352). The dates below are the lead's, not that raw rate. The lead is also on Little Ranch and Night Market.

**Pulls left:**

| ID | Size | What |
|---|---|---|
| 5a / LBL-2 | M | #383, merging. Approved by Game Art Director and Reviewer at `77361c6` |
| 5b-1 / LBL-1 | M | Controls and passing. Together with 5b-2 this is one L, split in two |
| 5b-2 / LBL-1 | M | Play art and the playbook |
| 5c / LBL-5 | S | Score, down and clock. Follow-ups: version label cut off at 360px, and median carry 2.7 against a target of 3 |
| Save cleanup / LBL-3 | S | Onto `Arcade.versions`. No save format change |

That is **1M merging, then 2M + 2–3S**. The third S is only if the 360px label and the carry do not fit inside 5c.

**Likely:** **2026-11-11.**
**Slower:** **2026-12-02.**

## Owner and the first three tasks

**Owner:** Side Games Dev Lead.

1. **5b-1.** Retro Bowl-feel passing. Pull back for power, aim with the drag, no auto-aim by default. 5a (#383) is already approved and merging.
2. **5b-2.** Play art and a playbook. Routes drawn before the snap. Formations from the hand-ported MIT code. Tutorial and throwaway included.
3. **5c.** Score, down and clock, then the version label at 360px and the median carry (2.7 against a target of 3). The save cleanup onto `Arcade.versions` can land beside it.
