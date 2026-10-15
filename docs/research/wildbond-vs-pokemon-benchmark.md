# Wildbond vs Pokémon: full-scope benchmark

Evan wants Wildbond to be "like Pokémon but better", and he is rightly frustrated that big gaps, such as the world being a single line of eight areas, were only spotted late. This document measures the whole game against the mainline Pokémon games, mainly Generations 1 to 4, with later quality-of-life changes noted where they matter. It then looks at the fan games and ROM hacks that fans say improved on the originals, because those show what "better" concretely means. Every Wildbond number below was read from `main` at commit `5764d95a`. Every Pokémon number links to Bulbapedia or Serebii. Nothing has been estimated. Where a figure could not be checked, the document says so.

The fan games are design references only. Nothing from their code, sprites, maps, music or text should enter this repo, and the same applies to Nintendo, Game Freak and The Pokémon Company material.

## 1. How Wildbond was measured

The numbers come from `wildbond-godot/data/wildbond.json` (the main game data), `wildbond-godot/data/evolution.json` (the newer evolution rules), and the scripts in `wildbond-godot/scripts/` (about 9,990 lines of GDScript in total). The asset folders were counted directly.

| What | Wildbond today | Where |
| --- | --- | --- |
| Creature species | 119 species in 10 families (`fam`) | `data/wildbond.json` → `SPECIES` |
| Moves | 60, of which 11 cause a status | `data/wildbond.json` → `MOVES` |
| Elements (types) | 7: Ember, Tide, Grove, Stone, Gale, Shade, Radiant | `data/wildbond.json` → `ELEMENTS` |
| Status effects | 5 kinds named on moves: marked, sleep, soaked, scorched, rooted | `MOVES[*].status` |
| Weather | 3 named kinds (rain, mist, falling ash), set per area, which change which creatures appear | `WEATHER`, `WEATHER_NAME` |
| Badges and Wardens (gym leaders) | 8 badges, one Warden per badge area | `BADGES`, `MAPS[*].warden` |
| Maps | 15 in total: Larkhaven, 8 badge areas, 4 side maps (Thornwood Trail, Old Root Grove, Saltmarsh Road, Moon Pool), the League and the Spire | `MAPS` |
| Towns with buildings | Larkhaven only (3 doors) | `MAPS.larkhaven.doors` |
| Caves, water routes | None | `MAPS` (no cave or water map exists) |
| Named characters | 43 in the cast, 32 NPC placements across all maps | `CAST`, `MAPS[*].npcs` |
| Story beats | 30 scripted events, one rival (Wren) | `STORY`, `RIVAL` |
| Party size | 3; extra creatures go to the ranch | `scripts/main.gd` line 3026 (`team.size() < 3`) |
| Storage | The ranch and barn, with breeding (80 coins per egg) | `scripts/rules.gd` line 83, `BARN`, `BREED_COST` |
| Evolution | 92 evolution rules; 87 also need a bond (trust) level, and a few need a time of day, a place, weather or a food | `data/evolution.json` → `evos` |
| Level cap | 9-step cap table by badges: 15, 25, 35, 45, 55, 60, 65, 70, 75 | `CAP_TABLE`, `scripts/battle.gd` line 89 |
| Challenge modes | Nuzlocke, randomizer, solo, hardcore | `MODES` |
| Battle menu | Fight, Guard, Orders, Catch, Bag, Run | `scripts/battle.gd` line 34 |
| Items | Lures (for catching) and berries (for healing), plus coins | `scripts/battle.gd` line 90, `scripts/shop.gd` |
| Day and night | A calendar with seasons, festivals and dawn, day, dusk and night quarters | `scripts/calendar.gd` |
| Music and sound | 11 music tracks, 23 sound effects (CC0 Ninja Adventure pack) | `assets/music`, `assets/sfx` |
| Saving | Manual save from the pause menu, with a crash-safe spare and backup | `scripts/pause_menu.gd`, `scripts/safe_save.gd` |
| Field book (Pokédex equivalent) | Yes, in the pause menu | `scripts/pause_menu.gd` line 10 |
| Not found in code | Trading, abilities, held items, double battles, TMs, field moves (Cut, Surf and so on), running shoes, fast travel, shinies | searched `scripts/` for each term |

## 2. Pokémon reference figures (Generations 1 to 4)

