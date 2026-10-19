# Softer ground for Wildbond

WB-SOFT-GROUND, Codex / Evan, 2026-10-19. [PR #591](https://github.com/ecbarish/generations/pull/591), stacked on #589. Unsaved native visual audition; not merged or published.

Open [Play Soft Ground.bat](../../../wildbond-godot/tests/soft_ground/Play%20Soft%20Ground.bat). The expanded chapter, original partner, F6 viewpoints, F7 interface toggle and normal controls are retained. Add `-- --hard-edges` after the scene argument for the previous terrain, or `-- --fallback` for original/fallback art. The real player profile is never selected or written.

## Treatment

The dirt path now feathers into grass with gently irregular edges and softened corners. Broad colour variation replaces the abrupt per-cell ground colour blocks. The warm earth and cool grass sit under the existing directional lighting and sharp contact shadows; sprites, buildings and the rest of the image are not blurred.

A small single-channel R8 mask is generated directly from the existing map's path/door glyphs. Bilinear sampling, smooth interpolation and bounded world-space noise blend two earthy surface colours. Colour inputs are explicitly converted to linear values for lighting. This adds one shared terrain material/texture, with no new geometry or paid/external asset dependency. Collision, paths, encounters, pickups, doors, NPCs, saves and story are unchanged. Existing encounter grass meshes remain visible; the ground under them now uses the same regional grass palette.

Classic WoW is an art-direction reference here: earthy colours, broad hand-painted-style variation, organic boundaries and grounded light. No Blizzard assets or browser-engine implementation is imported. This does not finish rounded architecture, foliage detail or terrain elevation; it establishes one reusable ground treatment.

| View | Before | After |
| --- | --- | --- |
| Ranch | [Hard edges](captures/hard-ranch.png) | [Soft edges](captures/soft-ranch.png) |
| Village | [Hard edges](captures/hard-village.png) | [Soft edges](captures/soft-village.png) |
| Trail | [Hard edges](captures/hard-trail.png) | [Soft edges](captures/soft-trail.png) |

These are actual Godot fallback captures. Private-art captures were inspected separately and remain outside Git. Native checks pass **53/0** on both Compatibility and Forward+, with fallback and installed private art. The hard-edge comparison passes **51/0** on both renderers. The inherited expanded-map checks verify collision, outside-village preservation, every moved interaction, routes/returns, later boundaries, follower, controls, pickup reward, healing and no-save behavior. Additional checks verify the compact mask and installed material. Human art acceptance is separate.

[Raw fixed-camera measurements](measurements/) retain 90-frame wall/scene timing and visible draw counters for each treatment. They were captured sequentially on Godot4.7.2/RTX4090 with the existing1536×864 window and384×216 logical canvas. Local pacing is not a low-end/mobile or GPU-cost guarantee; the new fragment sampling still has a cost even with unchanged geometry.

```powershell
& $env:GODOT --path wildbond-godot --rendering-method gl_compatibility --script res://tests/soft_ground/capture.gd -- C:/temp/wb-soft --fallback
# Repeat with forward_plus. Add --hard-edges for the prior terrain treatment.
```

All **28 repository suites pass**, including Wildbond26,976/0, Starfall488/0,189species,23unchanged save names and21context checks. All64local documentation links, raw JSON and whitespace checks pass. Runtime changes are confined to `tests/soft_ground/`; no saved-main integration, pack, version or release change is included.

## Process direction retained

Evan agreed that focused tools should reduce repeated work and preserve consistency. The next bounded tooling priority is a single command wrapping the existing chapter checks/captures, followed by a shared map-placement record and a current branch/dependency/launcher summary. Reuse existing tools; do not build a second workbench or a broad production platform. Those tools are not claimed implemented or assigned by this visual task.
