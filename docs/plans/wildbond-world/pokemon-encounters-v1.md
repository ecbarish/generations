# Wildbond: Pokémon-first encounter blueprint

Status: **planning proposal only**, WB-ENCOUNTER-BLUEPRINT, Codex / Evan, 2026-10-18. Generated from [the planning data](pokemon-encounters-v1.json) using `python -B tools/wildbond_encounter_plan.py --render`. Nothing in the game loads these tables; no encounter, save, graph, art, trainer or guardian changed.

## Agreed rules

- One audited graph place is one encounter area. The denominator is **33 ordinary or ordinary+special areas**; towns/special-only arenas and the Glassfall link do not add quota slots.
- **18 areas feature an original** across all eight regions and water. This counts placements, not 18 new species. Reusing a creature in suitable habitat is encouraged. Starter species stay exclusive to starter selection in this proposal.
- Rarity varies by creature. Only the first four pools have weights; later pools are habitat candidates, not finalized encounter tables. All placements here are design proposals, not new dex text or established habitat canon.
- Early Thornwood uses fixed authored levels; the rest uses **badge cap −13 through cap −5**, offset by gentle −2 / ordinary 0 / demanding +3, clamped to level 2 through the current cap. Resolve once at encounter start, never from party level or by rewriting caught creatures. Special encounters and trainers retain their own rules.

The seven fixed-policy places are Thornwood Trail, Millgrass, Dewcut, Rootwater, Thornwood, Old Root Grove and Knothollow. Thornwood town is special-only in the audit, so its reserved fixed-policy entry does not add an ordinary pool. Knothollow and the grove inherit the existing Thornwood 2–12 band; the four opening bands are explicitly proposed below.

### Regional bands by badges

| Badges | Cap | Gentle | Ordinary | Demanding |
| --- | --- | --- | --- | --- |
| 0 | 15 | 2–8 | 2–10 | 5–13 |
| 1 | 25 | 10–18 | 12–20 | 15–23 |
| 2 | 35 | 20–28 | 22–30 | 25–33 |
| 3 | 45 | 30–38 | 32–40 | 35–43 |
| 4 | 55 | 40–48 | 42–50 | 45–53 |
| 5 | 60 | 45–53 | 47–55 | 50–58 |
| 6 | 65 | 50–58 | 52–60 | 55–63 |
| 7 | 70 | 55–63 | 57–65 | 60–68 |
| 8 | 75 | 60–68 | 62–70 | 65–73 |

This table does not grant access: phase, badge, field and story requirements still govern entry. First-reach values below are uncorrected snapshots of the audited graph, including its known leaks; they are not new progression approvals.

## First four encounter tables

| Area | Fixed levels | Weighted species |
| --- | --- | --- |
| Thornwood Trail | 2–4 | Pidgey 45%, Sentret 30%, Caterpie 25% |
| Millgrass Lane | 2–5 | Pidgey 30%, Sentret 25%, Oddish 20%, Seedpip 25% |
| Dewcut | 4–8 | Caterpie 30%, Weedle 25%, Shroomish 30%, Glimmerwing 15% |
| Rootwater Path | 7–12 | Wooper 45%, Psyduck 30%, Paras 17%, Bogsnap 8% |

Seedpip is regular (25%), Glimmerwing uncommon (15%) and Bogsnap rare (8%). Their placement rationales are recorded per area. Shroomish is a shaded, damp meadow-edge candidate; this proposal does not introduce time-of-day, weather or fishing conditions.

## All 33 encounter areas

Claude’s 18 recommended placements are retained with two explicit Thornwood swaps: **Thornwood Trail → Millgrass** and **Knothollow → Dewcut**, matching the approved first tables. Rootwater and Old Root Grove retain originals. This keeps 18 placements, region/water spread and the half-area target without forcing a fourth original into the opening.

