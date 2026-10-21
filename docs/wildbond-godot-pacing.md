# Wildbond: the last four areas and league pacing

T56 / WB3.6. Codex, 2026-10-09. Inputs: main f48aa1d, Godot 4.7.2-stable (official).
[Machine-readable results](measurements/wildbond-late-pacing.json) include input SHA-256 hashes, seeds, encounters, levels, losses and cooldown snapshots.

## What this found

A short route through the final areas does **not** naturally raise this team to Halen or Rysa's levels. All six continuous no-extra-training cases stop before finishing the journey. Training to every Warden's ace is possible, but demands thousands of wild wins; it is a conservative test policy, **not a requirement imposed by the game**. Three of four trained cases beat the whole league at level 70, with no training to 75. The fourth stalls on a cooldown problem at Halen, rather than losing on damage.

Fix that turn problem before balancing around these results. Then compare several less conservative training policies and actual human play: a victory at level 44 against Olan shows that matching the ace is not itself necessary. This PR changes no game balance or engine files.

## Current opposition

Species and levels are from the actual exported teams. Route trainers also use their current map teams, not historical lore levels. Incoming caps for areas 5-8 are 55, 60, 65, 70; after eight badges, 75. Godot uses those hard caps. The Classic harness used Soft cap and cannot stand in for this test.

| Encounter | Team |
|---|---|
| warden5 | orchardroot 53, ferrycrest 54, siltjaw 55 |
| warden6 | flintroot 58, bellmote 59, hushmane 60 |
| warden7 | tilthtusk 63, hemglow 64, bloomcourser 65 |
| warden8 | keeljaw 68, moorweft 69, soundhowl 70 |
| leagueWren | chartwing 72, inkwhisk 73, $rival 73 |
| league1 | hushmane 70, dripdart 71, bloomcourser 72 |
| league2 | keeljaw 71, flintroot 72, ferrycrest 73 |
| league3 | blazefang 72, ribbonstride 73, tilthtusk 74 |
| league4 | buoyglint 72, moorweft 73, pennantlark 74 |
| leagueChampion | bloomcourser 74, hushmane 75, soundhowl 76 |

The rival placeholder uses Mosshog, as Godot's Ripplet counter does; the rival is not silently evolved into a different creature by this diagnostic. All trainer opponents are Uncommon, exactly as main.gd creates them. Guardians use their explicit legendary rarity and wild XP multiplier.

## Method and boundaries

The PowerShell runner makes a unique disposable project in the OS temporary directory and copies the **unmodified** rules.gd, battle.gd, figures.gd, wildbond.json and evolution.json. It never launches main, touches user://, opens the player's Chrome profile or writes into wildbond-godot/play. It deletes only that checked temporary path. JSON results retain the hashes of those copied inputs.

Browser data and the Godot export agree for encounter maps/story, biomes, caps, journeys, moves, elements and species combat fields. Whole species objects differ in incidental fields, so whole-object equality is not claimed. Godot's evolution.json is then merged exactly as main does; its conditional forms are not assumed to exist in Classic. Thirty-six fixed fixtures compare actual browser stats, XP thresholds and damage with Godot (108 numeric checks). Battle and progression runs add state/termination checks, for **79,732 passing checks total**, with zero diagnostic invariant failures. A recorded gameplay stall is a finding, not a successful fight.

Both profiles start with three synthetic level-44 creatures: an Uncommon Tidewyrm and Common Thornback/Glimmerwing, randomized potential, temperament and traits. **Evolved** starts Devoted and accepts eligible evolutions (Deeptide and Elderthorn beside Glimmerwing); **held** starts Loyal and declines evolution. No guardians, bred perfect creatures, trained stat points or gear are supplied. These fixtures approximate a plausible team, not a measured first-four-area playthrough or a representative sample of all players.

The simulated player is Farmfolk, chooses the strongest ready damaging move, uses Regrowth when an ally is below 45%, Rally below 60%, and Guard for a telegraph when enough orders exist. It waits 0.8 seconds in each choice/move state. Each tick calls the real battle._process(0.1); damage, cooldowns, opposing decisions, fainting, XP scaling, hard caps and bond gain remain real. There are no granted victories or levels.

Between fights the team fully heals, modelling a return to Maren or an available rest. Walking, monetary loss, travel cost, reading, shopping, capture attempts, ranch routines and calendar movement are omitted. Summer's actual weighted wild table and main's team-relative clamped wild levels/rarity are used. Wild cooldown stalls use the real Run action and award no XP; a trainer stall stops that route immediately. Berries are unavailable in this policy. Those omissions make combat logistics optimistic; **battleSeconds is diagnostic simulated time, not human completion hours**.

Each area's short-route benchmark has 15 wild opportunities, two route trainers, Wren and its guardian, then the Warden. This approximates 24 exploration opportunities at the current 62% wild rate. It is a fixed encounter budget, not a claim about pathfinding or a mandatory Warden threshold: Wardens are physically approachable, while other story beats depend on exploration. Failed optional encounters may be left behind after normal recovery; no badge advances without a Warden win.

## Direct route: continuous from the fourth badge

These are genuine continuous fixtures; levels are not reset between areas. Where a trainer blocks before the Warden, the listed levels are the last reached team, not an attempted Warden fight. None reaches Rysa or the league.

