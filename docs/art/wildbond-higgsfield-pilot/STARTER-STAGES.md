# Three-stage starter references

## Current stage plan and approval

Evan approved the **Crown Mantle silhouette** as the payoff direction on 2026-10-13. That approves the visual direction, not a finished sprite, rig, model sheet or a new evolution implementation.

The newer authoritative plan is [docs/art/wildbond-evolution.md](../wildbond-evolution.md), merged through EVO-0. It proposes **new middle species**, retaining Blazefang, Tidewyrm and Thornback as the final names. The inspected live game data still contains the older third forms Pyremane, Deeptide and Elderthorn. Data/migration work belongs to EVO-1; this art packet does not invent a fourth stage or alter that data.

| Family | Base | Proposed middle (working name) | Planned final payoff |
|---|---|---|---|
| Ember | Cindercub | Smoulderpup | Blazefang |
| Tide | Ripplet | Riverwisp | Tidewyrm |
| Grove | Mosshog | Thicketboar | Thornback |

The original `pyremane/crown-mantle.png` file is preserved under its source name; the new workshop uses its approved visual direction for the proposed Blazefang payoff. Historical endpoint reports describe the older live graph, not the updated stage plan. Middle names remain provisional until EVO-1 settles them.

## The three distinct beats

- **Ember:** a little banked-ember ruff → a scruffy adolescent with uneven ember seams and oversized paws → a commanding fire crown. The middle reserves the full flame silhouette rather than becoming the same final with less fire.
- **Tide:** a small lizard practising bubbles → a gangly swimmer with a drooping, ribbed neck frill → a long river-reptile whose frill opens into a broad wave crown. The base reference needs a subtle neck-fold promise added in its eventual redraw.
- **Grove:** a little moss-backed boar and nest → an overgrown adolescent carrying uneven thin saplings → a broad living tree canopy on a powerful boar, with the same nesting space still recognisable.

Open [the three-stage workshop](starters.html). It shows three stages by default. Hide the middle to check the base promise; hide the base to check whether the final rewards the transitional stage. Both tests work in silhouette and greyscale, at equal display height and several sizes.

## Candidate assessment and corrections

The new Tide and Grove images deliver stronger final outlines than the earlier mature-animal portraits. The three middle concepts are visibly unfinished stages: the wolf's ruff is closed and quietly hot, the lizard's frill hangs folded, and the boar's garden is uneven. They are deliberately not miniature final forms.

These are **reference candidates**. Before an approved model sheet:

1. **Individual identity:** align eye shape, muzzle length, ears and landmark markings across all stages. Currently the bases are earlier pixel-styled studies and the new images use an illustrative finish. Agree on one rendering language, then redraw the family together.
2. **Ember:** correct the base's round ears and choose exactly how spots mature into chevrons. Keep the approved crown's three major masses recognisable in side/rear views. Smoulderpup faces the opposite way from the requested pose; redraw matching family views rather than treating a flipped marking map as correct.
3. **Tide:** retain the cheek and face landmarks, choose frill attachment/opacity, and verify the four legs through the longer body. The final neck may need shortening to retain more of the base's face/body rhythm. The water arc is an elemental design cue, not terrain or a collision footprint.
4. **Grove:** the thorn crown should grow from shoulder vegetation; some current branches can read like deer antlers. The canopy needs believable root attachment and a body that can visibly carry it. Keep the boar's muzzle, speckle map and original nest landmark consistent.
5. **Production:** clean alpha halos, establish named palette ramps, draw consistent front/side/rear references, then test one idle and walk loop at the actual camera. Portraits contain no mesh, rig or animation.

Do not interpret likeness at a single angle as proof that a model sheet is ready. The next productive step is a coherent three-stage family drawing with the identity corrections above, not generating more unrelated creatures.

## Sources, size and cost

Five new images were generated at **1K**, preserving their originals. Together they occupy 8,130,502 bytes; this avoids another round of 2K originals. The approved Crown Mantle and base sheets are reused, not duplicated. Exact prompts and provider IDs: `starter-stages/provenance.json`; dimensions, source hashes and cutout bounds: `starter-stages/audit.json`.

Cost preflight was 1.5 credits per image. Account balance changed **74.25 → 66.75**, matching **7.5 credits** for the five images. No purchase or subscription was made. Provider rights remain unverified; these images are not cleared game assets.

Validation: all 20 arcade suites pass. The three-stage workshop passed **243 family/viewport/mode/size/covering combinations** at 390, 1440 and 3440 px widths, including all three stages, endpoints only, and middle/final only. All visible sources have nonempty alpha, equal comparison heights, no page overflow or script errors. Evidence: `starter-stages/browser-checks.json` and `capture/stages-*.png`.