| Area / region | Reach: ropes → open order | Level rule | Candidate pool | Original rarity |
| --- | --- | --- | --- | --- |
| Thornwood Trail / thornwood | 0 → 0 | fixed 2–4 | Pidgey, Sentret, Caterpie | — |
| Millgrass Lane / thornwood | 0 → 0 | fixed 2–5 | Pidgey, Sentret, Oddish, **Seedpip** | regular |
| Dewcut / thornwood | 0 → 0 | fixed 4–8 | Caterpie, Weedle, Shroomish, **Glimmerwing** | uncommon |
| Rootwater Path / thornwood | 0 → 0 | fixed 7–12 | Wooper, Psyduck, Paras, **Bogsnap** | rare |
| Saltmarsh Road / saltmarsh | 1 → 1 | regional / gentle | Wooper, Wingull, Poliwag | — |
| Wrackline / saltmarsh | 1 → 1 | regional / ordinary | Krabby, Wingull, Tentacool, **Brineskit** | uncommon |
| Ashstair / emberfall | 2 → 2 | regional / ordinary | Geodude, Vulpix, Numel, **Slaglet** | regular |
| Sootpath / emberfall | 3 → 2 | regional / ordinary | Slugma, Numel, Sandshrew, **Ashskip** | uncommon |
| Pass Foot / cloudglass | 4 → 2 | regional / ordinary | Swablu, Mareep, Geodude, **Mistfinch** | uncommon |
| Crest Path / cloudglass | — → 2 | regional / demanding | Snover, Sneasel, Snorunt | — |
| The Long Boards / stillreed | 4 → 2 | regional / gentle | Psyduck, Marill, Yanma | — |
| Orchard Fen / stillreed | 4 → 2 | regional / gentle | Sunkern, Combee, Hoppip, **Orchardroot** | regular |
| The Late Path / hollowecho | 5 → 2 | regional / ordinary | Zubat, Gastly, Hoothoot, **Hushpup** | uncommon |
| Flintcut / hollowecho | 5 → 2 | regional / ordinary | Geodude, Onix, Nosepass | — |
| Ribbon Road / sunthread | 4 → 2 | regional / gentle | Mareep, Kricketot, Cherubi, **Hemglow** | uncommon |
| Shelter Mile / sunthread | 7 → 2 | regional / gentle | Growlithe, Mareep, Eevee | — |
| Chart Road / farwatch | 7 → 2 | regional / ordinary | Starly, Hoothoot, Murkrow, **Chartwing** | uncommon |
| Seaward Ledge / farwatch | 7 → 2 | regional / ordinary | Wingull, Krabby, Buizel | — |
| Trial Road / farwatch | 7 → 2 | regional / demanding | Ponyta, Machop, Rhyhorn | — |
| The Answering Ways / hollowecho | — → 2 | regional / demanding | Zubat, Whismur, Bronzor, **Bellmote** | rare |
| Knothollow / thornwood | — → 1 | fixed 2–12 | Zubat, Paras, Diglett | — |
| Keelcave / saltmarsh | — → 2 | regional / demanding | Zubat, Shellder, Krabby | — |
| Kilnvent / emberfall | — → 2 | regional / demanding | Slugma, Torkoal, Numel, **Glowmote** | rare |
| Larkburrow / thornwood | — → 0 | regional / gentle | Diglett, Sandshrew, Dunsparce | — |
| Lowbell / stillreed | — → 2 | regional / demanding | Wooper, Lotad, Bronzor, **Reedlet** | uncommon |
| Trialstair / farwatch | — → 2 | regional / demanding | Onix, Machop, Nosepass, **Moorweft** | uncommon |
| Greywash Sound / saltmarsh | — → 2 | regional / ordinary | Tentacool, Chinchou, Magikarp, **Brineskit** | uncommon |
| The Quiet Channels / stillreed | — → 2 | regional / gentle | Psyduck, Marill, Lotad | — |
| The Open Grey / farwatch | — → 2 | regional / demanding | Wailmer, Remoraid, Wingull | — |
| Saltmarsh Coast / saltmarsh | 1 → 1 | regional / ordinary | Krabby, Wingull, Wooper | — |
| Old Root Grove / thornwood | 0 → 0 | fixed 2–12 | Oddish, Exeggcute, Shroomish, **Seedpip** | regular |
| Moon Pool / saltmarsh | 1 → 1 | regional / gentle | Marill, Poliwag, Chinchou, **Poolkit** | uncommon |
| Outer Shoal / farwatch | — → 2 | regional / demanding | Corsola, Krabby, Shellos | — |

### Habitat and journey roles

**Thornwood Trail.** A familiar forest-edge bird, small mammal and caterpillar make the first grass readable. Introduce ordinary encounters on the first outward walk. Dependencies: RA-08, RA-20. Original notes: no original assigned. Not activated.

**Millgrass Lane.** Meadow-edge birds and small mammals share seed-bearing fence lines with Oddish and Seedpip; Seedpip's existing seed-tucking behavior motivates the original slot. Make the west branch feel distinct while keeping it approachable. Dependencies: RA-08. Original notes: regular. Not activated.

**Dewcut.** Caterpillars occupy meadow margins, Shroomish is proposed for damp shaded edges, and Glimmerwing provides the occasional bright bird above the grass. Reward the first optional eastern detour with a different collection mix. Dependencies: RA-08, RA-10. Original notes: uncommon. Not activated.

