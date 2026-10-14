# Launch checklist: Wildbond

**Owner:** Wildbond & Starfall Dev Lead.
**Lane:** steady background. Wildbond is the long project, not the first to ship. New content waits until this checklist is done: WB-NOSTALGIA (NOS-1a through NOS-1e), roster growth, and WB2.2.
**Ruling:** Evan, 2026-10-14.
**Dates:** measured 2026-10-14, then counted as bundles. See [launch-summary.md](launch-summary.md). The 7/10 bar is confirmed. The phone bundle builds the upright layout.
**Chunks** (Evan, 2026-10-14): one pull request per fix list or feature area, and one game per pull request. Split only when one area gets genuinely risky. Guardrails stay: tests green, old saves load, screenshots, Game Art Director reviews any art, and no save-format change without Evan.

Playtester scores every week. Finished means the game is playable and fun. Merging a pull request does not finish it. Playtester or Evan confirms it.

## Playtester, 2026-10-14

Partial newcomer report. About **6 minutes**, on an **existing save**. **Fun 5/10.** No console errors on the earlier part of the same day's check (keyboard, about 1024×594).

- **Plays well on a phone:** **WB-PHONE** builds the upright layout. The rotate gate comes off. Game Art Director art-checks it. A played session is still the confirmation day.
- **Play past 30 minutes:** not yet tested. That does not block the first-session bar.
- Catching and a fresh phone session are still open. Do not mark them passed from older notes.

**Keep:** the hub layout, the art, the follower, the Bond timing on a catch, and save / Continue.

## The six items

