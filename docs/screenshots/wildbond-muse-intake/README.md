# Muse intake: native rendering

Seven actual Godot 4.7.2 Compatibility-renderer captures at 1536×864: commands, moves, hit, party, switched, escaped and victory. Captured with `tests/battle_slice/capture.gd`, which sends real pointer presses/releases through Fight, move selection, switching, escape, retry and a complete victory. No mockup or generated screenshot. Existing pre-intake images remain in `../wildbond-battle-slice/` for comparison.

The supplied meadow is scaled uniformly and cropped vertically to align the painted platforms. Captures were refreshed after Evan flagged Bogsnap's fragmented appearance. The supplied idle extracts contain clipped snouts and inconsistent silhouettes and are now excluded from playback. Bogsnap uses the complete resting back with gentle whole-sprite motion; all source files remain unchanged. Cindercub and Glimmerwing retain the older visual bar. This is an isolated native prototype, not the public game or physical-phone evidence.
