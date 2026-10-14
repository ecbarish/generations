# Launch checklist: Wildbond

**Owner:** Wildbond & Starfall Dev Lead.
**Lane:** steady background. Wildbond is the long project, not the first to ship. New content waits until this checklist is done: WB-NOSTALGIA (NOS-1a through NOS-1e), roster growth, and WB2.2.
**Ruling:** Evan, 2026-10-14.

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
| A newcomer gets through the first 10 minutes without help | WBL-1, WBL-3, WBL-4, WBL-5, WBL-8 | Menu, first catch, objective, early pace, and the Thornwood road are all open. Fun on this partial run is 5/10 |
| Playtester rates the first session as fun | WBL-2, WBL-3, WBL-5, WBL-6 | **5/10** on the partial run. The bar is at least 7/10. This run does not pass |
| No crashes and no broken saves | WBL-7, WBL-9, WBL-10, WBL-11, WBL-12 | Walking north once returned to the title screen. Continue should come back through the title screen to the same place. Two ENGINE-SAVEVER follow-ups are still open |
| Plays well on a phone | — | **Not yet tested.** No phone bug is filed. The item stays open until a played phone session |
| One clear goal | WBL-1, WBL-4, WBL-8 | No status bar, the objective text does not fit, and the road to Thornwood does nothing |
| Known bugs are fixed | WBL-1 through WBL-12 block finish. WBL-13 through WBL-22 do not | Majors are listed under must-haves. The rest are recorded and wait |

## Gaps, top priority first

**WBL-1. Menu and status bar.** Esc, the briefcase icon, and I open a real menu, plus a status bar. The menu covers party, field book, and save. Ticks the first 10 minutes and one clear goal.

**WBL-2. Battles start fair.** A battle opens on the action menu. The enemy does not get a free hit. Ticks fun and known bugs.

**WBL-3. A first catch you can see.** Bag is greyed out today, and catching is hidden under Bond. Bag is enabled whenever you have items. Game Researcher's suggestion for this gap and for WBL-4: do it the way Pokémon stages a first catch. In the first wild encounter, show the Bond prompt on screen and give enough balls that the catch cannot fail. Not a wall of tutorial text. Ticks the first 10 minutes, fun, and one clear goal.

**WBL-4. An objective that fits.** An on-screen objective, and tutorial text that fits its box. The first-catch Bond prompt is that objective for the opening encounter. Ticks the first 10 minutes and one clear goal.

**WBL-5. The early route moves.** A faster early encounter rate, and healing, so the first session is not a long walk with nothing to do. Ticks the first 10 minutes and fun.

**WBL-6. Battle sprites.** Battle screens still draw the overworld sprites scaled up. Game Art Director has handed **8 finished 64×64 battle sprites** to Wildbond & Starfall Dev Lead. **Wiring those in is the first task for this gap.** Mosshog's touch-up, and the stage sizing, follow. Those two do not block finish. Ticks fun and known bugs.

**WBL-7. North exit.** Walking north once sent the player back to the title screen. Ticks no crashes and known bugs.

**WBL-8. The road to Thornwood.** It does nothing. Ticks the first 10 minutes, one clear goal, and known bugs.

**WBL-9. Continue.** Continue goes through the title screen and returns to the same place. Ticks no crashes and no broken saves.

**WBL-10. A real Continue test.** An end-to-end test that starts a journey, quits, continues, and lands in the same place. Headless tests that only load a fixture file do not cover this.

**WBL-11. A migrate that returns null.** In `shared/engine.js` `applyVersion`, a migrate that returns null should hold the session the way a throw does. The save stays untouched and saving stays off. `tests/engine-save-checks.js` should cover it. Shared Systems Architect checks the engine change.

**WBL-12. The hub row stays while a save is held.** `erase` in `shared/engine.js` still drops the launcher index entry. A held save should still show on the hub, and should not be written over. Shared Systems Architect checks this too.

### Minors (they do not block finish)

- **WBL-13.** The sprite vanishes when hit.
- **WBL-14.** Choose on the starter screen walks instead of choosing.
- **WBL-15.** Long captions are cut off at the bottom.
- **WBL-16.** Clicking "Continue your journey".
- **WBL-17.** The ranch prompt.

