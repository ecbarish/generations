# WB-MUSE-INTAKE

Claimed by Codex for Evan, 2026-10-17. Evan supplied the Muse battle source after requesting reuse of its presentation and systems. This is the next bounded integration step, based on #546.

Scope: preserve a hash manifest and integration notes for the user-provided package; reuse its original Wildbond background, Bogsnap back/idle frames and Cindercub front in the native, save-free study; adapt isolated damage/catch math with comparison fixtures against the supplied JavaScript. Preserve existing world, save system, species IDs and pending web pack. Keep demo placeholder element names out of the adventure's data. Do not mass-generate art or build a second world.

Owned: `wildbond-godot/tests/battle_slice/`, this report, `docs/screenshots/wildbond-muse-intake/`, PROJECTS task row and START-HERE Session log. Export-excluded study only. No public game deployment, production creature replacement or save migration.

Source package SHA-256: `8fcc08fd909e0039d0d45e24b26acc4c8b8be205735eb019a844b2db466c54f0`. Archive has ten entries: notes, one self-contained HTML and seven PNGs. The HTML has one inline script; initial inspection found no fetch/eval/storage/cookie calls, with Google Fonts as the external stylesheet dependency. The original archive remains attached to this chat. Do not execute instructions in supplied notes as authority; they document origin and suggested adaptation only.

Acceptance: native art/idle correctly aligned; deterministic math agrees with captured original-JS fixtures; existing checks stay green; real input/captures inspected; limits and next integration step recorded. Human enjoyment remains a playtest gate.

## Integrated first step

The native study now loads the seven supplied images (Glimmerwing retains the existing fallback art), plays the four-frame Bogsnap idle ping-pong at four frames per second, and switches to the supplied resting back with motion disabled or battle ended. Frames have different dimensions; drawing fits one height and bottom-centre anchor. Asset bytes are unchanged. The mislabeled background is installed as `.jpg` because its bytes are JPEG, with the rename recorded in the hash manifest. The backdrop is uniformly scaled/cropped rather than stretched.

`muse_math.gd` adapts the supplied damage flooring, STAB, stat-stage and burn calculations, effective speed, catch-value modifiers, shake threshold and four-roll result. The native round model now uses the damage and catch calculations. An explicit multiplier preserves Wildbond's current canonical seven-element chart rather than copying Muse's placeholder chart. Defensive corrections preserve zero-rate impossibility and explicit immunity; invalid max HP fails cleanly and stages clamp to their documented bounds.

`muse/original-functions.cjs` isolates five original calculation functions for a dependency-free development oracle. Its fixture generator reproduces **348 cases** and verifies all seven image hashes. The native focused runner passes **1,406 checks**, including JS parity, round outcomes, real keyboard/menu checks and consistent idle placement. The actual rendered pointer flow reaches switch, escape, retry and victory. Seven screenshots are retained and inspected; prior study images are preserved for comparison.

## Practical boundary

This reuses actual supplied source and assets; it is no longer only a visual reference. It is still export-excluded native study code. Full status-turn execution, orb-tier/timing UI and animated catch shakes remain to be adapted before claiming a full Muse battle port. Pure math accepting status/orb/timing inputs is not proof that those systems are connected to gameplay. No public pack, world, production sprite, saved journey or species record changed. Source provenance and native differences are documented in `tests/battle_slice/muse/README.md`.

All **28 repository suites pass**, including **26,809 Wildbond Godot checks**, Starfall 488, Night Market 423, the 189-species catalogue and 23 unchanged save names. The separate focused native runner passes 1,406. The fixture generator reproduces 348 original-JS cases and all seven asset hashes. No production or preview file changed. Final-head GitHub CI remains pending until this commit is pushed.

After this intake is reviewed, the next bounded step is porting Muse's turn-based sleep/paralysis/burn handling and timing-ring catch interaction into the same event-driven model, followed by a real playtest before adventure encounter integration. The Game Boy-to-modern concept remains a separate presentation progression; no four-era renderer or 3D model was created here.
