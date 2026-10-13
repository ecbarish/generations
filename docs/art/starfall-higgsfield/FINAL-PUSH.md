# Paused at a usable character baseline

2026-10-13, Evan requested one final focused push before switching to work reports.

## Ready to inspect

- [3D fitting bench](../../../experiments/character-library/): real male/female source models, two outfit families, four shared clips, four viewing angles, pause/scrub and a removable hand-held sword probe.
- [Paired role sheets](kits.html): male and female Swordsman, Mage and Cleric, front/rear, with comparable protection and visible attached equipment.
- [Shared library](../library.html): stable IDs, source hashes, licences and prototype/reference status. Search before creating a new body or part.
- [Body studies](bodies.html): neutral travel references, separate from the actual Quaternius source geometry.

## Recommended direction

Use the paired Swordsman sheet to establish the first fitted kit: sturdy limbs, compact chain vest, practical shoulder protection, a belt-mounted sword and a strapped shield. Make the same role available on both bodies. The Mage's split coat and the Cleric's vest/satchel extend the shared base without replacing the entire person. Keep palettes and costumes specific to each world.

These remain unnamed adults. Aki/Ren/Yuna appearances are not approved by this packet. The generated images are reference-only with unverified rights; the registered Quaternius meshes retain CC0 status.

## Corrections before modelling

1. The male Mage's rear book switches to the wrong hip. Fix it to anatomical left; staff remains in the right hand.
2. Normalize front/rear strap routes and the Cleric's crook curvature. Test the Swordsman's shoulder guards while raising arms, not just at rest.
3. Source meshes are slimmer and have different tailoring than the new reference direction. Do not claim the references have already been implemented. Review head/neck seams and limb volume on both bodies before fitting extra armour.
4. The fitting bench corrected a backward sword attachment inherited from the earlier probe orientation. Its forward direction is now checked. Finger grip, open-hand clips and final weapon dimensions remain art work.
5. Keep full-body composites mutually exclusive. Future garments need an explicit supported-body list and pose evidence for each body; passing on the male source does not accept the female fit automatically.

## The next bounded task, when development resumes

Fit **one Swordsman travel-to-mail kit on both bodies** in an isolated scene: torso, modest shoulder guards, sword held/stowed and shield mounts. Inspect front/profile/rear, idle, walk and sword stance. Record seam, grip and collision corrections. Only after visual acceptance should an engine owner integrate it into a game. Do not bulk-generate the rest of the catalogue or buy a pack just to fill missing checkboxes.

The three new paired sheets cost **4.5 credits**, balance **57.75 to 53.25**. Exact prompts and job IDs are in `kit-provenance.json`. No additional generation is queued. The current PR and COMMS hold the handoff; development can pause here.