**Rootwater Path.** Wooper and Psyduck suit shallow stream margins; Paras is proposed around wet roots. Bogsnap's established still-water patience makes it the rarer original discovery. Give the stream path a memorable catch before the badge-locked cave entrance. Dependencies: RA-08, RA-10. Original notes: rare. Not activated.

**Saltmarsh Road.** Shallows, wet grass and open coastal air motivate Wooper, Poliwag and Wingull as candidate occupants. Bridge the forest and coast without repeating the first trail pool. Dependencies: RA-15. Original notes: no original assigned. Not activated.

**Wrackline.** Crab and shallow-water candidates share the wrack line with Brineskit, whose existing description places it beneath empty shells in tide pools. Give the road to Lantern Quay its own shoreline identity; keep special encounters separate. Dependencies: none specific in the audit. Original notes: uncommon. Not activated.

**Ashstair.** Geodude, Vulpix and Numel are proposed along the warming rocky climb. Slaglet's existing volcanic-dust coat anchors the original slot. Signal the transition from coastal shallows to warm highland ground. Dependencies: none specific in the audit. Original notes: regular. Not activated.

**Sootpath.** Slugma and Numel favor the proposed warm stretches while Sandshrew occupies dry margins. Ashskip's existing cooling-rock behavior ties it to ash beside the vent. Differentiate the overland approach from the cave crossing. Dependencies: RA-06. Original notes: uncommon. Not activated.

**Pass Foot.** Swablu, Mareep and Geodude are slope and ledge candidates. Mistfinch's established cloud-song behavior gives the descent a local original. Keep the slower return route worth walking after Glide becomes available. Dependencies: none specific in the audit. Original notes: uncommon. Not activated.

**Crest Path.** Snover, Sneasel and Snorunt are proposed specifically for the colder exposed summit stretches, subject to the final environment brief. Provide a tougher optional ascent; do not turn the guardian site into an ordinary pool. Dependencies: none specific in the audit. Original notes: no original assigned. Not activated.

**The Long Boards.** Psyduck and Marill suit channels beside the boards; Yanma is proposed over reed margins. Offer approachable water-edge variety near the basin hub. Dependencies: RA-12. Original notes: no original assigned. Not activated.

**Orchard Fen.** Sunkern, Combee and Hoppip are orchard/meadow candidates. Orchardroot's existing fallen-fruit soil behavior anchors the original slot. Make the orchard chord a collection detour after its missing rope is resolved. Dependencies: RA-03. Original notes: regular. Not activated.

**The Late Path.** Zubat, Gastly and Hoothoot are shaded-ridge candidates, not a new all-day spawn commitment. Hushpup's existing echo-checking behavior belongs at forks. Introduce the region's listening theme without revealing mystery answers. Dependencies: none specific in the audit. Original notes: uncommon. Not activated.

**Flintcut.** Geodude, Onix and Nosepass are proposed around the quarry's loose stone and worked faces. Contrast an exposed rocky approach with the echoing cavern pool. Dependencies: none specific in the audit. Original notes: no original assigned. Not activated.

**Ribbon Road.** Mareep, Kricketot and Cherubi are meadow-side candidates. Hemglow's existing shelter-cloth light is proposed near the road's ties and posts. Make the approach to the shared-work region recognizable through small useful companions. Dependencies: RA-03. Original notes: uncommon. Not activated.

**Shelter Mile.** Growlithe, Mareep and Eevee are proposed along sheltered, traveled edges; exact abundance remains undesigned. Provide a welcoming connective road rather than another mandatory difficulty spike. Dependencies: none specific in the audit. Original notes: no original assigned. Not activated.

**Chart Road.** Starly, Hoothoot and Murkrow are lookout-ground candidates. Chartwing's established fog-approach signaling motivates the original slot. Give the approach to the High Watch a useful coastal-observation identity. Dependencies: RA-19. Original notes: uncommon. Not activated.

**Seaward Ledge.** Wingull, Krabby and Buizel are proposed along cliff-foot shallows and the pier approach. Separate the coastal walk's ordinary species from its special story encounters. Dependencies: none specific in the audit. Original notes: no original assigned. Not activated.

**Trial Road.** Ponyta, Machop and Rhyhorn are candidates for the final road's exposed ground and physical climb. Offer an optional preparation challenge while preserving the all-badges League requirement. Dependencies: RA-05. Original notes: no original assigned. Not activated.

