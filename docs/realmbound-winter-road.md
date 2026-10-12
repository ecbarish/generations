# The Winter Road — Realmbound levels 30–40

## Approval and scope

Evan authorized proceeding with Codex's Frostmere recommendation on 2026-10-06 while Claude was unavailable. This is the concrete specification and implementation record for T3, with the small progression decisions it needs from T1. It does not complete T1's full 30–60, raid or guild design. Branch: `codex/realmbound-winter-road`, originally based on T12 lore at `ab972312df00603789071d6efcb560e550788376`. PR #6 is now merged; main `e4c10f6f53999d38bec770991f8543316ad96efd` has been integrated locally. Open this chapter PR against main.

Frostmere's first chapter uses the existing travel, kill/collect quests, equipment generation, combat, companion and Hunter systems. No new save fields, migrations, abilities, dungeon, profession or renderer. The wider design still reserves levels 41–45 and the necropolis for later work.

## Player experience

A supply road from Ashen Ridge crosses the tundra to Lanternrest Lodge (Concord) and Whitebough Hearth (Wildclans). Both camps need the road, and sharing recovered provisions gives the faction dispute a practical resolution. Ice trolls have repurposed old stones as stolen waymarkers. Restoring those markers leads scouts to a buried city; Hushfang guards its approach, leaving the actual necropolis for another chapter.

Travel uses the existing zone rule: minimum zone level minus two, so Frostmere opens at 28. No Coalmaw or Foundry completion requirement is added. A previously capped level-30 hero can travel there and immediately resume earning XP. The cap becomes 40; XP, rested XP, offline progression, enemy statistics and equipment formulas remain unchanged. Low-level routes and dungeon gates are unchanged. Companions at level 30 or higher visit Frostmere; levels 20–29 retain Ashen Ridge.

## Content contract

| Enemy | Levels | Role | Quest collection |
|---|---|---|---|
| Rimecoat Wolf | 30–32 | Tameable wolf; approach patrol | Rimecoat Pelt |
| Snowroot Boar | 32–34 | Tameable boar; sled materials | Snowroot Tusk |
| Ice Troll Forager | 33–35 | Humanoid; stolen supplies | Winter Provision Sack |
| Ice Troll Waykeeper | 35–37 | Humanoid; hidden crossing | Carved Road Stone |
| Driftstalker Cat | 37–39 | Tameable cat; northern scouting | Driftstalker Pelt |
| Hushfang, the White Vigil | 40 | Legendary tameable elite wolf; finale | None |

All use existing visual families and difficulty formulas. The elite retains the existing 3.2× health / 1.5× damage multipliers and legendary taming rules. Bring companions or prepare carefully; no solo guarantee is added.

| ID | Quest | Level | Objective | Prerequisite |
|---|---|---|---|---|
| fm1 | Tracks to the Hearth | 30 | Kill 12 wolves | None |
| fm2 | Cloaks for the Last Watch | 31 | Collect 8 pelts | fm1 |
| fm3 | Runners That Hold | 32 | Collect 8 tusks | None |
| fm4 | The Empty Supply Sleds | 33 | Kill 12 foragers | fm2 |
| fm5 | Enough for Both Fires | 34 | Collect 10 provision sacks | fm4 |
| fm6 | The Missing Waymarkers | 35 | Collect 8 stones | fm5 |
| fm7 | Open the Pale Crossing | 36 | Kill 14 waykeepers | fm6 |
| fm8 | A Shelter Beyond the Drifts | 37 | Collect 10 pelts | fm7 |
| fm9 | Stones Beneath the Snow | 38 | Kill 14 cats | fm8 |
| fm10 | The White Vigil | 40 | Kill or tame Hushfang once | fm9 |

Quest availability stays at quest level minus two. Offers and turn-ins have faction-specific speakers. Rimewolf/boar quests form the opening; the supply chain then carries the chapter to the finale. The existing three-slot quest log and helper are sufficient. Players still hunt between level-gated quests; these ten quests do not promise ten instant levels.

Rewards keep the current formulas: ordinary quests offer generated uncommon equipment at quest level +1; the elite offers rare equipment at level +2. Enemy drops retain their existing budgets. Item names reuse the current material tiers; this chapter introduces no item tier or special set. Foundry remains a route to equipment and Heroic progression, though higher-level rewards naturally replace older items over time.

## Upgrade path

Evan reiterated that the games should start with their core mechanics and become more capable over time. Keep durable game data, player progress and game rules independent of presentation choices. Realmbound's ordered classic scripts already separate world, equipment, quests, state, combat and rendering; new chapter data belongs in that structure.

1. Establish playable chapters and preserve saves: this chapter, then a reviewed 40–60 plan.
2. Expand choices through separately specified professions, talent branches and companion stories. Each needs a progression purpose and tests before implementation.
3. Build encounters and group play: necropolis, later raids and guild features after their rules are specified.
4. Upgrade exploration and presentation when they serve those systems: richer zone scenes, movement and art can consume the same world identities. Keep the static-server deployment until a concrete feature justifies changing it.

These are development stages, not approved extra tickets. Do not create empty interfaces, dependencies or new save fields solely for hypothetical future systems. For any future upgrade record what stays compatible, what players gain, and how the previous version's save enters the new version.

## Validation and next review

Use `python -m http.server 8765` or the repository's `serve.ps1`, then open `/tests/run.html`. The scenarios cover existing dungeon/migration behavior plus both faction quest chains, generated rewards, correct voices and Hushfang taming. Browser interaction checks also exercise travel at levels 27/28, an existing level-30 save, combat/loot, tabs, companions and save/reload.

