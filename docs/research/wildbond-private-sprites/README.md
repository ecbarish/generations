# Wildbond private sprite setup and native clearing

WB-PRIVATE-SPRITES, Codex / Evan, 2026-10-17. Stacks on #547. [Play/setup instructions](../../../wildbond-godot/tests/private_sprites/README.md).

## What is working

The private pilot is installed outside Git: **Pidgey, Vulpix and Wooper**, six Platinum front/back battle views and six eight-direction Idle/Walk animations. Twenty-six raw source files include XML, shadow anchors, individual credits and notices. Upstream revisions are pinned; offline verification checks exact hashes and geometry. Changed cached files are repaired from their pinned sources on setup rerun.

A separately launched **native 3D clearing** has a pitched follow camera, the existing tamer figure, selected-sheet Bogsnap companion, imported creature animation, movement/trunk/pond boundaries, day/night and rain controls. The terrain/trees are simple procedural meshes, not final environment art or downloaded Kenney assets.

Walk near the creature and enter the existing turn-based battle study. All three species use their actual imported sprites. Fight, switch, healing, catch results and escape reuse the prior round engine. Escape, victory and catch return to the same world position. Captures are practice outcomes only; no creature is added to an adventure save or persistent party. Imported combatants intentionally use study proxy stats and Wildbond's seven-element aliases; full canonical Pokemon rules are not claimed.

The optional loader rejects missing files, changed hashes, traversal paths, attempts to replace Wildbond species, invalid image bounds, grid/timing/anchor metadata and unsupported manifests. Failed replacement loads clear stale imported textures. Without a pack the clearing uses original Cindercub art and remains playable.

## Validation

- All **28 repository suites pass**, including **26,867 Wildbond assertions**, Starfall 488, Night Market 423 and 23 unchanged save names. The new portable malformed-pack checks run in the normal Wildbond suite. Browser/game production code and public packs are untouched.
- Focused final runner: **345 passed, 0 failed** with the installed pack; **57 passed, 0 failed** with no private pack. Real atlas rows, bounds and anchors are checked across all three species and both animation states. Actual game outcomes cover escape, victory and successful catch returning to the same position. The catch fixture uses a discovered deterministic seed; capture odds were not altered to make the check pass.
- The installer verifies **26 pinned file hashes**, six battle images and six directional animation grids. A disposable pack copy with a changed PNG is rejected offline; rerunning setup restores the original source hash. This does not alter the installed pack.
- Native Compatibility-renderer capture uses real held-key W input and actual pointer controls through Encounter, Fight, moves, Run and Return. Next selects Vulpix and Wooper and captures their actual battles. All private species battle screenshots were inspected; initial overexposure/HUD contrast was corrected before final captures. Native capture and focused runners exit cleanly.
- Public evidence uses only the original-creature fallback: [day](captures/clearing-day.png), [battle](captures/battle.png), [return](captures/returned.png), [night/rain](captures/night-rain.png). Imported Pokemon screenshots stay in the private pack's captures directory and are not published here.
- Whitespace and scope checked. The locator is ignored. No imported source PNG or machine-local path is tracked. Tests and launchers are excluded by existing Web/Windows export rules; the old public pack remains unchanged.

## Limits and next step

This is a working **save-free native presentation prototype**, not a replacement of the adventure or browser build. The newly approved starter concepts are preserved; they still need production front/back/walk frames. Bogsnap uses its selected single back painting without directional animation. No rich terrain, final water/reflections, camera-occluder fading, touch controls, mobile/browser performance or human enjoyment acceptance is claimed.

Next, improve the clearing's environment with suitable licensed assets and the approved original companion animation, then integrate the validated presentation/data boundary with the real journey in a separate step. Existing species/evolution IDs, quest progression, saves, versions and public export are unchanged.
