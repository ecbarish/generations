# Stillmaw production handoff
WB-BOGSNAP-FAMILY · Codex / root for Evan · 2026-10-20

Evan approved v7's Mega direction and a Tyranitar-tier family. The approved appearance and power target are decisions; this document defines the next asset batch and the remaining gameplay work. No runtime file, saved creature or existing approved sprite is replaced by this study.

## Inputs and boundaries
Use the reference filenames and SHA-256 values in [production-contract.json](production-contract.json). The read-only checker verifies their bytes.

| Form | Authoritative direction | Preserve |
|---|---|---|
| Boglet | v1 early-form panel only | Juvenile face, short body, sparse scutes; not the rejected v1 final/Mega |
| Bogsnap | Established selected model sheet, linked in README; v1 family panel is a continuity reference | Stable species identity, squat crocodile, broad snout, yellow eye, cream underside and heavy tail |
| Stillmaw | Normal panel of v5 | C's heavy jaw/body/haunches, A's natural overlapping scales; no costume armour |
| Mega Stillmaw | Mega panel of v7 | Taller athletic kaiju with powerful hips, heavy tail, three principal branching reed masses and restrained water flow |

The v7 normal panel is a comparison illustration, not a replacement for v5's normal. V6 reservoir anatomy and v2/v3 rejected armour/rounded designs are not production sources. No further exploration or roster batch is needed before the following small asset batch.

## First deliverable: four static views
One named asset owner claims only a new output directory; the runtime owner supplies the destination and exact integration base before wiring. Keep this first batch separate from animation and gameplay.

1. Stillmaw front three-quarter, full body.
2. Stillmaw rear three-quarter, matching the same anatomy.
3. Mega Stillmaw front three-quarter.
4. Mega Stillmaw rear three-quarter, with the same three dorsal growths and tail/water path as the front.

Use genuine transparent alpha, complete feet/claws/tail, no labels, ground, cast-shadow plate, decorative frame or glow. Keep the original generated masters, exact prompts and source hashes. A reference sheet must not be sliced into four finished sprites.

A clean source cutout may be large; judge its actual game presentation at 64 logical pixels high and in the current 78×64 battle portrait bounds. The current starter presentation scales uniformly to fit both dimensions and places the recorded foot anchor at the scene's contact point. A long tail must fit without shrinking the face beyond readability. Inspect the real renderer rather than assuming a large master will read well.

For each source record filename, SHA-256, image dimensions, body/ink rectangle, visible foot/contact anchor, source facing direction and intended flip. Front/back need individual anchors; do not use canvas centre or opaque bounds as a guessed contact point. Preserve full source files; store crop/anchor choices as metadata.

## Visual acceptance
- Compare the normal against v5 and Mega against v7 at equal contact baseline, then at actual battle size.
- Normal remains a mature armoured animal; Mega's upright posture, reed growth and water path create a new silhouette. Do not simply stretch the normal.
- Keep the broad alligator snout, yellow eye and cream underside through both views. Rear art must not invent a new spine or tail geometry.
- Simplify scale texture and small leaf tips at native size. The three principal botanical masses matter more than individual twigs.
- Water follows the body and tail. It must remain readable against both dark foliage and pale battle ground; no continuous glow, orbiting ring or foliage covering the face.
- Inspect on light and dark backgrounds and a checkerboard for opaque corners, alpha haze, clipped tails and transparent holes in body shading.
- Approved concept does not automatically approve a generated front/back pair. Record visual review before animation.

Only after those four views pass should an owner add restrained idle/blink/recoil, then the supported overworld directions. Current starter art has a 24-frame contract; these new static views do not satisfy it and must not be registered as an animated atlas.

## Gameplay integration: a later owned task
Stillmaw candidates: 105/135/125/65/110/60 = 600.
Mega candidates: 105/165/155/75/135/65 = 700.
Order: HP / Attack / Defense / Sp.Atk / Sp.Def / Speed. Mega adds100, preserves HP and replaces the normal ability. Starter budgets remain530/630; Boglet/Bogsnap remain310/405.

Keep the current proposed16/36 levels explicitly provisional. A600-tier final needs deliberate maturation/availability/learnset review and reconciliation with Wildbond's level-plus-bond rules. Do not treat the old level18 legacy edge or the proposed36 edge as settled. Do not raise the first Warden's existing Bogsnap strength without playing all three starter matchups.

The playable chapter does not yet implement the proposed ability/critical-hit/evolution/Mega features. Shell Armor/Thick Fat are candidates with the contracts in README, not active passives. Higher stats, typing and defensive abilities must be assessed together; total600 alone does not establish Tyranitar-equivalent matchup power.

Preserve saved bogsnap/stillmaw IDs and individuals. Do not demote existing Bogsnap to Boglet, alter levels, refill HP/PP, change starter ownership or persist temporary Mega as a species. A save change needs the existing explicit save approval and migration checks.

## Cheap repeatable checks
From any checkout root:

```text
node docs/art/bogsnap-family/check-study.cjs
node docs/art/bogsnap-family/check-study.test.cjs
node docs/art/bogsnap-family/check-study.cjs --require-runtime
```

Normal mode exits0 only for a valid study. It reads data/references and writes no files. The regression command checks that known mistakes are rejected. The final command intentionally exits2 while runtime work remains; its JSON lists the blockers. It must not be wired into ordinary all-green CI as if this study were expected to be playable.

These checks establish consistent data and reference provenance. They do not measure art quality, alpha, animation consistency, game difficulty, saves or fun. Runtime integration still needs the chapter owner's native checks and a first-time-player session.
