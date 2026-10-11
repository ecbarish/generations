# Visible equipment and a path to richer Realmbound assets

Evan, 2026-10-10: equipment must appear on the characters. All assets should be built so we can continually improve them toward a much higher-definition game. This is a development direction, not permission to buy assets or a claim that today's procedural art is finished.

## Built now, in the isolated 3D trial

`experiments/realmbound-3d/gear.js` accepts the existing `h.gear` shape: head, chest, legs, feet, hands, weapon, offhand and trinket, with `atype`, `wtype`, `otype` and `rar`. It resolves stable visual IDs from those fields, independently of translated/display names. Each slot attaches to the relevant character transform; leg armour follows thigh and knee, boots follow feet, held items follow hands, and headwear follows the head. Replacing or removing equipment disposes its geometry/materials and leaves the body and animation intact. Unknown types show an explicit coloured placeholder rather than disappearing.

The in-world Outfits menu demonstrates travel clothes, a mail-clad Warrior with sword/shield, a leather-clad Hunter with bow/dagger, and a cloth-clad Mage with staff/tome. These are demonstration loadouts, not rewards or a connection to saved equipment. The current game and player saves are untouched. All five weapon types and three offhand types have original procedural meshes. This establishes the adapter; it does not yet provide a unique model for every item tier or a production skinning system.

## Contract for the next art passes

| Asset family | Stable requirements before replacing its art |
|---|---|
| People and visible equipment | Metre scale; feet at ground zero; forward +Z in this trial; named head/chest/hip/hand/foot attachment points; slot/material/type identity; exposed face and readable class silhouette; idle, walk, turn, talk and combat clips; equipment follows the pose. For skinned bodies, garments share the skeleton or are bound to compatible bones. |
| Buildings and interiors | Door opening, floor elevation, entry/exit transforms and solid footprints are separate from the decorative mesh. Upgrading a wall or roof must not move a doorway or obstruct a route. |
| Furniture and world props | Stable asset ID, pivot, measured dimensions, interaction point and collision footprint. Lamps/fireplaces include light and effect anchors; chairs/beds include occupation anchors. |
| Creatures | Stable species identity, measured bounds, grounded locomotion, interaction/bond anchor, attack/effect anchors and silhouette at gameplay camera distance. |
| Effects and environment | Local effect origin, bounded extent, light/shadow policy, reduced-motion variant, weather/time palette and distance/detail options. Flames remain within hearth openings. |

Keep visual IDs and gameplay IDs separate from mesh filenames. A loader can replace procedural factories with licensed, authored GLB models later while preserving these contracts. GLB loading, retargeting and LOD switching are **not implemented yet**. Record source, licence and attribution for every imported asset before it enters the repo. No paid purchases without Evan's approval.

## Upgrade in playable passes

1. **Readable equipment, now:** every occupied slot has a visible representation; nothing is silently lost when swapping items. Capture front/back/profile views and movement, including mixed equipment.
2. **One production-quality character:** improve anatomy, facial expressions, skinned cloth/armour, weapon grips and authored movement. Fit all equipment categories to that body before making dozens of variants. Avoid blades through faces, armour through limbs, and boots through floors.
3. **One coherent room and road:** replace props, wall/roof materials and vegetation to the same detail standard. Preserve real object shadows, dimensions and navigable doors. Higher resolution alone will not fix a badly proportioned room.
4. **Quality settings and measured budgets:** compare low/medium/high on Evan's PC and an actual phone; measure frame time, draw calls, memory and load size before choosing triangle/texture budgets. Add LODs, material atlases or shadow-distance limits where those measurements require them. Headless screenshots are not a performance test.
5. **Production view adapter:** use actual saved gear and existing equip/unequip events to update visuals, preserving old saves and item rules. Verify every supported class/slot combination and save/reload. Only then expand locations and unique item-tier art.

The goal is a coherent, increasingly detailed world with visible progression. Keep the warm original Realmbound identity as detail improves. Do not equate high definition with photorealism, or finish only the hero while leaving everything else at placeholder quality. Other games can adopt the same principles in their own engines; this trial does not edit or dictate Claude's Godot implementation.
## Reference direction after Evan's kit review

Evan found the first Warrior preview chaotic and suggested RuneScape or Erenshor as a more suitable quality/style reference. Our interpretation: equipment should form one recognisable adventurer silhouette, with clear material groupings and sensible carrying positions. This is an art judgement and direction for Realmbound, not a claim that either reference requires a particular engine or exact body ratio.

Reference sources: [Jagex's Rune armour set](https://secure.runescape.com/m%3Ditemdb_oldschool/Rune%2Barmour%2Bset%2B%28lg%29/viewitem?obj=13024), [Erenshor's developer Steam gallery](https://store.steampowered.com/app/2382520/Erenshor/) and [official player's guide, character/class and equipment sections](https://www.erenshor.com/gallery/ESPPG.pdf). Use these for comparison; do not import their models, textures, costumes or names into Realmbound.

The revised trial has a body of roughly five-and-a-half head heights, longer legs, fitted faceted torso armour and shoulder sleeves that follow each arm. Steel pieces share a quiet palette; the underlayer changes to coordinate with the equipment. Bright straps and large gold knee/boot blocks are removed. The travel pack is hidden with a full kit so it does not compete with the armour; removing that kit restores travel clothing and pack. The sword/dagger/mace point down, clear of the face; the sword is checked against the floor across a stride. None of this is a combat animation or a production-quality armour model yet.

Next review is at gameplay camera distance, from front, back and profile while walking. Ask whether the class reads immediately, whether separate slots fit as one outfit, and whether the silhouette remains clear against the room. Passing code checks cannot approve the art. Before extending item tiers or more locations, replace one character/equipment set with well-authored, rigged art and compare it here. The current modular attachment contract makes that next pass possible; more decorative geometry alone is not the quality goal.
## First authored-character comparison (2026-10-10)
Evan authorised trying the free Quaternius assets. The opt-in inn URL ?characters=quaternius now demonstrates local GLB loading, compatible named skeleton animation and a hand-mounted weapon, alongside the unchanged original preview. This is a narrow compatibility adapter, not general retargeting, eight-slot imported armour support or LOD. See experiments/realmbound-3d/assets/quaternius/README.md for exact sources, licence, transformations and free-tier limits. Paid Regular/Teen bodies and the expanded fantasy wardrobe have not been purchased or tested.
