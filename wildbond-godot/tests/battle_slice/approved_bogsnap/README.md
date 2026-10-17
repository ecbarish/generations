# Bogsnap: Evan's selected design

Evan corrected the intake on 2026-10-17: **the Bogsnap in Muse's ZIP is not the selected creature design**. The attached `15642.jpg` model sheet is authoritative for this native study. The large **Battle Back** panel at the top middle supplies the pose and identity: broad squat body, mossy overlapping plates, cream belly/throat, heavy curved tail, short forelimb with dark claws, broad snout and yellow eye. Preserve that identity when preparing other views and animation.

`approved-model-sheet.jpg` is a byte-for-byte copy of Evan's attachment. SHA-256: `f7bfee867a10c3bc2bb5cdafc4af0a898e0548a998c3ba828a8a87ad4767111b`.

`battle-back-v1.png` is a transparent **reference-derived cutout prepared with the built-in image_gen tool**, with a second alpha-cleanup pass. It is not a pixel-identical deterministic crop of the JPEG. No alternate design was requested. SHA-256: `48ee37d4c84217680e22610e42df464b00592d781bd4ce107c05ddb69a72d222`. Original generated output remains in Codex generated images; this copy is the version consumed by the study. No CLI/API key or paid external generation service was used.

The drawing is centred with transparent margins. The native source rectangle `(114, 46, 1330, 956)` includes the whole body with margin and excludes invisible exterior alpha specks; the source file is not modified. It is fitted uniformly to 64 logical pixels tall with the same foot anchor. A gentle whole-sprite bob/recoil remains optional; **no skeletal or frame animation is claimed**. Production art/palette approval and human visual acceptance remain separate.

The old ZIP back and idle extracts remain byte-preserved references under `../muse/`, but no runtime frame selection uses them. Current captures are under `docs/screenshots/wildbond-muse-intake/`. The public game and saved adventure are unchanged.

## Prompt set

Initial request: extract only the top-middle Battle Back pose from the supplied model sheet, preserving its broad rear three-quarter silhouette, anatomy, moss plates, cream belly, heavy tail, yellow eye, palette and pixel-art shading; remove panel, labels and other creatures; keep the complete creature on transparent alpha with margins. The exact source panel and exclusions are recorded above.

Final cleanup prompt (built-in image_gen, transparent background enabled):

> Precise background removal / alpha repair ONLY. Keep this existing Bogsnap creature drawing and pose exactly, no redesign, no rearrangement, no different illustration. Remove ALL the diffuse olive glow, soft halo, vignette and black background around the creature. Output a clean sprite cutout on actual fully transparent alpha. All pixels belonging to the creature, including its black outlines, darkest body shadows, dark spots, tail, leaves, cream belly, mouth, teeth, eye and claws, must be fully opaque. Do not punch transparency holes into any dark interior body region. Outside the hard silhouette must be completely transparent, no semitransparent fog or rim. Preserve the present complete broad rear three-quarter silhouette facing right and all proportions, colors and crisp pixel-art features. Keep generous transparent margin at every edge, with full tail, claws and dorsal plates inside the canvas. No shadow, no ground, no text, no new elements. This is a technical alpha cleanup of the existing sprite only.
