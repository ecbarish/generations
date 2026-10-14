# Launch checklist: Lantern Bowl

**Owner:** Side Games Dev Lead.
**Build on main:** v0.1.4. One match at Lamplight Field. The save is `lantern-bowl-save-v1`, file version 2.
**Ruling:** Evan, 2026-10-14. Lantern Bowl is a launch game. Round 5 already in flight counts: #371, and #383 (5a). No new content after 5c until this checklist is done.

Playtester scores every week. Finished means the game is playable and fun. Merging a pull request does not finish it. Playtester or Evan confirms it.

Round 5's bar is the note on [#371](https://github.com/ecbarish/generations/issues/371#issuecomment-6170087937): a new player can name the down, the distance and which way the goal is within a few seconds, and a played match can move the ball and score.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **LBL-1** | 5b, the tutorial, is still to do. It is part of #371 |
| Playtester rates the first session as fun | **LBL-2** | Not yet scored on the 10-point scale. 5a (#383, open) is the readable field: side-on camera, eleven a side, carries with a real spread. That work counts |
| No crashes and no broken saves | **LBL-3** | A save is written after every play. An older file steps up to version 2 and keeps the match. A newer file is left alone. Still confirm a reload on the round-5 build |
| Plays well on a phone | **LBL-4** | The page is phone-first. A played phone session of round 5 is still owed |
| One clear goal | **LBL-5** | 5b and 5c. Down, distance and which way to the goal, with the score and the clock still readable |
| Known bugs are fixed | **LBL-6** | Whatever #371 still lists after 5a, 5b and 5c. A new crash or a broken save jumps this row |

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer plays the first match without help.
- Playtester scores fun at least **7/10**. Same target as the other launch games. Confirm or change it when the dev lead checks the dates.
- No blocker and no major bug.
- It plays on a phone.
- One clear goal: move the ball, know the down, and know which way the goal is.

**Must-haves** (these block finish):

1. A field a newcomer can follow (LBL-2, round 5a, #383).
2. The first snaps make sense without a guide (LBL-1, round 5b).
3. Down, distance, score and clock stay readable (LBL-5, round 5c).
4. A reload keeps the same match (LBL-3).
5. A phone session of that build plays well (LBL-4).
6. Playtester's fun score is at least 7/10 (LBL-2).

**Does not block finish:**

- A league, money, scouting, a draft, box scores, or a career save. Those stay in [lantern-bowl.md](lantern-bowl.md) under Later.
- Another round after 5c.
- Extra sprites beyond what 5a needs to make the match readable.

## Timeline

Pending dev-lead check. The same 14-day count as the other checklists: Lantern Bowl landed **3 squash merges** (1.5 a week): #369, #356 and #352. Two earlier pulls in that window were merge commits (#346, #349), the first playable game and its fixes.

The likely pace is about one Lantern Bowl pull a week. The lead is also on Little Ranch and Night Market, so the dates do not use 1.5 a week.

**Pulls left:**

| ID | Size | What |
|---|---|---|
| 5a / LBL-2 | M | Already open as #383. Readable field |
| 5b / LBL-1 | M | Tutorial, so the first snaps need no guide |
| 5c / LBL-5 | S | Score, down and clock through the match |

A phone fix, if the session finds one, is an S in the slower case.

**Likely:** 5a, then 5b, then 5c, then a Playtester week. **2026-11-11.**
**Slower:** 5a slips, the phone session needs a fix, and the first fun score is under 7/10. **2026-12-02.**

## Owner and the first three tasks

**Owner:** Side Games Dev Lead.

1. **5a (#383).** Finish the readable field. It counts toward LBL-2.
2. **5b.** A short tutorial so a newcomer can play, and can say the down, the distance and which way the goal is.
3. **5c.** Keep the score, the down and the clock readable for the whole match.