Before expanding beyond this chapter, Claude/owner should review quest pacing over a sustained play session and the existing item-name tier ceiling. Preserve this chapter's IDs if adjusting numbers after review. T1's remaining decisions include the wider 40–60 curve, the necropolis, raids and guilds; nothing here claims they are finished.

### Recorded checks — 2026-10-06

- Browser runner: 231/231 checks pass; Node DOM regression suite: 236 checks pass. The existing 118 checks retain their coverage, with cap expectations updated; additional checks cover new content and both faction chains.
- Both factions: level 27 travel refused, level 28 travel accepted; correct hub/lore, opening battle, elite battle, loot, turn-in, every tab and a tamed cat survive save/reload. Four existing companions and generated level-appropriate uncommon equipment were used in battle checks.
- A save created by the main-version scripts at the old cap of 30 loaded with quest and Foundry progress intact and advanced to 31. The state/migration file is byte-for-byte unchanged. All preexisting world data is unchanged after removing the appended Frostmere definitions and route entries.
- All five classes won opening fights with four companions. Solo spot checks varied with generated equipment and beast rarity: one mage attempt died, while a subsequent run succeeded for all five classes. This is a reason to review solo pacing; it is not evidence of a universally safe solo route. No combat formulas were changed.
- No page or console errors in the full interaction run. Long-session grind pacing and all possible solo builds remain for owner/Claude review.

## Desktop pickup and publication

For a quick local playtest, extract `idle-arcade-winter-road.zip`, open a terminal in its `idle-arcade` folder,
run `python -m http.server 8765` (or `powershell -ExecutionPolicy Bypass -File serve.ps1`), and open
http://localhost:8765/games/realmbound/ and http://localhost:8765/tests/run.html. This is the feature branch,
including merged T12 lore and the locally implemented Winter Road, rather than just the deployed main. Localhost and GitHub Pages have separate
browser saves; moving the source does not automatically transfer a browser save between those origins.

To keep the authored commits when publishing from an authenticated desktop, download the Git bundle and
run these commands from its folder (use a new destination folder):

```sh
git clone --branch codex/realmbound-winter-road idle-arcade-winter-road.bundle idle-arcade
cd idle-arcade
git remote set-url origin https://github.com/ecbarish/generations.git
git config user.email "206636510+ecbarish@users.noreply.github.com"
git fetch origin
git push -u origin codex/realmbound-winter-road
```

Open a PR on GitHub against main (PR #6 is merged); inspect the diff
and inspect the diff for only this chapter and the shared notes. Do not merge automatically. The separate
`winter-road.patch` contains the two commits after PR #6 and is an alternative for an existing checkout;
do not apply it on top of the bundled branch.

### Prepared PR description

**Title:** Add Frostmere's Winter Road chapter through level 40

Existing level-30 heroes can resume in Frostmere, secure the winter supply road, help both faction camps,
and discover the necropolis approach. Adds ten voiced quests and six enemies, including three ordinary
Hunter species and Hushfang, a legendary wolf elite. The cap becomes 40; existing combat, loot, travel gates
and save/migration formulas remain unchanged. Level-30+ companions visit Frostmere and the empty quest
list suggests the next accessible area.

New files: `docs/DEVELOPMENT.md` (shared review and handoff, carried from the notes branch),
`docs/realmbound-winter-road.md` (scope, content, upgrade path and publication), and
`tests/realmbound-winter-road.cjs` (browser interactions). Updated world data, core cap, NPC routing, quest
hint, hub copy, scenario runner, handoff, roadmap, design and lore record. No scripts were reordered.

Validation: 231 browser scenarios, 236 Node DOM checks, both faction travel gates, actual generated-gear
combat/elite loot/turn-in, every tab, taming and save/reload; zero console errors. A save made by main's
old-cap scripts resumed at level 31. Existing world data and state/migration source were compared with the
base. All five classes passed opening group combat; solo spot checks varied. Sustained grind and solo
balance need owner/Claude review.

Includes merged PR #6 and the previously unpublished shared notes. Evan authorized this narrow T1
progression spec while Claude was unavailable; T3 is complete here, and the wider T1 remains open.
Wildbond and parked games are unchanged. Please review without automatic merging.

## Main integration update — 2026-10-06

Integrated main `e4c10f6` after T12 merged. Claude moved zone lore into `#zoneLore`; the two browser scenario selectors now follow that element. No gameplay changes were made in this integration. The earlier 231 browser/236 DOM passes above predate this integration. A fresh run was attempted, but the temporary Chromium and jsdom installations were no longer present; rerun `tests/run.html` on the desktop before approving the chapter. JavaScript syntax checks passed.

## G2 Frostmere lighting pass (2026-10-07)

Realmbound v1.0.1 treats the winter road as clear cold air above low snow haze. Blue mountain and pine layers separate from the snowy foreground; cool sky and snow bounce light tint the shadows. The road and outdoor hub use the same Frostmere profile, with less grading and softer shafts so warm night fires and windows remain visible. Weather still thickens the haze, dawn still brings mist, and the existing shared clock directs every shadow. Interiors, other zones, dungeons, encounters and saves retain their existing behavior.

Before/after captures in `docs/screenshots/frostmere-{before,after}-noon.png` and `frostmere-{before,after}-town-night.png` use a level-35 Concord traveler at 1366x768, fixed noon/night and weather, with reduced motion. These are review evidence, not game assets. The G2 project remains open for other zones.