| Measure | Gen 1 (Red/Blue) | Gen 2 (Gold/Silver/Crystal) | Gen 3 (Ruby/Sapphire/Emerald) | Gen 4 (Diamond/Pearl/Platinum, HGSS) | Source |
| --- | --- | --- | --- | --- | --- |
| Species available | 151 | 251 | 386 | 493 | [Gen I](https://bulbapedia.bulbagarden.net/wiki/Generation_I), [Gen II](https://bulbapedia.bulbagarden.net/wiki/Generation_II), [Gen III](https://bulbapedia.bulbagarden.net/wiki/Generation_III), [Gen IV](https://bulbapedia.bulbagarden.net/wiki/Generation_IV) |
| Types | 15 | 17 (Dark and Steel added) | 17 | 17 | [Type](https://bulbapedia.bulbagarden.net/wiki/Type) |
| Abilities | None | None | Introduced | Expanded | [Ability](https://bulbapedia.bulbagarden.net/wiki/Ability) |
| Held items | None | Introduced | Yes | Yes | [Held item](https://bulbapedia.bulbagarden.net/wiki/Held_item) |
| Double battles | No | No | Introduced | Yes | [Double Battle](https://bulbapedia.bulbagarden.net/wiki/Double_Battle) |
| Weather | No | Rain, sun and sandstorm via moves | Weather also set by the overworld and by abilities | Yes, plus fog | [Weather](https://bulbapedia.bulbagarden.net/wiki/Weather) |
| Breeding | No | Introduced | Yes | Yes | [Breeding](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_breeding) |
| Day and night | No | Introduced (real-time clock) | Clock used for some events | Yes | [Time](https://bulbapedia.bulbagarden.net/wiki/Time) |
| Running shoes | No | No | Introduced | Yes | [Running Shoes](https://bulbapedia.bulbagarden.net/wiki/Running_Shoes) |
| Badges | 8 | 16 (Johto and Kanto) | 8 | 8 (16 in HGSS) | [Badge](https://bulbapedia.bulbagarden.net/wiki/Badge) |
| Physical and special split | No | No | No | Introduced per move | [Gen IV](https://bulbapedia.bulbagarden.net/wiki/Generation_IV) |

Region size: Kanto has Routes 1 to 25 and about ten towns and cities, plus caves such as Mt. Moon, Rock Tunnel, Victory Road and Cerulean Cave, and sea routes to Cinnabar ([Kanto](https://bulbapedia.bulbagarden.net/wiki/Kanto)). Johto adds Routes 26 to 46, and Gold, Silver, Crystal and HGSS let you return to Kanto after the League ([Johto](https://bulbapedia.bulbagarden.net/wiki/Johto)). Hoenn is known for its many sea routes ([Hoenn](https://bulbapedia.bulbagarden.net/wiki/Hoenn)), and Sinnoh is built around Mt. Coronet, which splits the region in two ([Sinnoh](https://bulbapedia.bulbagarden.net/wiki/Sinnoh)).

Other systems: the party is six Pokémon, and the PC storage system holds many more in boxes ([Storage System](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Storage_System)). Hidden Machines (HMs) teach field moves such as Cut, Surf, Strength and Fly that open new paths ([HM](https://bulbapedia.bulbagarden.net/wiki/Hidden_Machine)). Fly is the fast travel ([Fly](https://bulbapedia.bulbagarden.net/wiki/Fly_%28move%29)). TMs teach moves, and became reusable from Generation 5 ([TM](https://bulbapedia.bulbagarden.net/wiki/Technical_Machine)). There are five main lasting status conditions: burn, freeze, paralysis, poison and sleep, plus temporary ones like confusion ([Status condition](https://bulbapedia.bulbagarden.net/wiki/Status_condition)). Evolution can be triggered by level, stone, trade, friendship, time of day, location, held item and more ([Methods of evolution](https://bulbapedia.bulbagarden.net/wiki/Methods_of_evolution)). Trading between players is core to completing the Pokédex ([Trade](https://bulbapedia.bulbagarden.net/wiki/Trade), [Pokédex](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex)). The post-game in Emerald, Platinum and HGSS includes the Battle Frontier ([Battle Frontier](https://bulbapedia.bulbagarden.net/wiki/Battle_Frontier)). Later games gave the Exp. Share to the whole party ([Exp. Share](https://bulbapedia.bulbagarden.net/wiki/Experience_Share)). Serebii's Platinum section ([serebii.net/platinum](https://www.serebii.net/platinum/)) covers that game's routes, trainers and post-game in detail.

## 3. What fans praise and criticise in mainline Pokémon

Praised:
- Platinum is praised for fixing Diamond and Pearl's pacing and Pokémon spread, adding the Battle Frontier and a fuller story, and for making HM unlocks worth going back for ([r/pokemon: What really makes these games special](https://www.reddit.com/r/pokemon/comments/1wg33ga/what_really_makes_these_games_special/), [r/pokemon: Platinum vs HGSS](https://www.reddit.com/r/pokemon/comments/1si7vpm/platinum_vs_heartgoldsoulsilver_which_game_is/)).
- HeartGold and SoulSilver are praised for two whole regions, 16 badges, the Pokémon that follows you, Gym Leader rematches by phone, the Safari Zone, the Pokéathlon, the Battle Frontier and the fight with Red ([r/pokemon: Why do you enjoy HGSS](https://www.reddit.com/r/pokemon/comments/1igo7hf/why_do_you_enjoy_heartgold_soulsilver_so_much/), [r/pokemon: Why do people like HGSS](https://www.reddit.com/r/pokemon/comments/1bgdci9/why_do_people_like_heartgold_soulsilver_so_much/)).

Criticised:
- HGSS has a poor level curve and a thin Pokémon spread (same threads above).
- Sun and Moon are criticised for long tutorials, constant cutscenes and hand-holding that cannot be turned off ([r/pokemon: Sun and Moon's beginning drags](https://www.reddit.com/r/pokemon/comments/5po69o/is_it_just_me_or_does_sun_and_moons_beginning/), [r/pokemon: Why do people dislike SM/USUM](https://www.reddit.com/r/pokemon/comments/uplv87/why_do_people_dislike_pok%C3%A9mon_sunmoon_usum/)).
- Scarlet and Violet were praised for their open world but heavily criticised for performance and empty, bland spaces ([IGN review](https://sea.ign.com/pokemon-scarlet/192606/review/pokemon-scarlet-and-violet-review-in-progress), [Eurogamer review](https://www.eurogamer.net/pokemon-scarlet-and-violet-review-the-ambition-is-betrayed-by-the-performance), [Ars Technica](https://arstechnica.com/gaming/2022/11/pokemon-scarlet-and-violet-deliver-a-fully-open-world-beset-by-technical-problems/)).

The lesson for Wildbond is that "better" means more freedom and more to find, without hand-holding, and with a smooth frame rate.

## 4. Fan games and ROM hacks that improved on the originals

These are the community's current favourites. A 2023 r/PokemonROMhacks favourites thread names Radical Red, Unbound and Emerald Rogue as the top three ([r/PokemonROMhacks: What's your favorite rom hack?](https://www.reddit.com/r/PokemonROMhacks/comments/12xnlze/whats_your_favorite_rom_hack/)). Renegade Platinum, Clover and Rocket-themed FireRed hacks are named in the same thread.

| Game | What it improved | Why fans love it | What fans criticise | Sources |
| --- | --- | --- | --- | --- |
| Radical Red (FireRed hack) | Pokémon up to Gen 8, the physical and special split, much harder AI and boss teams with no items in boss fights, HMs used without taking a move slot, natures changeable at Pokémon Centres, and a mode that removes EV and IV grinding | It feels like FireRed rebuilt for today; one reviewer calls it "the best rom hack I've ever played" | Grinding for items and tutors, slow eggs and friendship, and an AI that rarely switches | [r/PokemonROMhacks review](https://www.reddit.com/r/PokemonROMhacks/comments/uc38h4/radical_red_review_and_comparisons_to_other_rom/), [Hard Drive](https://hard-drive.net/best-pokemon-fan-games-2d-sprite-based/) |
| Unbound (FireRed hack) | A new region (Borrius) with a new story, a quest log of side missions, special battle rules in every gym, four difficulty modes, and a post-game | It "set a new precedent" and gave the scene its battle engine and quest log | Few criticisms surfaced in the sources checked | [r/PokemonROMhacks favourites](https://www.reddit.com/r/PokemonROMhacks/comments/12xnlze/whats_your_favorite_rom_hack/), [Hard Drive](https://hard-drive.net/best-pokemon-fan-games-2d-sprite-based/), [Pocket Deal Radar](https://pocketdealradar.com/en/rom-hacks/compare/emerald-rogue-vs-unbound) |
| Emerald Rogue (Emerald hack) | Turns Pokémon into a roguelite: randomised routes, Pokémon, trainers and items per run, single and double battles, and many run settings | "Like replaying Emerald, except now it's fun"; almost unlimited replay | No bag sorting, hidden route encounter lists, tedious nature changes, and the same Pokémon repeating too often | [r/PokemonROMhacks spotlight](https://www.reddit.com/r/PokemonROMhacks/comments/193ars1/rom_hack_spotlight_pok%C3%A9mon_emerald_rogue/), [Hard Drive](https://hard-drive.net/best-pokemon-fan-games-2d-sprite-based/) |
| Run & Bun (Emerald hack) | Very hard Nuzlocke-focused Emerald with fixed level caps at every story fight, from 12 up to 99 for the Champion, and Mega Evolution from early on | Hard but generally fair, with planning tools | Repetitive, tedious trainer routes | [GBACodes FAQ](https://gbacodes.com/pokemon-run-bun-faq/) |
| Crystal Clear (Crystal hack) | Open world: start in Johto or Kanto, take all 16 gyms in any order, gym teams scale with your badge count (about level 7 to 75), no HMs needed to reach gyms, running shoes, and rematchable gyms | The freedom of an open world in a classic game | Level scaling gets steep around gyms 6 and 7, so some grinding is needed | [r/PokemonROMhacks review](https://www.reddit.com/r/PokemonROMhacks/comments/o3nenb/i_made_a_review_of_pokemon_crystal_clear/), [r/Games thread](https://www.reddit.com/r/Games/comments/9cb9m6/pokemon_crystal_clear_an_open_world_rom_hack/), [feature list](https://seatgem.com/2018/10/feature-details-of-pokemon-crystal-clear.html) |
| Infinite Fusion (fan game) | Fuse any two Pokémon, giving a huge number of combinations, many with custom art from the community; an expanded Kanto with new areas and town, and all of Johto as the post-game | "The most fun I've had with Pokémon in years"; endless variety | Joke NPCs, frustrating quests, occasional bugs and a brutal difficulty curve | [TheGamer](https://www.thegamer.com/pokemon-infinite-fusion-fangame-most-fun/), [r/pokemon thread](https://www.reddit.com/r/pokemon/comments/1653cj7/is_there_any_highly_rated_faninspired_pok%C3%A9mon/) |
| Reborn (fan game) | 18 gym leaders, field effects that change battles by location, a dark story, and over 100 hours of content | Deep story and some of the hardest fair battles | Often called too dark or edgy | [PokeCoders](https://www.pokemoncoders.com/best-fan-made-pokemon-games/), [r/pokemon thread](https://www.reddit.com/r/pokemon/comments/1653cj7/is_there_any_highly_rated_faninspired_pok%C3%A9mon/) |
| Insurgence (fan game) | Delta Pokémon (new types and colours), new Mega Evolutions, items that replace HMs, difficulty settings, built-in Nuzlocke and randomiser modes, a lighter or darker story option, and character customisation | "The amount of features is unmatched" | Clichéd story and weak characters | [Reborn Evolved forum](https://www.rebornevo.com/forums/topic/22444-would-i-enjoy-pokemon-insurgence/), [Game Gavel](https://gamegavel.com/best-pokemon-fan-games/) |
| Uranium (fan game) | A new region (Tandor) with original creatures, including a new Nuclear type | A polished classic-style adventure | No specific criticism was found in the sources checked | [PokeCoders](https://www.pokemoncoders.com/best-fan-made-pokemon-games/), [r/pokemon thread](https://www.reddit.com/r/pokemon/comments/1653cj7/is_there_any_highly_rated_faninspired_pok%C3%A9mon/) |

## 5. Gap table

| Area | Pokémon (Gen 1 to 4) | Wildbond now | Gap | Suggested fix |
| --- | --- | --- | --- | --- |
| World size | Kanto has 25 routes, about 10 towns and several caves; HGSS has two regions | 15 maps in a line, one town (`MAPS`) | High | Build out the plan in PR #452: about 20 routes, 10 towns, 7 caves and 3 water routes |
| Towns | Every town has a Pokémon Centre, shop and houses with people | Only Larkhaven has buildings (`MAPS.larkhaven.doors` = 3) | High | Give every badge area a town with a healer, shop, Warden hall and 2 to 3 houses |
| Caves and water | Caves and sea routes are part of the main path | None (`MAPS`) | High | Add a cave between badge areas 2 and 3 and a water route mid-game |
| Field moves and gating | HMs open earlier areas on return | None found in `scripts/` | High | Field abilities from PR #452, used without a move slot, as in Radical Red and Insurgence |
| Fast travel | Fly | None found | High | Glide from PR #452, unlocked by mid-game |
| Party size | 6 | 3 (`main.gd` line 3026) | High | Raise to 6, or explain and justify 3 as a design choice with Evan |
| Battle depth | Abilities, held items, double battles, 17 types | 7 elements, no abilities, no held items, no double battles (`ELEMENTS`, `scripts/battle.gd`) | High | Add one ability per family, held items and Warden double battles |
| Items | Potions, status cures, Poké Ball tiers, TMs, key items | Lures and berries only (`battle.gd` line 90, `shop.gd`) | High | Add ball-style lure tiers, status cures, repels and TM-style lessons |
| Creature count | 151 to 493 | 119 in 10 families (`SPECIES`) | Med | Grow families first, since 10 families feels thin even with 119 forms |
| Moves | Hundreds | 60 (`MOVES`) | Med | Grow to roughly 120, with a move per element per role |
| Status effects | 5 main plus temporary ones | 5 on 11 moves (`MOVES[*].status`) | Low | Fine in kind; make sure each element has one |
| Weather | Battle weather from moves and abilities | Overworld weather that changes spawns (`WEATHER`) | Med | Also let weather change battles, like Reborn's field effects |
| Evolution | Many methods | 92 rules with bond, time, place, weather and food (`evolution.json`) | Low | Already a strength; surface the hints in the field book |
| Breeding | Yes | Yes, at the ranch (`rules.gd` line 83) | Low | Keep |
| Trading | Core | None | Med | An in-game trade NPC in each town, since online trade is out of scope |
| Day and night | Gen 2 onward | Yes, with seasons and festivals (`calendar.gd`) | Low | A strength; tie more encounters to it |
| Trainers | Many per route | 8 Wardens, a rival and 32 NPC placements (`MAPS`) | High | 4 to 8 trainers per route, with rematches |
| Level curve | Set by trainers; HGSS criticised | 9-step badge cap table (`CAP_TABLE`) | Low | Keep caps, as Run & Bun does, and add a party-wide Exp. Share |
| Post-game | Kanto in HGSS, Battle Frontier | Warden rematches after Champion (`main.gd` line 143), the Spire | Med | A second area to explore plus a battle facility |
| Side quests | Many small ones | Festivals and seasonal events, no quest log | Med | Add a quest log like Unbound's, one quest per town |
| Legendaries | Placed in hidden spots | Area guardians such as Elderhorn (`STORY`) | Low | Hide some behind field abilities |
| Story and NPCs | Villain team, rival, gym leaders | 30 story beats, 43 cast, one rival (`STORY`, `CAST`) | Med | Spread NPCs into new towns and add a villain arc that crosses the map |
| Music and sound | A theme per town and route, battle themes | 11 tracks, 23 effects (`assets/`) | Med | A theme per town and a distinct Warden battle theme |
| Encounter feel | Grass rustle, battle transition | Encounter and battle effects exist (`battle_effects.gd`) | Low | Playtest for feel |
| Running | Running Shoes from Gen 3 | None found | Med | Hold-to-run from the start |
| Pokédex | Yes | Field book (`pause_menu.gd`) | Low | Show where each creature lives |
| Saving | Manual | Manual, crash-safe (`safe_save.gd`) | Low | Add an autosave on map change |
| Challenge modes | Not official | Nuzlocke, randomiser, solo, hardcore (`MODES`) | Better than Pokémon | Keep; this matches what ROM hack fans want |

## 6. Top 10 gaps, ranked by how much they make it feel like a real Pokémon world

1. The world is a single line of 15 maps, with no loops.
2. There is only one town with buildings.
3. There are no caves or water routes.
4. There are no field abilities that make returning to old areas worthwhile.
5. Routes have very few trainers to battle.
6. The party holds 3 creatures, not 6.
7. There is no fast travel.
8. Battles have no abilities, held items or double battles.
9. There are only two kinds of item.
10. There is no quest log or side quest per town, and only a thin post-game.

## 7. The best ideas from fan games for Wildbond, ranked

1. **Field abilities that don't use a move slot** (Radical Red, Insurgence). This removes the most-hated HM chore while keeping the joy of opening new paths.
2. **Badge-based level caps and difficulty modes** (Run & Bun, Unbound, Insurgence). Wildbond already has `CAP_TABLE` and `MODES`; add a choice of difficulty at the start.
3. **Open order with scaling Wardens** (Crystal Clear). After the first two badges, let players choose the order and scale Warden teams by badge count.
4. **A quest log and a gimmick for each gym** (Unbound). Every Warden fight gets one special rule.
5. **Battle fields that change by place and weather** (Reborn). This builds on Wildbond's weather.
6. **No grinding** (Radical Red). Let players change a creature's training focus in town.
7. **A second region as the post-game** (Infinite Fusion, HGSS).
8. **A roguelite mode for replay** (Emerald Rogue), after the main game is finished.
9. **Hybrid creatures** (Infinite Fusion). Wildbond already has three `HYBRIDS`; expand them carefully.
10. **Regional variants with new elements** (Insurgence's Delta Pokémon). Wildbond has four `VARIANTS` to build on.

What not to copy: Reborn's very dark tone, Infinite Fusion's joke NPCs, and Sun and Moon's hand-holding.
