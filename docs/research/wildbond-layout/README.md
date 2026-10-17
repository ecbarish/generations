# Larkhaven and Thornwood layout study

WB-MAP-PLAN, Codex / Evan, 2026-10-17, [PR #552](https://github.com/ecbarish/generations/pull/552), stacked on #551. Evan asked to make the measured-map/reference workflow now and clarified that the world should be an interconnected Pokemon-style region. [Open the design board](index.html) to compare the measured local plan, existing regional schematic and new art reference.

## What has and has not landed

The connected world design [#455](https://github.com/ecbarish/generations/pull/455), regional concept map [#465](https://github.com/ecbarish/generations/pull/465) and WBW-3 graph are already in the repository. They are planning work. Current main `b8493ff0` still has 15 production maps with the old main progression chain and two early pockets. Neither the atmosphere/town prototypes nor this study implement the full regional redesign. Merged design data and a published playable region are different states.

The authority is [world-graph.json](../../plans/wildbond-world/world-graph.json), with **46 mapped places and 54 links**. The design counts 47 places overall because Glassfall is represented as a route/link rather than another map node. Reuse its existing schematic and gates rather than generating another regional topology. Stillreed is the hub; regional cave/water loops and the later Home Burrow shortcut make earlier places relevant again.

## First local layout

The measured source snapshot retains both current grids verbatim: Larkhaven (24 by 14) and Thornwood Trail (29 by 18), including existing door, NPC, item, sign, paddock and exit records. Source JSON/hash, original coordinates and display offsets are in [layout.json](../../../wildbond-godot/tests/layout_plan/layout.json). One study cell is 1.25 m; north is negative world Z. This scale is for the blockout, not a change to locked production sprite/door rules.

The existing local structure has a reason:

- Northwest healing inn and northeast shop share the town approach. The inn keeps its healing/inn role rather than becoming an unexplained replacement building.
- Southwest ranch and southeast paddock form the home/care district. Maren stays at her existing anchor; Pip and the town item keep theirs.
- The north road gives a safe path into Thornwood Trail. Its tall grass and item detour are optional; its western water stays solid. Bram keeps his current position.
- The east trail exit is reserved for **Dewcut**, as the connected design specifies. Its eventual far shelf into Old Root Grove retains the Stone-partner requirement.
- The town reserves a **west branch to Millgrass Lane**. Its first cave mouth previews the later Larkburrow return to Threadmeet, which needs both Stone Break and the Loom Badge. That shortcut is not opened here.
- Beyond this local crop, Thornwood connects to Rootwater, Knothollow and the grove through the existing graph's badge/field requirements, providing the planned early regional loop.

The candidate Millgrass geometry and west opening are explicitly proposed, not current map cells or approved runtime landing assignments. The two-cell study connector aligns the current town/trail gates on the common display grid. It does not overwrite their production exit destinations. New destination landings remain an integration task; the existing Knothollow planning contract also leaves its unresolved landings null.

## Walk it before building the scenery

[Play Layout.bat](../../../wildbond-godot/tests/layout_plan/Play%20Layout.bat) launches the isolated blockout. WASD/Arrows walk, Shift runs, Tab switches overhead view, P switches current/planned geometry, E inspects anchors. The installed private pack uses the animated trainer. Public captures use a plain blockout marker and contain no imported art.

This is simple geometry on purpose: verify footprints, service approaches, collisions, sightlines and branches before decorating. The blockout has no battles, service interiors, quests, dialogue or saves. The town study remains the separate functional service/UI example.

[Walking metrics](walking-metrics.json) report cell distance, metres and movement-only seconds from the current town start. These exclude stopping, exploration, dialogue, encounters and battles; they are not playtime estimates. Current geometry remains compact and will need a human scale/feel pass before production expansion.

## Art follows the layout

[art-reference.png](art-reference.png) was generated with the built-in image-generation tool from the measured diagram. [Exact prompt](art-prompt.txt) and [provenance](art-provenance.json) are retained. It shows the same three buildings, paddock, north forest route, west cave approach and east branch. The existing regional mood panels and graph are reused, not regenerated.

The painting is a visual proposal, not a screenshot or collision map. Roof details, benches, flowers, rock banks, gateposts, apparent heights and path curvature are decorative interpretation; do not copy their exact positions/heights into gameplay. Its red healing-inn roof is a proposed modern presentation treatment, not an approved change to the current palette. The grid/graph govern topology and anchor locations across every visual era.

Use [location-template.md](location-template.md) for the next place: region connections first, preserved anchors and gates second, measured local grid third, walkable blockout fourth, art reference fifth, then assets and adventure integration. Each place gets a distinct purpose and recognizable landmark, not the same three-building layout repeated everywhere.

## Verification

All **28 repository suites pass locally**, including **26,962 Wildbond Godot assertions**, 488 Starfall assertions and 23 unchanged save names. The separate layout checks pass **53 assertions**, and the native runner passes **13 portable / 14 private assertions**. This blockout does not add a hook to the production suite; its scoped commands are retained beside the study.

Scoped checks verify source fingerprints/anchors/collision, route and service reachability, a safe path avoiding tall grass, closed cave requirements and verbatim regional links/gates. Native checks verify movement, walls, water, current/planned toggle, safe return when hiding a visited lane, role inspection and overhead view. The design board's three tabs/images work at 1280px and 390px with no page errors or horizontal overflow; that is document validation, not mobile game acceptance.

The authoritative world graph's existing **44 tests pass**. Native Forward+ and Compatibility captures both pass actual held-key walking, Tab camera and P current/planned toggles. Public captures: [walking](captures/walking-view.png), [planned overhead](captures/overhead-planned.png), [current overhead](captures/overhead-current.png), with matching [Compatibility captures](compatibility/). This is local desktop evidence, not a performance benchmark.

No production data, NPC/story text, quest triggers, save fields or public PCK are changed. Runtime files remain under export-excluded `tests/`. The map/reference are ready for review; full regional integration remains with the engine feature work.
