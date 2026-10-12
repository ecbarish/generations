# RB1.11: Realmbound active play

Evan's 2026-10-12 direction is early game first and Play, not watch. PR #218 is stacked on the first-session fixes in #214; neither adds raid content.

## What changes

- Focus never enables AI after a pause, including established heroes after their first victory.
- Every field and dungeon opponent waits for Fight or an ability. Basic swings, pets and companions act within the deliberate encounter while the player gives combat input. Ten seconds without combat input pauses both sides and their timers. Continue fight resumes it. This is an inactivity safety pause, not a turn-based combat rewrite.
- Auto is the existing earned convenience, not a new mode: 500 successful manual ability uses (the Rotation Macro's existing milestone) and a hero level strictly above the current region's upper level. It is unavailable in dungeons, raids and current-level regions, and hidden until available. It remains a conscious click, never fallback.
- Loading, losing tab visibility or a long suspended-frame gap returns to Focus. Hidden tabs do not simulate combat. Resuming a tab accounts for its absence once, as rest.
- Away time grants only the existing rested XP reserve: 15% of the current level's requirement per hour, bounded at 150%, with a one-day calculation cap. It grants no kills, earned XP, levels, loot or money. Rested XP pays out through future player victories.
- Existing auto-loot, batch selling, repairs/repair kits, and explicitly assigned guild jobs remain. Old progress is preserved; no new persistent fields, save version or game version.
- In-game opening guidance and the two Realmbound guide pages no longer describe idle hunting or Focus fallback. Late-game raid calls are manual; the guide corrects its old Auto claim.

## Design decisions for review

The existing 500-press milestone is the definition of earned Auto, rather than a new save field or second mastery track. The ten-second window reuses the existing engaged-play interval. A deliberate Fight button helps Warriors build Rage before they can use a paid ability; an unusable ability press also renews control, as before. Mode switches do not start an encounter.

The current implementation still schedules the next opponent, but pauses before exchanging any blows until the player starts that encounter. Auto on a mastered road can repeat easy fights while the tab remains visible. This is the exception explicitly requested by RB1.11; a named companion handling a particular task would be a stronger future expression of delegation. It is not added here.

## Validation and limits

Scenario checks cover ten simulated idle minutes without damage/progress, pause and resume, no stale input at a new opponent, all regions' level/mastery boundaries, dungeon exclusion, old Auto-save recovery, capped/invalid away time, and freezing a living Hunter pet, healer companion, DoT, cast, potion cooldown, resources and reaction timers together.

The separate browser UI regression uses isolated saved contexts at 375x812, 1366x768, 1920x1080 and 3440x1440. It clicks the real Fight and Auto controls, lets real interval ticks run, reloads historical saves and attempts actual browser-tab visibility when supported. This environment reported every automated tab visible (headless and an off-screen headed/minimized attempt), so native hiding was not validated. A separate staged visibility-property/event fixture exercises the real visibility handler and real interval ticks, verifying that earned Auto stops and returns in Focus; it does not claim native device/browser focus evidence. It also reopens a two-hour-old save through the normal boot path, comparing kills/XP/money/levels and checking only rested XP increases. [Screenshots and rerun](../screenshots/realmbound-active-play/README.md).

All 18 arcade suites pass locally; the final targeted Realmbound run passes 8977 checks, including the added Hunter/healer pause fixture. Four-size control/save/away-return regression passes. These are fixtures, not a scored newcomer playtest. Ten simulated minutes do not claim ten minutes of a human having fun. RB1.10 still needs the first-hour playthrough and top five fixes; human newcomer feedback remains the gate for deeper content.
