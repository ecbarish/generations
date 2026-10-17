# WB-BATTLE-SLICE: a playable round battle

Claimed by Codex for Evan, 2026-10-17, after Evan approved a sprite battle first and a separate two-creature 3D comparison later. Explicit current request; not an expansion of the old cycle.

Build one isolated, save-free Godot battle scene using existing Wildbond sprites and species. Separate deterministic combat state from drawing. First scope: one active partner versus one wild foe, move accuracy and round order, switching, a berry, catching, escape, and a result/retry screen. No new story, copied Pokemon files, purchases or mass art generation.

Owned paths: `wildbond-godot/tests/battle_slice/`, this report, PROJECTS task row and START-HERE Session log. The scene is a native playable prototype in the export-excluded test area: it does not replace the saved adventure or contend with #544's pending web pack. Base on #544 to retain #491 and #545 fixes. After hands-on acceptance, promote the rules and hook into encounters in a separate reviewed step.

Done when the standalone scene is playable with keyboard and pointer, combat checks cover real outcome and invalid-action boundaries, screenshots are inspected, and the existing aggregate remains green. A human must still judge enjoyment.
