# Launch checklist: Lantern Bowl

**Owner:** Side Games Dev Lead.
**Build on main:** v0.1.4. One match at Lamplight Field. The save is `lantern-bowl-save-v1`, file version 2.
**Ruling:** Evan, 2026-10-14. Lantern Bowl is a launch game. Round 5 counts: #371, and #383 (5a). No new content after this checklist until it is done. On a phone it is landscape-only. Held upright, it shows "Turn your phone sideways", the way ALL-22 does. Portrait shows that prompt and will not get its own layout.
**Dates:** measured 2026-10-14, then counted as bundles. See [launch-summary.md](launch-summary.md).
**Chunks** (Evan, 2026-10-14): one pull request per fix list or feature area, and one game per pull request. Split only when one area gets genuinely risky. Guardrails stay: tests green, old saves load, screenshots, Game Art Director reviews any art, and no save-format change without Evan.

Playtester scores every week. Finished means the game is playable and fun. Merging a pull request does not finish it. Playtester or Evan confirms it.

Round 5's bar is the note on [#371](https://github.com/ecbarish/generations/issues/371#issuecomment-6170087937): a new player can name the down, the distance and which way the goal is within a few seconds, and a played match can move the ball and score. Playtester also has to say it **reads as football in 5 seconds**.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | **LBL-1** | Evan played on his phone and stopped the small 5b fixes. **LB-PLAYSCREEN** is the one bundle, and it is #432, which replaces #422 |
| Playtester rates the first session as fun | **LBL-2** | **6/10** on 2026-10-14. The bar is at least 7/10. This does not pass. 5a (#383) is merged (`253c545`) |
| No crashes and no broken saves | **LBL-3** | A save is written after every play. An older file steps up to version 2 and keeps the match. **LB-SAVE** still moves the save onto `Arcade.versions` without changing the save format |
| Plays well in landscape on a phone | **LBL-4** | The phone rows are inside **LB-PLAYSCREEN**. In landscape the field fills the screen. Held upright, the player sees "Turn your phone sideways", the way ALL-22 does. Portrait will not get its own layout |
| One clear goal | **LBL-5** | The thin HUD, and the routes shown before the snap, are inside **LB-PLAYSCREEN** |
| Known bugs are fixed | **LBL-6** | **LB-PLAYSCREEN** replaces 5b-1, 5b-2, the phone rows and the ratings rows. Drives, the clock, the median carry, field goals and yardage stay in **LB-MATCH**. The save stays in **LB-SAVE** |

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
2. **LB-PLAYSCREEN**, one large pull, owned by Side Games Dev Lead. It is #432, which replaces #422. In landscape the field fills the screen, with a thin HUD, drag-to-throw passing with visible routes, steering and juking on runs, a small play-call overlay, and no rating narration. Held upright, it shows "Turn your phone sideways", the way ALL-22 does. Portrait will not get its own layout. This replaces 5b-1, 5b-2, the phone rows and the ratings rows.
3. Down, distance, score and clock stay readable on that thin HUD (LBL-5). A median carry nearer 3 than 2.7 stays in **LB-MATCH**, with opponent drives and a slower clock (LBL-9), and field goals on 4th down with varied quick-pass yardage (LBL-10).
4. A reload keeps the same match, and the save rides on `Arcade.versions` with no format change (LBL-3, **LB-SAVE**).
5. A landscape phone session of that build plays well, because the field fills the screen (LBL-4). That is inside LB-PLAYSCREEN, not a separate row. Portrait shows the rotate prompt and will not get its own layout.
6. Playtester's fun score is at least 7/10, and the match reads as football in 5 seconds (LBL-2, LBL-5). The 2026-10-14 score is 6/10.

## Playtest gaps (2026-10-14, fun 6/10)

Evan played Lantern Bowl on his phone and stopped the small 5b fixes. These are the bundles now. Side Games Dev Lead owns them. LB-PLAYSCREEN comes first. It counts as one large bundle.

| ID | Owner | What |
|---|---|---|
| LB-PLAYSCREEN | Side Games Dev Lead | First bundle. One large pull. It is #432, which replaces #422. In landscape the field fills the screen, with a thin HUD, drag-to-throw passing with visible routes, steering and juking on runs, a small play-call overlay, and no rating narration. Held upright, it shows "Turn your phone sideways", the way ALL-22 does. Portrait will not get its own layout. Replaces 5b-1, 5b-2, the phone rows (LBL-11, LBL-12) and the ratings rows (LBL-7, LBL-8) |
| LB-MATCH | Side Games Dev Lead | What the play screen does not cover. Opponent drives and a slower clock (LBL-9), a median carry nearer 3 than 2.7, field goals on 4th down, and varied quick-pass yardage (LBL-10) |
| LB-SAVE | Side Games Dev Lead | Onto `Arcade.versions`. Split out because it touches the save. No save-format change without Evan (LBL-3) |

The earlier split into 5b-1 and 5b-2 is stopped. Passing, routes, the phone layout and the ratings are LB-PLAYSCREEN, not their own pulls.

**Does not block finish:**

- A league, money, scouting, a draft, box scores, or a career save. Those stay in [lantern-bowl.md](lantern-bowl.md) under Later.
- Another round after this checklist.
- More art on the field. Game Art Director has already approved #383.

## Timeline

Measured 2026-10-14. Lantern Bowl's feature rate is 6 pulls in 7 days (0.86 a day) and the same 6 in 14 days (0.43 a day). The maths is in [launch-summary.md](launch-summary.md).

**Bundles left:** 3. 5a (#383) is merged. LB-PLAYSCREEN counts as one large bundle, even though it replaces several old rows. The save cleanup is split out because it touches the save. The per-pull rate applied to these bundles makes the dates estimates. The redesign is new scope, so these dates are an estimate.

| ID | What is inside |
|---|---|
| LB-PLAYSCREEN | In landscape the field fills the screen, with a thin HUD, drag-to-throw passing with visible routes, steering and juking on runs, a small play-call overlay, and no rating narration. Portrait shows "Turn your phone sideways" and will not get its own layout. This is #432, which replaces #422 |
| LB-MATCH | Opponent drives, a slower clock, the median carry, field goals on 4th down, and quick-pass yardage |
| LB-SAVE | Onto `Arcade.versions`. No save-format change without Evan |

**Likely:** 3 / 0.86 days of build, plus 1 confirmation day, plus 0 buffer. **2026-10-19.**
**Slower:** 3 / 0.43 days of build, two playtest rounds, and a 2-day buffer. **2026-10-28.**

## Owner and the first bundle

**Owner:** Side Games Dev Lead.

1. **LB-PLAYSCREEN.** The play screen, one large pull. It is #432, which replaces #422. Landscape only on a phone.
