# Realmbound: third-person 3D, starting with the inn (RB1.9)

Evan, 2026-10-10: "Can we convert this to a more modern Pokemon style 3d third person?"

## Direction

Yes: an original stylized 3D fantasy world, with readable characters, soft forms, strong silhouettes, warm interiors and a following third-person camera. Pokemon is a reference for approachability, proportions and camera readability; Realmbound keeps its own fantasy identity, names, combat, characters and lore. No copied models or textures.

The previous picture was perspective-drawn 2D. It suggests depth but is not most of a 3D conversion: geometry, camera collision, animation, asset production and integration still need work. The content/rules can carry forward; the presentation needs a measured rebuild.

## What is built now

`experiments/realmbound-3d/` is a separate, walkable Lantern Rest art/control trial. Start the local server and visit that path. It never loads or writes player saves, and changes no live Realmbound scripts.

- A 14x12-metre room with 3.2-metre walls. People are about 1.75 metres tall, beds 2.1 metres long. The clear centre aisle, two beds, tables, chairs, shelves and barrels have consistent physical dimensions.
- Actual 3D people with front/rear views determined by mesh orientation, jointed elbows/knees, grounded walking, tailored clothing, boots, a pack, layered hair and smaller facial features. Merran has grey hair, a beard and an apron; both people turn toward each other during conversation, with a restrained hand gesture. These are original rigid-joint procedural models, not finished production character art or skinned skeletal animation.
- Camera-relative movement; a following camera, drag orbit, wheel zoom and reset. Camera rays and room bounds prevent walls obstructing the hero. Portrait mode uses a wider field of view.
- Furniture and people have solid footprints. Approaching the existing Keeper, Merran, opens the shared portrait dialogue with his existing Lantern Rest welcome. No simulated rewards or progress.
- An entrance/exit to a small outdoor landing. This is a presentation test, not a new canonical area.
- A generous recessed fireplace with an animated geometric flame, point light and real shadow maps. Sunlight also casts geometry shadows. Reduced motion freezes flame/limb animation.
- Keyboard and held touch buttons; stopping on release, cancellation, blur and hidden tab. All guidance is in the game window.

The trial reuses the arcade's already-credited three.js r134 CDN dependency and shared/dialogue.js. No engine installation or paid assets. An uncached first load needs the CDN; its failure is explained on screen. It is not offline-ready. The production game remains available from the header link.

Three.js supports the necessary perspective rendering and shadow maps ([renderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html), [shadow overview](https://threejs.org/manual/pages/shadows.html)). This trial proves the browser route is possible, not that it is the final engine choice. Godot remains an option for a fuller standalone rebuild; Claude's existing Godot projects are untouched.

## Conversion outline for other assistants

| Step | Deliverable | Keep / check |
|---|---|---|
| 1, now | Isolated inn/control trial | Review the camera, scale, readable floor paths and phone controls by playing. No production cutover. |
| 2, first pass built | Character/art contract | Pick a recognisable Realmbound body style and palette; authored or rigged animation for idle, turn, walk, talk and combat. Validate front/back/profile views and grounded feet. Procedural shapes are placeholders. |
| 3 | One town and road | Convert existing map data to spatial objects with height/footprint definitions. Keep authored services, NPC positions, entrances and names; test every door and route. Add camera occlusion handling for buildings/trees. |
| 4 | Existing gameplay in that scene | Connect the current hero, inventory, quests, services and dialogue to the view adapter. Keep rules/saves separate from rendering; use actual saved fields and defaults, not a second copy of progression. |
| 5 | One combat and dungeon slice | Show existing combat decisions and encounter state in 3D with readable effects, enemies and UI inside the game window. Play the opening to a first dungeon before extending the whole world. |
| 6 | Expand by tested location | Towns, zones, dungeons and raid content one at a time. Asset catalogue, save compatibility, graceful graphics fallback, mobile performance and offline packaging become explicit deliverables. |

Do not call a full conversion done because the inn looks convincing. It needs a playable first quest, travel, combat, reward, save/reload and old-save import; then the remaining content. Do not spend money without Evan's approval or remove the current game before the replacement meets that bar.

Before anyone connects the trial to production, check open PRs and COMMS. RB1.7 (#153) and RB1.8 (#155) are the separate current-game furniture/facing fixes; this trial does not replace or conflict with them. No Wildbond/Starfall Godot files or shared engine changes belong here.

## Evidence

`node tests/realmbound-3d.cjs http://localhost:8766` runs 146 checks in isolated browser contexts. Covers 375x812, 1366x768, 1920x1080 and 3440x1440, real keyboard and touch input, collisions, camera bounds, shared dialogue, entry/exit, unchanged sentinel saves, animation, drag orbit, wheel zoom and library-load failure. Additional rig checks sample 16 stride phases for planted feet and floor clearance, and verify reduced-motion freeze, no marching against collisions reciprocal conversation facing, and no horizontal sliding during straight stance steps. Captures live in docs/screenshots/realmbound-3d/. All 17 existing suites pass using `node tools/run-all-checks.cjs`.

Headless browser checks are not a hardware performance guarantee. Judge camera comfort, art quality and motion by playing on Evan's actual desktop and phone. Known limits: simple procedural models/fire, an open-roof room, no full game integration, no audio in the trial, no pinch zoom, and no gamepad controls yet.

## An idea

Keep the camera calm during conversation: turn the hero toward the speaker and use a small framing shift only when motion preferences allow. Make interiors feel inhabited through posture, props and a few purposeful animations before adding more rooms.
## Character contract, first pass

Original traveller and Keeper silhouettes use the same approximately 1.75-metre body: a readable coat, collar/scarf, belt, boots and a smaller face. The traveller carries a strapped leather pack; the Keeper wears an apron. Body geometry is built in characters.js, independent of room construction and controls. Elbows and knees are transform joints; two-bone leg placement keeps the stance foot near the floor and lifts the swing foot. Walk phase follows distance actually travelled, so collision cannot produce marching in place. Breathing moves the upper body only; reduced motion freezes it and the walk pose. Conversation uses the existing portrait scene, turns both characters and raises one hand gently, without changing the camera.

The material helper interprets authored palette colours as sRGB before lighting, preventing the earlier pale look. More body types, expressions, race/class silhouettes, skinned meshes and production animation remain future work. The earlier trial front/back screenshots are preserved as before-characters-* for an honest comparison.

Latest-main validation: the first Starfall run could not preload the newly merged frontier art in this clone's stale import cache. A headless editor import refreshed the local cache without source changes; the Starfall rerun passed all 152 checks. The other 15 suites passed on the same source state.


## Visible gear, Evan's next requirement

The isolated trial now has a modular eight-slot equipment renderer and an Outfits menu inside the game window. It accepts the existing gear schema but previews demonstration loadouts only; saved equipment is not yet connected. The [asset contract](realmbound-assets.md) records the long-term direction for people, clothing, weapons, buildings, creatures, props and effects, with a tested replacement path and later performance/production-art stages.
