# Realmbound inn furnishing: RB1.7

Before/after captures at 375x812, 1366x768, 1920x1080 and 3440x1440. Fresh browser contexts, service workers blocked, reduced motion enabled; no player saves were read. Same hero, room and camera position for each pair (existing time-of-day lighting may vary slightly).

The existing room had eight repeated bed tiles and two long tables. It now has two beds paired with linen cupboards, two dining tables with chairs and two chairs beside the existing hearth. The red runner from the doorway to the Keeper remains clear. The same furnishings serve the Abbey, inns and longhouses; local names, Keeper identities and palettes remain unchanged.

All furniture is solid at its own tile. No transactions, dialogue, save fields, map size, room entrance, room exit or shared rendering code changed. New drawing uses rectangles in the existing palette; no outside assets.

Verification:

- All 16 suites passed with tools/run-all-checks.cjs. Realmbound: 8673 checks, including 144 new checks in realmbound-inn-layout.js.
- Both factions, all eight hubs: clear entry and connected floor, accessible sides for furniture, actual walker route to the Keeper opens the existing rest dialogue, keyboard movement and route to the exit return to the correct building step.
- Actual canvas click on the Keeper, existing "Rest with your companions" choice restores a hurt hero, then ArrowDown exits the room at each of the four sizes. No horizontal page overflow or JavaScript errors.
- Visually inspected phone, desktop and ultrawide captures. The narrow phone camera keeps the Keeper and runner visible; side furnishings come into view as the player walks toward them.

An idea: a separate pass could vary the furnishings by hub (Abbey cells, desert woven mats, winter furs). Keep it cosmetic and preserve this tested arrival route.