| Item | Gaps | Where it stands |
|---|---|---|
| A newcomer gets through the first 10 minutes without help | WBL-1, WBL-3, WBL-4, WBL-5, WBL-8, WBL-14 | Menu, first catch, objective, early pace, the Thornwood road, and Choose Ripplet. Fun on this partial run is 5/10 |
| Playtester rates the first session as fun | WBL-2, WBL-3, WBL-5, WBL-6 | **5/10** on the partial run. The bar is at least 7/10, confirmed by the dev lead. This run does not pass |
| No crashes and no broken saves | WBL-7, WBL-9, WBL-10 | Walking north once returned to the title screen. Continue should come back through the title screen to the same place. WBL-11 and WBL-12 are done (#415) |
| Plays well on a phone | **WB-PHONE** | Builds the upright layout in [wildbond-upright-layout.md](../art/wildbond-upright-layout.md), the 16-item checklist. The rotate gate is removed. Game Art Director art-checks it |
| One clear goal | WBL-1, WBL-4, WBL-8 | No status bar, the objective text does not fit, and the road to Thornwood does nothing |
| Known bugs are fixed | WBL-1 through WBL-10, and WBL-14, block finish. WBL-11 and WBL-12 do not, unless Godot uses them | Majors are listed under must-haves. The rest are recorded and wait |

## Gaps

The open majors are five bundles, not one pull each. **WB-OPEN** is first: the menu, and the #413 regression where the Larkhaven menu does not open. **WB-CATCH** is the Catch and the objective. Those two are the open Wildbond bundle, #429. **WB-PHONE** builds the upright layout. **WB-LOOK** is the early pace. The nine sprites are done. **WB-ROAD** is the north exit, the Thornwood road, and Continue.

**WBL-1. Menu and status bar. Inside WB-OPEN.** Merged in #413 (`bb4031c`): Esc, the briefcase icon, and I open a real menu, plus a status bar. The menu covers party, field book, and save. **WBL-14** rode in that same pull: Choose Ripplet chooses, instead of walking. A regression remains. The Larkhaven menu does not open. That fix stays in WB-OPEN.

**WBL-2. Battles start fair. Done (#418, `56204cc`).** A battle opens on the action menu. The enemy does not get a free hit. This is no longer open work.

**WB-PHONE. Upright layout.** One pull. Build the upright layout to Game Art Director's spec, [wildbond-upright-layout.md](../art/wildbond-upright-layout.md), the 16-item checklist. Remove the rotate gate. Game Art Director art-checks it. Owner: Wildbond & Starfall Dev Lead.

**WBL-3. An obvious Catch, and a first catch you can see. Inside WB-CATCH.** Add a Catch button. Bag is greyed out today, and catching is hidden under Bond. Bag is enabled whenever you have items. Game Researcher's suggestion for this gap and for WBL-4: do it the way Pokémon stages a first catch. In the first wild encounter, show the Bond prompt on screen and give enough balls that the catch cannot fail. Not a wall of tutorial text. Ticks the first 10 minutes, fun, and one clear goal.

**WBL-4. The objective tracker. Inside WB-CATCH.** An on-screen objective, and tutorial text that fits its box. The first-catch Bond prompt is that objective for the opening encounter. Ticks the first 10 minutes and one clear goal.

**WBL-6. Battle sprites. Done (#406, `440e4d6`).** Battles show the real creature sprites. Mosshog stays on the older Higgsfield art until Game Art Director swaps it, and that swap does not block finish. The early pace (WBL-5) is still open inside WB-LOOK.

**WBL-5. The early route moves. Inside WB-LOOK.** A faster early encounter rate, and healing, so the first session is not a long walk with nothing to do. Ticks the first 10 minutes and fun.

**WBL-7. North exit. Inside WB-ROAD.** Walking north once sent the player back to the title screen. Ticks no crashes and known bugs.

**WBL-8. The road to Thornwood. Inside WB-ROAD.** It does nothing. Ticks the first 10 minutes, one clear goal, and known bugs.

**WBL-9. Continue. Inside WB-ROAD.** Continue goes through the title screen and returns to the same place. Ticks no crashes and no broken saves.

**WBL-10. A real Continue test. Inside WB-ROAD.** An end-to-end test that starts a journey, quits, continues, and lands in the same place. Headless tests that only load a fixture file do not cover this.

**WBL-11. A migrate that returns null. Done (#415, `5a88c12`).** A migrate that returns null holds the session. The save stays untouched and saving stays off.

**WBL-12. The hub row stays while a save is held. Done (#415, `5a88c12`).** Erase leaves a held save on the hub.

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
- It plays on a phone, held upright, to the 16-item layout. **WB-PHONE** is that build. The rotate gate is removed. Game Art Director art-checks it. A played session still confirms it.
- One clear goal on screen (the objective, and a road that goes somewhere).

**Must-haves:**

1. A menu for party, field book and save, a status bar, and Choose Ripplet actually choosing (WBL-1, WBL-14). Merged in #413 (`bb4031c`). The Larkhaven menu still does not open. That regression stays in **WB-OPEN**.
2. A battle that starts on the action menu (WBL-2). Done (#418, `56204cc`).
3. An obvious Catch button, and a guided first catch that cannot fail, with Bag usable when you have items (WBL-3).
4. An objective tracker whose text fits (WBL-4).
5. An early pace with encounters and healing (WBL-5). The 9 battle sprites (WBL-6) are done (#406, `440e4d6`). Mosshog stays on the older Higgsfield art until Game Art Director swaps it.
6. The north exit stays in the world, the Thornwood road goes somewhere, and Continue returns through the title screen to the same place (WBL-7, WBL-8, WBL-9, WBL-10).
7. Fun at least 7/10, and the upright phone layout (**WB-PHONE**). Both are must-pass. The rotate gate is removed. Game Art Director art-checks the layout.

**Does not block finish:**

- Swapping Mosshog off the older Higgsfield art. Game Art Director does that later.
- WBL-11 and WBL-12. Done (#415, `5a88c12`).
- WBL-13, WBL-15, WBL-16 and WBL-17 (the minors above).
- WBL-18 through WBL-22 (duplicates, floating creatures, true-scale doors, evolution wording, the pond).
- WB-NOSTALGIA, roster growth, WB2.2, and any new area or creature.
- A played session past 30 minutes. Still worth doing. It does not hold the first-session bar.
- WB-FUNNEL1 (#380) is merged. It logs the opening and does not add creatures.

## Timeline

Measured 2026-10-14. Wildbond's feature rate is 31 pulls in 7 days (4.43 a day) and 34 in 14 days (2.43 a day). The maths is in [launch-summary.md](launch-summary.md). #380 and #399 are merged. They were not on this list.

**Bundles left that block finish:** 5. The per-pull rate is applied to bundles, so these dates are estimates. #380, #399, #413, #415 and #418 are merged. WBL-2 is done. WBL-11 and WBL-12 are done and are not on this list.

| ID | What is inside |
|---|---|
| WB-OPEN | Menu and battle start. WBL-2 is done (#418). The Larkhaven menu from #413 still does not open. This is part of #429 |
| WB-PHONE | The upright layout, to the 16-item spec. The rotate gate is removed. Game Art Director art-checks it |
| WB-CATCH | The Catch button, the guided first catch, and the objective tracker. This is part of #429 |
| WB-LOOK | Early pace (WBL-5). The nine battle sprites are done (#406, `440e4d6`) |
| WB-ROAD | North exit, the Thornwood road, and Continue |

**Likely:** 5 / 4.43 days of build, plus 1 confirmation day, plus 0 buffer. **2026-10-17.**
**Slower:** 5 / 2.43 days of build, two playtest rounds, and a 2-day buffer. **2026-10-21.**

## Owner and the first bundle

**Owner:** Wildbond & Starfall Dev Lead.

1. **WB-OPEN**, with **WB-CATCH**. The open Wildbond bundle is #429: the menu in every area, including the Larkhaven menu from #413, plus the Catch and the objective. WBL-2 is done. WBL-6 is done (#406, `440e4d6`).
