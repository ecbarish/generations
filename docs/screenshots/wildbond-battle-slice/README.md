# Native battle study evidence

Captured from the real Godot 4.7.2 Compatibility renderer at 1536×864, with the 384×216 game viewport scaled evenly. No generated screenshot or browser mockup. All seven screens inspected.

`wildbond-godot/tests/battle_slice/capture.gd` sends actual pointer press/release events to native buttons and asserts that they open moves, start a round, open/select a party member, escape, retry and win by repeated legal moves. It saves commands, moves, hit, party, switched, escaped and victory screens. The focused runner separately sends a real Enter press/release to Fight and verifies command rectangles are inside the viewport and do not overlap.

This is desktop rendering and input evidence. No physical phone, mobile browser, full adventure or human enjoyment acceptance is claimed. Existing sprite paintings and sounds are reused; the simple background is prototype art.
