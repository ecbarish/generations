# Launch checklist: Wildbond

**Owner:** Wildbond & Starfall Dev Lead.
**Lane:** steady background. Wildbond is the long project, not the first to ship. New content waits until this checklist is done: WB-NOSTALGIA (NOS-1a through NOS-1e), roster growth, and WB2.2.
**Ruling:** Evan, 2026-10-14.
**Dates:** measured 2026-10-14. See [launch-summary.md](launch-summary.md). The 7/10 bar is confirmed, and a played phone session is a must-pass. Phone is not yet tested. The earlier "2 pulls a week" dates are replaced.

Playtester scores every week. Finished means the game is playable and fun. Merging a pull request does not finish it. Playtester or Evan confirms it.

## Playtester, 2026-10-14

Partial newcomer report. About **6 minutes**, on an **existing save**. **Fun 5/10.** No console errors on the earlier part of the same day's check (keyboard, about 1024×594).

- **Plays well on a phone:** not yet tested.
- **Play past 30 minutes:** not yet tested. That does not block the first-session bar.
- Catching and a fresh phone session are still open. Do not mark them passed from older notes.

**Keep:** the hub layout, the art, the follower, the Bond timing on a catch, and save / Continue.

## The six items

| Item | Gaps | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | WBL-1, WBL-3, WBL-4, WBL-5, WBL-8, WBL-14 | Menu, first catch, objective, early pace, the Thornwood road, and Choose Ripplet. Fun on this partial run is 5/10 |
| Playtester rates the first session as fun | WBL-2, WBL-3, WBL-5, WBL-6 | **5/10** on the partial run. The bar is at least 7/10, confirmed by the dev lead. This run does not pass |
| No crashes and no broken saves | WBL-7, WBL-9, WBL-10 | Walking north once returned to the title screen. Continue should come back through the title screen to the same place. WBL-11 and WBL-12 are SSA, parallel, and do not block this unless the Godot build uses them |
| Plays well on a phone | — | **Not yet tested.** Confirmed as a must-pass. No phone bug is filed. The item stays open until a played phone session |
| One clear goal | WBL-1, WBL-4, WBL-8 | No status bar, the objective text does not fit, and the road to Thornwood does nothing |
| Known bugs are fixed | WBL-1 through WBL-10, and WBL-14, block finish. WBL-11 and WBL-12 do not, unless Godot uses them | Majors are listed under must-haves. The rest are recorded and wait |

## Gaps, top priority first

**WBL-1. Menu and status bar. First task.** Esc, the briefcase icon, and I open a real menu, plus a status bar. The menu covers party, field book, and save. This same pull includes **WBL-14**: on the starter screen, clicking Choose Ripplet with the mouse walks instead of choosing. That blocks the first 10 minutes, so it is a must-have, not a minor. Ticks the first 10 minutes and one clear goal.

**WBL-2. Battles start fair.** A battle opens on the action menu. The enemy does not get a free hit. Ticks fun and known bugs.

**WBL-3. An obvious Catch, and a first catch you can see.** Add a Catch button. Bag is greyed out today, and catching is hidden under Bond. Bag is enabled whenever you have items. Game Researcher's suggestion for this gap and for WBL-4: do it the way Pokémon stages a first catch. In the first wild encounter, show the Bond prompt on screen and give enough balls that the catch cannot fail. Not a wall of tutorial text. Ticks the first 10 minutes, fun, and one clear goal.

**WBL-4. The objective tracker.** An on-screen objective, and tutorial text that fits its box. The first-catch Bond prompt is that objective for the opening encounter. Ticks the first 10 minutes and one clear goal.

**WBL-6. Battle sprites. After WBL-4.** Battle screens still draw the overworld sprites scaled up. Game Art Director handed over **9 finished 64×64 battle sprites**. Wiring them in is its own pull, size S, and it waits until WBL-1 through WBL-4 are underway. Mosshog uses the older Higgsfield art for now. Game Art Director will swap that sprite later, and that swap does not block finish. Ticks fun and known bugs.

**WBL-5. The early route moves.** A faster early encounter rate, and healing, so the first session is not a long walk with nothing to do. Ticks the first 10 minutes and fun.

**WBL-7. North exit.** Walking north once sent the player back to the title screen. Ticks no crashes and known bugs.

**WBL-8. The road to Thornwood.** It does nothing. Ticks the first 10 minutes, one clear goal, and known bugs.

**WBL-9. Continue.** Continue goes through the title screen and returns to the same place. Ticks no crashes and no broken saves.

**WBL-10. A real Continue test.** An end-to-end test that starts a journey, quits, continues, and lands in the same place. Headless tests that only load a fixture file do not cover this.

**WBL-11. A migrate that returns null. SSA, parallel.** In `shared/engine.js` `applyVersion`, a migrate that returns null should hold the session the way a throw does. The save stays untouched and saving stays off. `tests/engine-save-checks.js` should cover it. Shared Systems Architect owns this. It is off Wildbond's blocking path unless the Godot build uses it.

