# Muse intake: native rendering

Seven actual Godot 4.7.2 Compatibility-renderer captures at 1536×864: commands, moves, hit, party, switched, escaped and victory. Captured with `tests/battle_slice/capture.gd`, which sends real pointer presses/releases through Fight, move selection, switching, escape, retry and a complete victory. No mockup or generated screenshot. Existing pre-intake images remain in `../wildbond-battle-slice/` for comparison.

The supplied meadow is scaled uniformly and cropped vertically to align the painted platforms. Bogsnap's four supplied idle poses cycle at four frames per second with one fitted height and foot anchor. Source poses differ in silhouette; alignment does not constitute animation/art acceptance. Cindercub and Glimmerwing retain the older visual bar. This is an isolated native prototype, not the public game or physical-phone evidence.