**The Answering Ways.** Zubat, Whismur and Bronzor are cavern candidates. Bellmote's established silent-bell light is proposed near the cave's lit mouth, pending final layout. Reward entering the listening cave after its missing Bellstep connection is reconciled. Dependencies: RA-04, RA-17. Original notes: rare. Not activated.

**Knothollow.** Zubat, Paras and Diglett give the root cave a distinct mix without requiring another original in the first loop. Make the post-badge loop a change of habitat; entrances and landings remain gated by their briefs. Dependencies: RA-08, RA-09, RA-17. Original notes: no original assigned. Not activated.

**Keelcave.** Zubat occupies proposed dry recesses, with Shellder and Krabby beside the tidal floor; exact encounter surfaces need layout review. Make a supplied sea-cave outing distinct from the open water routes. Dependencies: RA-14. Original notes: no original assigned. Not activated.

**Kilnvent.** Slugma, Torkoal and Numel are warm-cave candidates. Glowmote's existing seldom-seen steam light makes it a rare original. Give the Lantern crossing a discovery alongside its through-route purpose. Dependencies: none specific in the audit. Original notes: rare. Not activated.

**Larkburrow.** Diglett, Sandshrew and Dunsparce are proposed under-meadow burrow occupants. Keep the early accessible first room separate from the later Stone Break and Loom Badge through-path. Dependencies: none specific in the audit. Original notes: no original assigned. Not activated.

**Lowbell.** Wooper, Lotad and Bronzor are flooded-floor candidates. Reedlet's established floating-reed behavior is proposed around accessible water margins. Reward Tide Ride exploration without treating the shrine's special history as a random spawn. Dependencies: none specific in the audit. Original notes: uncommon. Not activated.

**Trialstair.** Onix, Machop and Nosepass are climbing-cave candidates. Moorweft's existing pebble-catching silk supports a proposed original placement along loose-stone passages. Make the final cave a coherent supply test while League access remains a graph dependency. Dependencies: RA-05. Original notes: uncommon. Not activated.

**Greywash Sound.** Tentacool, Chinchou and Magikarp are water-route candidates; reuse Brineskit specifically in shallow edges consistent with its existing tide-pool behavior. Extend familiar coastal life into the first navigable water route. Dependencies: RA-14. Original notes: uncommon. Not activated.

**The Quiet Channels.** Psyduck, Marill and Lotad are basin-channel candidates; only navigable surfaces qualify. Make water traversal feel different from the boardwalk while sharing a believable local ecosystem. Dependencies: none specific in the audit. Original notes: no original assigned. Not activated.

**The Open Grey.** Wailmer, Remoraid and Wingull are open-sea candidates; this does not invent underwater or fishing mechanics. Provide a tougher optional water outing and a reason to reach distant shorelines. Dependencies: RA-16. Original notes: no original assigned. Not activated.

**Saltmarsh Coast.** Krabby, Wingull and Wooper are proposed across the coastal flats' land and shallow margins. Keep ordinary catches separate from Nerys and the guardian's existing special meeting. Dependencies: RA-11. Original notes: no original assigned. Not activated.

**Old Root Grove.** Oddish, Exeggcute and Shroomish are sheltered-grove candidates. Reuse Seedpip around root cracks rather than commissioning another original. Reward an early Stone-partner revisit while preserving guardian and Grove Wake events. Dependencies: RA-08, RA-09, RA-10, RA-16. Original notes: regular. Not activated.

**Moon Pool.** Marill, Poliwag and Chinchou are pool candidates. Poolkit's existing rain-ring behavior gives this small original a specific watery setting. Reward the early Tide-partner pocket and its later water-route connection. Dependencies: none specific in the audit. Original notes: uncommon. Not activated.

**Outer Shoal.** Corsola, Krabby and Shellos are proposed for the shoal's small islands and shallow edges. Offer optional island variety after the route and return landings are actually built. Dependencies: RA-15, RA-16. Original notes: no original assigned. Not activated.

## Readiness and implementation boundary

A verified private sprite is not a playable species. Art status below includes an outstanding scene review; unpolished legacy originals require redesign/review rather than automatic acceptance. Bogsnap has the approved identity and existing animation candidates, not final visual acceptance. Combat support means support in the current native chapter, not the old adventure or isolated battle studies.