**WBL-12. The hub row stays while a save is held. SSA, parallel.** `erase` in `shared/engine.js` still drops the launcher index entry. A held save should still show on the hub, and should not be written over. Shared Systems Architect owns this. It is off Wildbond's blocking path unless the Godot build uses it.

### Minors (they do not block finish)

- **WBL-13.** The sprite vanishes when hit.
- **WBL-15.** Long captions are cut off at the bottom.
- **WBL-16.** Clicking "Continue your journey".
- **WBL-17.** The ranch prompt.

### Later fixes (they do not block "playable and fun")

- **WBL-18.** 12 duplicate species in `wildbond.json`, with no trust requirement on their evolutions.
- **WBL-19.** Bellwarden and Doorlamp float, and the leftover all-1 size table comes out (`SIZE_SCALE` in `wildbond-godot/scripts/main.gd`). Notes from #368.
- **WBL-20.** True-scale cottage and barn doors, with an old-save fix. Needs Evan's sign-off.
- **WBL-21.** #345, evolution story wording. Final forms read as level plus trust or bond, and DD-5 is updated.
- **WBL-22.** #390, Thornwood pond shape and whole-pixel reed sway. Merged as #399 (`59f78cb`). It was not a finish blocker.

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer plays the first session without help. That session includes a menu, a battle, and a first catch.
- Playtester scores fun at least **7/10**. Confirmed by the dev lead. The partial run is 5/10, so 7 is a real step up. It does not wait on the minors or on WBL-18 through WBL-22.
- No blocker and no major bug (WBL-1 through WBL-10, and WBL-14).
- It plays on a phone. **Confirmed as a must-pass. Not yet tested**, so the checklist cannot pass until that session happens. No phone layout bug is assumed before then.
- One clear goal on screen (the objective, and a road that goes somewhere).

**Must-haves:**

1. A menu for party, field book and save, a status bar, and Choose Ripplet actually choosing (WBL-1, WBL-14).
2. A battle that starts on the action menu (WBL-2).
3. An obvious Catch button, and a guided first catch that cannot fail, with Bag usable when you have items (WBL-3).
4. An objective tracker whose text fits (WBL-4).
5. An early pace with encounters and healing (WBL-5), then the 9 battle sprites (WBL-6). Mosshog stays on the older Higgsfield art until Game Art Director swaps it.
6. The north exit stays in the world, the Thornwood road goes somewhere, and Continue returns through the title screen to the same place (WBL-7, WBL-8, WBL-9, WBL-10).
7. Fun at least 7/10, and a played phone session. Both are must-pass. The phone session has not happened yet.

**Does not block finish:**

- Swapping Mosshog off the older Higgsfield art. Game Art Director does that later.
- WBL-11 and WBL-12, unless the Godot build uses `shared/engine.js`. They are SSA, parallel.
- WBL-13, WBL-15, WBL-16 and WBL-17 (the minors above).
- WBL-18 through WBL-22 (duplicates, floating creatures, true-scale doors, evolution wording, the pond).
- WB-NOSTALGIA, roster growth, WB2.2, and any new area or creature.
- A played session past 30 minutes. Still worth doing. It does not hold the first-session bar.
- WB-FUNNEL1 (#380) is merged. It logs the opening and does not add creatures.

## Timeline

Measured 2026-10-14. Wildbond's feature rate is 31 pulls in 7 days (4.43 a day) and 34 in 14 days (2.43 a day). The maths is in [launch-summary.md](launch-summary.md). #380 and #399 are merged. They were not on this list.

**Pulls left that block finish:** 7. Order is the order of the work.

| Batch | Size | Gaps |
|---|---|---|
| Menu | M | WBL-1 and WBL-14 (Choose Ripplet) |
| Battles | M | WBL-2 |
| Catch | M | WBL-3, the Catch button and the guided first catch |
| Objective | S | WBL-4 |
| Early pace | S | WBL-5 |
| Sprites | S | WBL-6. Nine sprites, after WBL-4. Mosshog stays on the older Higgsfield art |
| Road and Continue | M | WBL-7, WBL-8, WBL-9, WBL-10 |

WBL-11 and WBL-12 are **SSA, parallel**. They are not on this list.

**Likely:** 7 / 4.43 days of build, plus 1 confirmation day, plus 0 buffer. **2026-10-17.**
**Slower:** 7 / 2.43 days of build, two playtest rounds, and a 2-day buffer. **2026-10-22.**

## Owner and the first tasks

**Owner:** Wildbond & Starfall Dev Lead. In this order:

1. **WBL-1.** The menu, the status bar, and Choose Ripplet (WBL-14).
2. **WBL-2.** Battles open on the action menu, with no free hit.
3. **WBL-3.** An obvious Catch button, and the guided first catch.
4. **WBL-4.** The objective tracker. WBL-6, the nine battle sprites, comes after this.
