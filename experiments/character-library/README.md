# Shared character fitting bench

Serve the repository and open `/experiments/character-library/`. This is an isolated art inspection tool and the first consumer of `shared/assets/catalog.json`. It does not read or write game saves.

The registry resolves the male/female body, travel/ranger composites, shared hair and animation sources. Both variants run Idle, Walk, Talk and Sword stance through the same source clips. Front, side, rear and three-quarter views, pause/play, pose scrubbing and a right-hand sword probe make mismatches visible. Reduced motion starts paused; Play is an explicit override. Controls remain disabled while resources load. Failures display a recovery message.

## Source and adapter

- Quaternius CC0 meshes, notices in the registered asset directories. Existing male resources remain in the Realmbound experiment; female counterparts remain in the shared library. No duplicates.
- THREE/GLTFLoader r134 from the same external CDNs as the existing Realmbound trial. MIT notice: `licenses/three-r134-MIT.txt`. The bench needs an internet connection for these scripts; it is not an offline production loader.
- Free Superhero heads are extracted by neck/head skin weights; clothed composites supply the bodies. Each part keeps its original rig and its own mixer, driven by the same clip. No duplicate full body is rendered.
- Source scale is .93 for both. No fuller-body deformation is applied. The shared parted hair is shown on both travel bodies; it is hidden under ranger hoods.
- The original procedural sword probe attaches to `hand_r`. Its local X rotation is **-PI/2**, correcting the backward blade orientation found during this bench's visual review. The animation test checks that the blade projects forward in Sword stance on both bodies and outfit rigs.

## Acceptance boundaries

This proves registry loading, named-track binding, skinned movement and a moving attachment on two bodies. It does not establish that every animation/garment is production-ready. The free outfit pair has different tailoring and source body proportions. Head/neck seams, fuller limbs, head scale, finger grip and garment clipping still need artist review. The source rear ranger skirt has a visible green patch; inspect the source materials/overlap before changing it. Hands during Talk may be open while a weapon is enabled: switch to Sword stance for grip inspection. The generated role sheets are visual targets, not illustrations of these exact source meshes.

Do not automatically port this prototype into Claude's Godot files. The next implementation should reproduce the accepted contract in an isolated Godot scene, then be reviewed before game integration. No purchases are required to inspect this packet.

## Checks

`node tests/character-library.cjs http://localhost:8777` checks loading, all clips, skin values, both outfit families, attachment motion, forward blade direction, removal, controls, reduced motion, storage isolation and failure recovery at phone/desktop/ultrawide sizes. It writes evidence to `docs/art/starfall-higgsfield/bench/`. Run `node tools/run-all-checks.cjs` separately for the normal game and registry suites. The optional viewer suite uses CDNs and is deliberately separate from offline game checks.
