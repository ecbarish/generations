# Creature reference language and evolution briefs

**Superseded final-form rule:** [Evan's promise/payoff direction](EVOLUTION-PROMISES.md) now governs every evolution. Natural maturation can describe a middle stage, but a final form must deliver a substantial transformation. Use the complete Godot evolution graph: Blazefang, Tidewyrm and Thornback are middle stages, not endpoints. The 15-family promise/payoff table is the current brief; earlier candidates below remain exploration history.

## Evan's direction — 2026-10-13

The purpose of this experiment is the cleanest production path and clearest references for the whole catalogue. Evan likes these designs, but wants evolution variety: a dramatic transformation can be as exciting as the jump from Charmander to Charizard. Not every evolution should simply look older or larger. That is a principle about transformation, not permission to copy those creatures' designs.

The first Blazefang and Thornback portraits are **conservative maturity candidates**, not a universal evolution template or approved final model sheets. They demonstrate family consistency, not the full ambition of Wildbond's evolution design.

## Shared language, different creatures

Keep the storybook feel, ink colour, light direction, named material ramps and believable animal structure from `../wildbond-art-direction.md`. Agree on silhouette and body proportions before adding texture. Personality comes from stance, gesture and a few expressive features, not a giant head on every creature.

These are shared rendering rules; they do not mean every species needs the same body shape, eyes, pose or transformation. Do not copy AI-introduced details into canon automatically.

## Three evolution approaches

| Approach | What changes | What connects the family |
|---|---|---|
| Maturation | Proportions, strength, one signature feature becomes more developed | Anatomy, markings and temperament |
| Specialisation | Body becomes suited to a new ecological role: swimmer, guardian, glider, burrower | Two strong visual anchors from the young form |
| Metamorphosis | Major silhouette/anatomy change or a new expression of the element | An unmistakable motif and a coherent story for the change |

Choose a final transformation per family; no forced wings, horns or extra limbs. Maturation alone is insufficient for the final reward. A dramatic silhouette can come from a crest, flowing mane, armoured back, fan tail or changed stance as well as flight. Plant its visible promise in the humble base. Visual inventions do not add abilities or alter gameplay.

## Evolution acceptance check

1. At equal display height, can someone tell the stages apart as solid silhouettes? If only the size changes, label the result maturation.
2. Which two features make the transformed creature belong to its young form? State them before generation.
3. What is the new visual idea? State it in one sentence, without "bigger", "older" or "more detailed".
4. Does that idea fit the species' canon and ecological role? Mark uncertain additions as proposals, not facts.
5. Are front, side and rear consistent enough to model? Is there a clear body under the elemental decoration?
6. Is it recognisable beside the player, in grey and at portrait size? Keep a scale check beside every accepted reference.

## Starter-family exploration

| Family | Existing canon | Proposed design exploration (not approved canon) |
|---|---|---|
| Cindercub → Blazefang | Wolf pup; evolved wolf with a mane that burns brighter with trust | A distinct sweeping ember-mane silhouette and a protective stance. Explore a crest of smouldering fur that frames the head/shoulders; retain spots and curled tail. Do not just elongate the pup. |
| Ripplet → Tidewyrm | River lizard → crocodilian; rides currents and calls up waves | Strong specialisation: long low swimmer, broad paddle tail and an unmistakable wave-shaped crest. Retain cheek/ring motifs, while changing the entire body rhythm. Crest is an art proposal, not a new power. |
| Mosshog → Thornback | Mossy boar → thorned herd guardian capable of splitting a fallen log | A broad living-thicket silhouette: woody shoulder armour and interlocking thorn growth, rather than isolated decorative spikes. Retain broad snout, brown speckles and moss. Ensure legs remain readable. |

The next reference test should be **Ripplet/Tidewyrm**, because the existing change from lizard to crocodilian already supports a stronger transformation. Compare at equal height and at proposed in-world scale. Do not generate a hundred portraits before proving both consistency and transformation.

## Clean production path

For each family, use the same packet:

- **Canon card:** species ID, family, element, dex text, current evolution relationship, source paths and forbidden contradictions.
- **Design brief:** evolution approach, two retained anchors, one new visual idea, anatomy and proportion notes. Separate canon from proposed features.
- **Exploration:** a small number of visibly different silhouettes. Pick one before requesting turnarounds; do not mix features from incompatible candidates.
- **Approved reference:** front/side/rear at matching scale, palette swatches, plain background and a human scale gauge. A pose sheet is not an animation sheet.
- **Implementation packet:** portrait, deliberate low-resolution sprite or mesh, pivots/footprint, animation requirements and acceptance evidence. Keep originals and provider provenance.

Track `candidate`, `revise`, `approved-reference` and `implemented` separately. The current six outputs are candidates. Approval of a reference does not imply that its sprite, rig, collisions or animation exist.

## Reusable generation brief

Fill these fields using actual game data before submission:

```text
Wildbond original creature: [SPECIES ID / NAME].
Canonical facts: [ANATOMY, ELEMENT, DEX, EVOLUTION].
Reference: [APPROVED YOUNG FORM OR FAMILY MODEL SHEET].
Evolution approach: [MATURATION / SPECIALISATION / METAMORPHOSIS].
Retain these two family anchors: [A], [B].
New silhouette idea: [ONE CONCRETE IDEA].
Proposed features, not new gameplay abilities: [FEATURES].
Avoid: mere enlargement, arbitrary copied franchise features,
oversized eyes, noisy texture, unexplained extra limbs.
Render: Wildbond storybook art, near-black ink #1e1a22,
light upper left, approved named palette ramps, readable anatomy.
One full-body creature, neutral three-quarter pose, uncropped,
plain isolated alpha, no glow outside the body, no ground shadow,
no labels, no scenery. This is a reference portrait, not an animation.
```

For actual pixel sprites, specify the target pixel dimensions and palette explicitly and verify the output; the pilot shows that "pixel art" in a prompt is insufficient. For future 3D, agree on the model sheet first; a generated PNG contains no mesh, rig or usable animation.