### Later fixes (they do not block "playable and fun")

- **WBL-18.** 12 duplicate species in `wildbond.json`, with no trust requirement on their evolutions.
- **WBL-19.** Bellwarden and Doorlamp float, and the leftover all-1 size table comes out (`SIZE_SCALE` in `wildbond-godot/scripts/main.gd`). Notes from #368.
- **WBL-20.** True-scale cottage and barn doors, with an old-save fix. Needs Evan's sign-off.
- **WBL-21.** #345, evolution story wording. Final forms read as level plus trust or bond, and DD-5 is updated.
- **WBL-22.** #390, Thornwood pond shape and whole-pixel reed sway. Open as #399.

## Finished means

Playable and fun. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer plays the first session without help. That session includes a menu, a battle, and a first catch.
- Playtester scores fun at least **7/10**. The partial run is 5/10, so 7 is a real step up. It does not wait on the minors or on WBL-18 through WBL-22. Confirm or change it when the dev lead checks the dates.
- No blocker and no major bug (WBL-1 through WBL-12).
- It plays on a phone. **This is not yet tested**, so the checklist cannot pass until that session happens. No phone layout bug is assumed before then.
- One clear goal on screen (the objective, and a road that goes somewhere).

**Must-haves:**

1. A menu for party, field book and save, and a status bar (WBL-1).
2. A battle that starts on the action menu (WBL-2).
3. A guided first catch that cannot fail, with Bag usable when you have items (WBL-3, and the Bond prompt for WBL-4).
4. Objective text that fits, and an early pace with encounters and healing (WBL-4, WBL-5).
5. The north exit stays in the world, the Thornwood road goes somewhere, and Continue returns through the title screen to the same place (WBL-7, WBL-8, WBL-9, WBL-10).
6. Battles use the 8 finished 64×64 sprites already handed over (WBL-6).

**Does not block finish:**

- Mosshog's touch-up and battle-stage sizing, after the 8 sprites are wired.
- WBL-13 through WBL-17 (the minors above).
- WBL-18 through WBL-22 (duplicates, floating creatures, true-scale doors, evolution wording, the pond).
- WB-NOSTALGIA, roster growth, WB2.2, and any new area or creature.
- A played session past 30 minutes. Still worth doing. It does not hold the first-session bar.
- WB-FUNNEL1 (#380) may finish. It logs the opening and does not add creatures. The checklist does not wait on it.

## Timeline

Pending dev-lead check. Same 14-day squash count (2026-09-30 through 2026-10-14): Wildbond landed **6 squash merges, 3.0 a week** (#372, #382, #368, #361, #370, #366). That fortnight also included catalogue and evolution work. This lane is now background, and new content is stopped, so the dates use **about one pull a week**, not 3.

**Pulls left that block finish** (gaps may share a pull where the lead prefers):

| Batch | Size | Gaps |
|---|---|---|
| Menu | M | WBL-1 |
| Battles | M | WBL-2 |
| First catch | M | WBL-3 and the Bond prompt in WBL-4 |
| Early pace | S | WBL-4 text fit, WBL-5 |
| Sprites | M | WBL-6, wiring the 8 sprites only |
| Road and Continue | M | WBL-7, WBL-8, WBL-9, WBL-10 |

WBL-11 and WBL-12 are small engine follow-ups. They can ride with the Continue batch if Shared Systems Architect is free. If they need their own pull, that is an extra S in the slower case.

**Likely:** those six pulls, one a week, then a Playtester week to rescore from 5/10. **2026-12-02.**
**Slower:** one pull every two weeks, a second fun pass, and a phone fix if that untested session finds one. **2027-01-13.**

## Owner and the first three tasks

**Owner:** Wildbond & Starfall Dev Lead.

1. **WBL-1.** The menu and the status bar.
2. **WBL-2.** Battles start on the action menu, with no free hit.
3. **WBL-3.** The guided first catch. Wiring the 8 battle sprites is the first task inside WBL-6, and it comes after these three.
