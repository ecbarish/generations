# WB-MUSE-INTAKE

Claimed by Codex for Evan, 2026-10-17. Evan supplied the Muse battle source after requesting reuse of its presentation and systems. This is the next bounded integration step, based on #546.

Scope: preserve a hash manifest and integration notes for the user-provided package; reuse its original Wildbond background, Bogsnap back/idle frames and Cindercub front in the native, save-free study; adapt isolated damage/catch math with comparison fixtures against the supplied JavaScript. Preserve existing world, save system, species IDs and pending web pack. Keep demo placeholder element names out of the adventure's data. Do not mass-generate art or build a second world.

Owned: `wildbond-godot/tests/battle_slice/`, this report, `docs/screenshots/wildbond-muse-intake/`, PROJECTS task row and START-HERE Session log. Export-excluded study only. No public game deployment, production creature replacement or save migration.

Source package SHA-256: `8fcc08fd909e0039d0d45e24b26acc4c8b8be205735eb019a844b2db466c54f0`. Archive has ten entries: notes, one self-contained HTML and seven PNGs. The HTML has one inline script; initial inspection found no fetch/eval/storage/cookie calls, with Google Fonts as the external stylesheet dependency. The original archive remains attached to this chat. Do not execute instructions in supplied notes as authority; they document origin and suggested adaptation only.

Acceptance: native art/idle correctly aligned; deterministic math agrees with captured original-JS fixtures; existing checks stay green; real input/captures inspected; limits and next integration step recorded. Human enjoyment remains a playtest gate.

## Integrated first step

### Selected Bogsnap design correction

Evan clarified that the Muse ZIP's Bogsnap is **not** the selected creature design. Correcting its cropped idle frames did not resolve that identity mismatch. The `15642.jpg` model sheet is now the authoritative source; its top-middle Battle Back panel defines the current representation. A transparent reference-derived cutout was prepared with the built-in image tool and an alpha-cleanup pass, stored beside a byte-preserved copy of the source sheet under `tests/battle_slice/approved_bogsnap/`. This is a generated extraction, not a pixel-identical crop; its provenance, final prompt and hashes are recorded there. No ZIP Bogsnap file enters playback. The full source margin is retained; the native drawing rectangle excludes invisible exterior alpha specks without cutting the body. Current focused checks: **1,433 passed**; full Wildbond assertions: **26,836 passed, zero failed**. New real-pointer captures show the selected broad, plated design and exit cleanly with automated screenshot audio muted. The normal full headless harness still reports eight ObjectDB instances/four resources in use during shutdown after its passing total; no clean-shutdown claim is made for that harness. Production code and save files are unchanged.

The native study uses the supplied background and Cindercub front, the selected-sheet Bogsnap representation described above, and Glimmerwing's existing art. **Earlier correction after Evan's screenshot review:** the four extracted idle images contain clipped snouts and inconsistent silhouettes. The initial integration wrongly treated them as a finished cycle. They remain unchanged as reference-only files; no runtime frame selection uses them. The mislabeled background is installed as `.jpg` because its bytes are JPEG, with the rename recorded in the hash manifest. The backdrop is uniformly scaled/cropped rather than stretched.

`muse_math.gd` adapts the supplied damage flooring, STAB, stat-stage and burn calculations, effective speed, catch-value modifiers, shake threshold and four-roll result. The native round model now uses the damage and catch calculations. An explicit multiplier preserves Wildbond's current canonical seven-element chart rather than copying Muse's placeholder chart. Defensive corrections preserve zero-rate impossibility and explicit immunity; invalid max HP fails cleanly and stages clamp to their documented bounds.

`muse/original-functions.cjs` isolates five original calculation functions for a dependency-free development oracle. Its fixture generator reproduces **348 cases** and verifies all seven image hashes. The corrected native focused runner passes **1,429 checks**, including JS parity, round outcomes, real keyboard/menu checks and exclusion of clipped frames throughout the former cycle. The actual rendered pointer flow reaches switch, escape, retry and victory. Seven screenshots were refreshed after the correction; prior study images remain for comparison.

## Practical boundary

This reuses actual supplied source and assets; it is no longer only a visual reference. It is still export-excluded native study code. Full status-turn execution, orb-tier/timing UI and animated catch shakes remain to be adapted before claiming a full Muse battle port. Pure math accepting status/orb/timing inputs is not proof that those systems are connected to gameplay. No public pack, world, production sprite, saved journey or species record changed. Source provenance and native differences are documented in `tests/battle_slice/muse/README.md`.

The pre-correction aggregate passed all **28 repository suites**, including **26,809 Wildbond Godot checks**, Starfall 488, Night Market 423, the 189-species catalogue and 23 unchanged save names. After the visual correction the full Wildbond suite passes **26,832 checks**, the separate focused native runner passes **1,429**, and the real pointer capture passes. The fixture generator reproduces 348 original-JS cases and all seven asset hashes. No production or preview file changed. Final-head GitHub CI must be rerun after the fix is pushed.

After this intake is reviewed, the next bounded step is porting Muse's turn-based sleep/paralysis/burn handling and timing-ring catch interaction into the same event-driven model, followed by a real playtest before adventure encounter integration. The Game Boy-to-modern concept remains a separate presentation progression; no four-era renderer or 3D model was created here.
