# Thornwood atmosphere slice

WB-THORNWOOD-LIGHT, Codex / Evan, 2026-10-17. Stacks on [#549](https://github.com/ecbarish/generations/pull/549); implementation is [#550](https://github.com/ecbarish/generations/pull/550). Evan explicitly prioritized the sprite-in-3D environment of [Pokemon Battle Advanced](https://thedaigan.itch.io/pba). This delivers a native, walkable Thornwood study with that direction: layered 3D trees and foliage, a curved trail, a rock-lined animated pond, warm sunlight/cool shadows, sunset, fog, night lanterns/fireflies, and rain with wet ground and pond splash rings.

## Play

Run [Play Thornwood Atmosphere.bat](../../../wildbond-godot/tests/thornwood_environment/Play%20Thornwood%20Atmosphere.bat). WASD/Arrows walk, Shift runs, E meets a creature, B opens the bag, T changes sunset angle, N toggles night, R toggles rain. The scene reuses the private clearing's animated actors, party/bag and practice encounter/return loop. Trees fade when they obstruct the player. Pond and trunk collision keep the walkable route clear.

The external private sprite pack is optional. With it, the imported trainer/Pokemon appear; without it, original actors and Cindercub provide a reviewable fallback. All committed screenshots use that fallback. This study never reads or writes adventure saves. It stays in export-excluded `tests/`; the public PCK and production maps, quests, species and evolution assignments remain unchanged.

## Reused assets and authored work

Fifteen unchanged GLBs come from [Kenney Nature Kit](https://kenney.nl/assets/nature-kit), CC0. The downloaded archive's supplied notice identifies **Nature Kit 2.1, 29-04-2020**; the creator page lists 1.0, so the supplied archive notice and file hashes are the provenance record. The original notice is retained beside the models and in `licenses/Kenney-NatureKit-CC0.txt`. The adjacent `sources.json` records the archive URL/hash, each original model's bytes/hash and runtime adjustments. Materials receive forest palettes, nonmetallic wood/foliage and roughness at runtime; source bytes are unchanged.

The layout, terrain/water shaders, lighting, occlusion fading, lanterns, fireflies and splash-ring placement are authored for Wildbond. PBA's creator credits Godot 4.7, Kenney packs and HGSS models. No PBA source, custom shader or HGSS model is copied here, and exact parity is not claimed.

## Verification

- All 28 repository suites passed through the quiet test launcher before adding the atmosphere checks; the final expanded Godot suite passes **26,927 assertions, 0 failures**. The other 27 suites have no subsequent gameplay changes. Existing save checks pass; this scene introduces no save fields.
- **35 focused assertions** cover all 15 model hashes, populated scenery, water/fog/shadows, camera obstruction fading, overlay bounds, walking and pond collision, night/rain restoration, the bag and exact-position encounter return. They run from the normal Godot suite as well as the focused runner.
- Native Forward+ (Vulkan, RTX 4090) and Compatibility (OpenGL, RTX 4090) both completed captures with held-key movement and pointer-driven encounter, Run and return. Both exited cleanly. These are local desktop checks, not a lower-end performance benchmark.
- Captures: [day](captures/day.png), [walking](captures/walking.png), [sunset](captures/sunset.png), [brook](captures/brook.png), [night](captures/night.png), [night rain](captures/night-rain.png), [rain](captures/rain.png), [return](captures/returned.png). Matching Compatibility captures are in [compatibility/](compatibility/).

See the [scene README](../../../wildbond-godot/tests/thornwood_environment/README.md) for exact check/capture commands. The quiet repository launcher suppresses native speech only in its test contexts, avoiding repeated Little Ranch test narration.

## Limits and next step

Forward+ enables SSAO, screen-space reflection and glow; Compatibility disables those effects. Water is opaque and animated, with shore colour and sky/screen reflections. It has no underwater view, refraction, swimming, current or planar reflection. Fog is distance fog, without volumetric shafts. Lanterns/fireflies/splashes use simple geometry. Browser/mobile delivery and performance are unvalidated.

This is a first visual slice, with no adventure integration, ambient audio, town buildings or new battle mechanics. Next, have Evan walk the scene and choose the camera/lighting feel, then apply the accepted environment treatment to one existing Thornwood route while preserving its collision, encounters, NPCs, quest triggers and save coordinates. Keep that integration bounded before expanding to Saltmarsh or Emberfall.