| Seed | Profile | Reached stages, team before Warden / terminal result |
|---|---|---|
| 7 | evolved | stillreed: 44/44/44 won; hollowecho: 44/44/44 blocked:route-trainer |
| 42 | evolved | stillreed: 44/44/44 won; hollowecho: 44/44/44 won; sunthread: 44/44/44 lost |
| 2026 | evolved | stillreed: 44/44/44 won; hollowecho: 44/44/44 won; sunthread: 44/44/44 lost |
| 7 | held | stillreed: 44/44/44 won; hollowecho: 44/44/44 lost |
| 42 | held | stillreed: 44/44/44 lost |
| 2026 | held | stillreed: 44/44/44 won; hollowecho: 44/44/44 lost |

Seeds 42 and 2026's evolved teams reach Halen still at 44/44/44 and lose. Seed 7 stalls against Narro earlier. The held teams stop at Olan or Senna. A single starter, three seeds and this skilled command policy cannot establish every possible build's outcome.

The JSON also contains **24 independent entry benchmarks** (four areas, two profiles, three seeds), starting at 44/55/60/65: prior Warden aces. They answer whether an adequately prepared incoming team can handle the next area, not how it became prepared. Those teams likewise gain no complete level within the short route; Halen sees 60/60/60 and Rysa 65/65/65 where reached. Do not join those independent rows into a fictional no-training journey.

## Train-to-ace comparison

This policy adds real wild fights until the slowest team member reaches the Warden's ace, with a limit of 4,000 attempts per training segment. Nothing replays a defeated trainer for XP. Counts below are **additional wild wins**, excluding each short route's 15 opportunities and guardian fight. A low-health member gains the actual reduced fainted XP, which matters for the weaker Glimmerwing.

| Seed | Profile | Additional wild wins by area | Ending |
|---|---|---|---|
| 7 | evolved | stillreed 3755; hollowecho 1906; sunthread 2186 | blocked:sunthread |
| 42 | evolved | stillreed 3755; hollowecho 1903; sunthread 2189; farwatch 2462 | Champion |
| 2026 | evolved | stillreed 3748; hollowecho 1902; sunthread 2188; farwatch 2459 | Champion |
| 42 | held | stillreed 3756; hollowecho 1904; sunthread 2187; farwatch 2460 | Champion |

Successful cases arrive at Halen at 65/65/65 and Rysa at 70/70/70. All six league battles then succeed at 70/70/70: Wren, the four courts and Avenne. The real full heal between rooms is preserved, as is the court reset on a loss (Wren stays beaten). The results do **not** justify making every player train to 75 before entering.

The scale deserves human review: Classic's 0.13 XP multiplier and its level-powered XP curve were designed around a different battle/control rhythm. Matching all aces costs about 10,300 additional wins across the four areas under this cautious policy. It is evidence against compulsory level chasing, not a proposal to increase every opponent or declare that the whole game takes a specified number of hours.


**Pacing changed 2026-10-09 (Claude, WB3.6b):** XP for a win is now `rules.gd` `win_xp`: a share of the XP needed at the fight's level (foe level capped at yours + 3), so a level costs about 12 even-level wild wins (trainers 1.6 times as much XP) at every stage. Rerun this diagnostic with the new hashes to see the late route's levels.
## Reproducible cooldown finding for Claude

**Fixed 2026-10-09 (Claude, PR #91):** when an ally's turn comes with every move resting, it no longer opens the menu. It says it "catches its breath", holds its turn while battle time runs (so cooldowns tick), and the menu opens as soon as one move is ready. A permanent Godot check covers it ("every move resting"). Rerun the diagnostic with the new battle.gd hash before balancing.

The results record 18 cooldown stalls, all on Deeptide. Its last four moves are Bubble Jet, Mist Veil, Tide Pulse and Harden. In one Halen case at level 65 their cooldowns are 0.5, 8.25, 3 and 10.75 seconds respectively. Every move is unavailable when the player's turn pauses time. Ten additional seconds of actual battle._process leave cooldowns unchanged.

In battle.gd, cooldowns advance only in _tick; choose/moves do not call it. Fight rejects every cooling move, Guard/Orders consume orders without consuming the creature's turn, and a trainer blocks Run. A stocked Bag may consume the turn and escape the state, so this is **not proof of an unconditional lock for every inventory**. It is a reproducible no-berry route failure; ordinary waiting does not solve it. The existing early-battle checks do not cover this late evolved move set.

Claude owns the fix. Suggested smallest acceptance case: a late evolved creature with no ready move and an empty Bag must have a clear, legal way to advance the turn, keeping cooldown/time rules consistent. Decide the intended Wait/basic-action/Guard behaviour before patching it. Then rerun this diagnostic with the new source hashes and add a permanent Godot regression. No such action is fabricated here.

## Reproduce and next test

With existing Godot 4 standard and Node installed, run from the repo root:

```powershell
./tools/wildbond-late-pacing.ps1 -Godot 'C:/path/to/Godot_console.exe' -Node 'C:/path/to/node.exe'
```

No package installation, browser profile or server is needed for this headless diagnostic. -Output selects another result file. Separately serve the repo with serve.ps1 and run all eight browser check pages; those remain all-pass. This PR contains tests/tools/reporting only, not a new in-game automation mode.

After the cooldown fix: compare training only after a loss, a mixed replacement team, each starter/heritage and seasonal tables; play the route manually. Consider rewarding distinct story/trainer achievements sufficiently before relying on thousands of repeated wild encounters. That is a follow-up design/tuning decision for Claude, not a balance change hidden in this report.