| Species | Art readiness | Chapter combat |
| --- | --- | --- |
| Caterpie (`pokemon:10`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Exeggcute (`pokemon:102`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Rhyhorn (`pokemon:111`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Magikarp (`pokemon:129`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Weedle (`pokemon:13`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Eevee (`pokemon:133`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Pidgey (`pokemon:16`) | private_library_verified_needs_scene_review | supported_in_chapter |
| Sentret (`pokemon:161`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Hoothoot (`pokemon:163`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Chinchou (`pokemon:170`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Mareep (`pokemon:179`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Marill (`pokemon:183`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Hoppip (`pokemon:187`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Sunkern (`pokemon:191`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Yanma (`pokemon:193`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Wooper (`pokemon:194`) | private_library_verified_needs_scene_review | supported_in_chapter |
| Murkrow (`pokemon:198`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Dunsparce (`pokemon:206`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Sneasel (`pokemon:215`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Slugma (`pokemon:218`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Corsola (`pokemon:222`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Remoraid (`pokemon:223`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Sandshrew (`pokemon:27`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Lotad (`pokemon:270`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Wingull (`pokemon:278`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Shroomish (`pokemon:285`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Whismur (`pokemon:293`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Nosepass (`pokemon:299`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Wailmer (`pokemon:320`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Numel (`pokemon:322`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Torkoal (`pokemon:324`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Swablu (`pokemon:333`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Snorunt (`pokemon:361`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Vulpix (`pokemon:37`) | private_library_verified_needs_scene_review | supported_in_chapter |
| Starly (`pokemon:396`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Kricketot (`pokemon:401`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Zubat (`pokemon:41`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Combee (`pokemon:415`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Buizel (`pokemon:418`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Cherubi (`pokemon:420`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Shellos (`pokemon:422`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Oddish (`pokemon:43`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Bronzor (`pokemon:436`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Snover (`pokemon:459`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Paras (`pokemon:46`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Diglett (`pokemon:50`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Psyduck (`pokemon:54`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Growlithe (`pokemon:58`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Poliwag (`pokemon:60`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Machop (`pokemon:66`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Tentacool (`pokemon:72`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Geodude (`pokemon:74`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Ponyta (`pokemon:77`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Shellder (`pokemon:90`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Gastly (`pokemon:92`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Onix (`pokemon:95`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Krabby (`pokemon:98`) | private_library_verified_needs_scene_review | needs_catalogue_integration |
| Ashskip (`wildbond:ashskip`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Bellmote (`wildbond:bellmote`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Bogsnap (`wildbond:bogsnap`) | approved_design_candidate_needs_scene_review | needs_catalogue_integration |
| Brineskit (`wildbond:brineskit`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Chartwing (`wildbond:chartwing`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Glimmerwing (`wildbond:glimmerwing`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Glowmote (`wildbond:glowmote`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Hemglow (`wildbond:hemglow`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Hushpup (`wildbond:hushpup`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Mistfinch (`wildbond:mistfinch`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Moorweft (`wildbond:moorweft`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Orchardroot (`wildbond:orchardroot`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Poolkit (`wildbond:poolkit`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Reedlet (`wildbond:reedlet`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Seedpip (`wildbond:seedpip`) | legacy_design_needs_redesign_review | needs_catalogue_integration |
| Slaglet (`wildbond:slaglet`) | legacy_design_needs_redesign_review | needs_catalogue_integration |

## Dependencies and handoff

- Source audit: [PR #564](https://github.com/ecbarish/generations/pull/564), [region audit](region-audit.md). Current art availability: [private library](../../research/wildbond-private-library/README.md). Original dialogue/lore remains governed by the writer ledger; no clue or player text was placed here.
- **RA-01 / RA-02:** this proposal records the chosen regional-level rule and area denominator; it does not install them in an engine or mark the audit resolved.
- **RA-03:** graph owner must resolve Orchard Fen’s missing Echo Badge rope; historical ropes-phase reachability here still reflects that leak. **RA-04:** Answering Ways’ Bellstep connection remains with existing PR #523. **RA-05:** temporary pre-Trialstair League access must become machine-checkable. This task does not edit their graph/gates.
- **RA-08 / RA-09 / RA-10 / RA-17:** measured Thornwood destination, Grove Wake/first loop and destination landings need reconciliation before native wiring. Planned null landings are not safe engine coordinates.
- Next playable increment: Thornwood town with Isolde/healing, then the badge/Grove Wake loop. Before encounter integration, add bounded combat definitions/learnsets, approve selected art, resolve map/grass-area ownership and test catch → battle → return → save/reopen. Preserve existing six-species chapter records and private-pack fallback behavior.
- Do not treat candidate pools as weighted distributions, invent missing move/status/evolution support or globally scale the old adventure’s wild tables. Existing [route tables](route-encounters.md) and cave plans remain intact historical inputs.
