# Wildbond environment sample

WB-ENVIRONMENT-SAMPLE — Codex / Evan, 2026-10-19. [PR #587](https://github.com/ecbarish/generations/pull/587), stacked on [#586](https://github.com/ecbarish/generations/pull/586). Playable source for review; not merged, exported or published.

## Play it

Open [Play Environment Sample.bat](../../../wildbond-godot/tests/environment_sample/Play%20Environment%20Sample.bat), or run Godot with `--path wildbond-godot res://tests/environment_sample/play.tscn`. The launcher uses Evan's installed Godot, with a `godot` PATH fallback on another machine. Normal chapter launcher is unchanged.

WASD/arrows walk, Shift runs, E interacts, Tab opens the local map and Esc opens the normal menu. **F6** cycles Ranch → Trail → Discovery review positions, except while a menu/dialogue/battle is open. **F7** hides/restores the interface for viewing. N/R/T retain night/rain/sunset controls. To compare the original visual treatment, append `-- --baseline` to the native Godot command; `-- --fallback` forces original/fallback presentation. After the launcher's scene argument, pass the same separator and flags. Review jumps are development controls, not earned travel abilities.

This is the actual connected opening chapter under a separate unsaved launch, with Mosshog selected for the walk. It uses a fresh uniquely named disposable profile path and `no_save=true` before the parent opens anything. It never selects the real profile and attempts to save remain unsaved. Leave and use the ordinary chapter launcher to resume saved play. There is no save/schema migration, forced sprint unlock, evolution or Mega gameplay change.

## What changed

The sample replaces the four-model tree lottery with one shared broadleaf mesh/material, restrained height/rotation variation and smaller foreground trees around the ranch approach. The original procedural tree geometry is cached and reused, including restrained canopy motion; its current rounded silhouette is a first-pass candidate, not final foliage art. One selected premade tree family can replace that mesh later without rewriting the map or game systems.

The ranch now has red timber walls/roof, while the other buildings share slate roofs, warm windows and simple timber/stone detailing. Procedural roof shingles and ground grain provide texture without a new texture dependency. Tree vertex colours are converted from authored sRGB values before lighting, avoiding an overbright foliage palette. Directional light and cooler ambient fill establish ground contact and path contrast; expensive SSAO, SSR and glow are disabled in this sample. A 48-metre tree visibility range bounds distant rendering.

The existing reachable `tw1` pickup clearing is dressed with a small bench, stump, mushrooms and flowers. Its tree overlap is deliberately removed. The bench stands on an already-solid forest-edge cell; low plants are decorative. No collision cells, destinations, branch gates or pickup rewards change. Larkburrow still requires its later abilities/badge; the unfinished Dewcut boundary and first-badge gate remain intact. The current sample refines the existing map rather than implementing #586's proposed new loop.

A thinner location/menu overlay gives the environment more screen space. Existing menus, battles, dialogue, healing and storage stay available. The inherited source still provides most buildings, all map geometry, movement/following, NPCs, encounters, saving contracts, weather, water, lighting framework and occlusion handling. Existing Kenney **CC0** plants/rocks/mushrooms are reused with their [original license](../../../wildbond-godot/tests/thornwood_environment/assets/kenney/License.txt) and [source manifest](../../../wildbond-godot/tests/thornwood_environment/assets/kenney/sources.json). Evan explicitly reaffirmed permission to use premade assets and systems; no purchase or outside-service generation was needed for this implementation.

## Native views

These are actual Godot captures using original/fallback artwork; no generated mockup is substituted. The installed private-art views were inspected separately and remain outside Git.

| View | Before | Candidate |
| --- | --- | --- |
| Ranch approach | [Original](captures/before-ranch.png) | [Red ranch / slate roofs](captures/ranch.png) |
| Trail threshold | [Original](captures/before-trail.png) | [Coherent woodland](captures/trail.png) |
| Existing discovery clearing | [Original](captures/before-discovery.png) | [Rest spot and pickup](captures/discovery.png) |

[Night](captures/night.png), [rain](captures/rain.png) and [Forward+ discovery](captures/discovery-forward.png) were also inspected. The two renderers differ in exposure/shadow/transparency appearance; both need human art review. This first pass is visibly simpler than the preceding generated direction board. That board's distant cities, intricate building art, creek composition and dense bespoke vegetation are not claimed built here. No generated image or new story clue is used in the game.

## Measurements, with limits

Actual local Godot **4.7.2**, NVIDIA **GeForce RTX 4090**, separate sequential processes, project window 1536×864, project logical canvas 384×216 with `canvas_items` stretch. Each of the same three fixed camera views settles before 90 measured frames. The baseline uses the inherited chapter dressing; the candidate includes all sample changes and its smaller HUD. These are whole-scene observations, not an isolated shader or tree microbenchmark.

| Renderer | View | Draw calls before → after | Visible primitives before → after | Scene process median ms before → after | Wall frame median ms before → after |
| --- | --- | --- | --- | --- | --- |
| gl_compatibility | ranch | 2090 → 925 | 101,286 → 116,356 | 0.998 → 1.002 | 4.163 → 4.168 |
| gl_compatibility | trail | 2045 → 827 | 89,478 → 136,550 | 0.957 → 0.910 | 4.167 → 4.164 |
| gl_compatibility | discovery | 1984 → 871 | 84,848 → 111,420 | 0.980 → 1.027 | 4.165 → 4.164 |
| forward_plus | ranch | 827 → 300 | 101,286 → 116,356 | 0.888 → 0.874 | 4.164 → 4.161 |
| forward_plus | trail | 777 → 264 | 89,478 → 136,550 | 0.850 → 0.861 | 4.164 → 4.162 |
| forward_plus | discovery | 760 → 276 | 84,848 → 111,420 | 0.857 → 0.957 | 4.165 → 4.163 |

The four [raw measurement files](measurements/) also retain p95 values. Draw-call and primitive counts are the visible viewport counters; they do not account for every shadow pass or GPU cost. The shared tree mesh and simpler roof treatment reduce draw calls substantially, while the new rounded canopies **increase visible triangles**. Frame times are approximately 4.16 ms in both versions, consistent with local frame pacing; this does not demonstrate a frame-rate improvement or prove the GPU has spare capacity on weaker hardware. Process measurements time the inherited scene `_process` call, not the entire engine or GPU. No lower-end, phone, sustained thermal, memory, loading-time or human navigation benchmark is claimed. Repeated local observations are not a hardware target guarantee.

## Verification

Candidate capture/check runner: **35 passed / 0 failed** on Compatibility and Forward+, with both fallback and actual installed private art. Matching baseline: **31 passed / 0 failed** on both renderers. The extra candidate checks cover shared mesh, effect budget, dressing and the cleared bench location. Other checks cover the exact unchanged collision grid, BFS reachability/returns to ranch, inn, trail, pickup and Gate Loft, closed later boundaries, real held-key walking/follower movement, F6 modal protection, F7 restoration, one-time pickup reward, healing-room entry/return and refusal to create a save even after progress.

```powershell
& $env:GODOT --path wildbond-godot --rendering-method gl_compatibility --script res://tests/environment_sample/capture.gd -- C:/temp/wb-env-candidate --fallback
& $env:GODOT --path wildbond-godot --rendering-method forward_plus --script res://tests/environment_sample/capture.gd -- C:/temp/wb-env-forward --fallback
# Add --baseline to measure the inherited treatment; omit --fallback only with an installed private pack.
```

The unchanged full repository runner passes **all 28 suites**, including Wildbond **26,976/0**, Starfall **488/0**, **189** catalogue species, **23** unchanged save names and **21** agent-context checks. It was invoked through the existing quiet helper so browser test speech stayed muted. All **68 local documentation links**, the four raw measurement JSON files and whitespace checks pass. These focused checks do not replace a first-time-player test, final art acceptance, a lower-end benchmark or independent review. This audition's source lives only under `wildbond-godot/tests/environment_sample/`; it does not alter the production game or public web pack.

## Next decision

Review the in-engine style and navigation, then choose a stronger premade environment kit or targeted art improvements where this sample falls short. Do not spread these rounded trees across the project merely because they are consistent. Keep the existing working systems and measured opening map; improve one scene until its look is worth reusing. The mentor/tutorial and early sprint implementation remains the next gameplay step from [the opening plan](../../plans/wildbond-first-warden.md).
