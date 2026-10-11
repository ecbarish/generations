# Free character comparison (Quaternius, CC0)

Open `/experiments/realmbound-3d/?characters=quaternius` from serve.ps1. The ordinary URL keeps the original procedural characters and equipment preview. No live-game or save integration.

Downloaded from the creator on 2026-10-10:
- Universal Base Characters **Standard**, free: https://quaternius.itch.io/universal-base-characters
- Modular Character Outfits – Fantasy **Standard**, free: https://quaternius.itch.io/modular-character-outfits-fantasy
- Universal Animation Library **Standard**, free: https://quaternius.itch.io/universal-animation-library

The creator licenses these assets CC0 (see LICENSE.txt). Keep the source/licence trail even though attribution is not required. No purchases made. THREE GLTFLoader comes from THREE 0.134.0 (MIT), matching the existing renderer.

## Included and adapted

Male Ranger and Peasant outfits, the free Superhero male head/eyes/eyebrows, SimpleParted rigged hair, and the free Standard animation library (43 named clips). Only Idle_Loop, Walk_Loop and Idle_Talking_Loop are used. The complete free model has Superhero proportions; Regular and Teen base models are not in the free archive. The free outfits are intended for Regular bodies. This comparison uses their clothed bodies and extracts the head triangles by neck/head skin weights, rather than exposing a second body through the clothing. Hair/brows are recoloured brown or grey. Different parts retain their own matching named skeletons and are driven by the same clips.

`pack-quaternius.cjs` embeds buffers/textures into GLB and resizes textures to a maximum 512px for this prototype (source originals remain in the downloaded archives, outside the repository). It repairs the base export's `_png.png` normal-map filename reference using the supplied `.png` file. Rigged hair is required; origin-at-zero hair does not follow the head. Existing collision and interaction dimensions are unchanged. Imported people are scaled .93, approximately 1.7m tall. The original trial sword attaches to hand_r and can be hidden. This is a compatibility demonstration, not a fitted armour library, complete item-slot support, combat animation, or production retargeter.

## Decision

These have far better human anatomy, clothing construction and skeletal movement than our procedural trial people. They are a credible starting point for the intended grounded stylized direction. Confirm the look with Evan in motion before buying. The $20 full outfit tier adds the armour/mage/noble range; the $19.99 expanded base tier adds Regular/Teen models and source files. Paid tiers have not been downloaded or tested. More purchases will not remove the work of equipment fitting, class silhouettes, expressions and animation blending.

Tests: `node tests/realmbound-3d-assets.cjs http://localhost:8766`. Screenshots in docs/screenshots/realmbound-3d. Real frame-rate/performance on Evan's PC still needs playtesting; headless rendering does not establish that.

## Proportion comparison (Evan, 2026-10-10)
The default imported build now widens each clothed outfit/skeleton by 18% and adds 12% depth, preserving vertical scale and the separate head/hair dimensions. The weapon follows the broadened hand skeleton. This is a reversible whole-body proportion preview, not a sculpted anatomy or armour-fitting pass. The in-world Build / sword menu selects Broader build or Original build; ?characters=quaternius&build=original opens the previous proportions directly. Fixed-pose measured shoulder span grew from .355m to .417m, with identical head and foot elevations. Front/profile before-after and broad in-room screenshots use the same camera and pose. Reduced-motion startup now evaluates an idle pose before freezing, avoiding a T-pose.

## Fuller arms and torso (second review)
Evan still found the arms and bodies small after the width-only pass. Fuller build now applies weighted mesh cross-section changes in each arm/spine bone's bind space before animation: upper arms 1.55x radius, forearms 1.45x, hands 1.08x, torso 1.22x width and 1.30x depth, pelvis 1.06x width/1.10x depth, blended by each vertex's original skin weights. Bone lengths/pivots, weights, indices and head/hair geometry stay unchanged. The same deformation applies to skin, sleeves, bracers, torso clothing and pauldron meshes. Normal/bounds data are recomputed. This is a procedural volume prototype, not a finished anatomical sculpt. Source geometry remains untouched; the menu selects Fuller build, Previous build (width-only), or Original build, plus the sword toggle. Use &build=wide for the previous width-only pass. Matched-pose evidence is in volume-*.png; movement, rollback, actual arm/torso vertex changes and skin binding are checked in the asset suite. No paid assets or production edits.

Rigid armour correction: the Ranger pauldron is weighted to upperarm_l, but it is a hard shell. It is now excluded from the arm-volume deformation and retains its original geometry and animation binding. Body/sleeves still gain volume. This fixes the stretched, raised pad; fine fitting and the source pack's asymmetric rim design remain art-review work. The asset suite explicitly checks this exemption.
