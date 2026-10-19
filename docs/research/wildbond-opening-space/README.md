# A village with room to breathe

WB-OPENING-SPACE, Codex / Evan, 2026-10-19. [PR #589](https://github.com/ecbarish/generations/pull/589), stacked on #587. Playable layout audition, not merged or published.

## Play

Open [Play Spacious Opening.bat](../../../wildbond-godot/tests/opening_space/Play%20Spacious%20Opening.bat). WASD/arrows walk, Shift runs, E interacts, Tab opens the local map, Esc opens the menu. F6 cycles ranch, village crossroads, shop approach, trail and discovery views. F7 hides/restores the interface. Night/rain/sunset controls remain N/R/T.

This launches the connected development chapter fresh with Mosshog, using the inherited unique disposable profile path with writes disabled. It never opens the real profile. The previous sample launcher and saved chapter remain intact. `-- --compact` after the scene argument reproduces the prior layout; `-- --fallback` selects original/fallback art.

## Spatial change

Larkhaven's envelope grows from **24×14 cells** to **38×26 cells**, about **30×17.5 metres → 47.5×32.5 metres** at the existing 1.25-metre cell size. That is roughly 2.94 times the village footprint, with unchanged character, building and interaction scales. This is authored rearrangement of the village and its paths, not uniform scaling of the world.

The inn moves to the northwest, the shop to the northeast and the ranch to the southwest. Buildings have separate approaches and yards. The paddock has a larger real fenced perimeter and accessible entrance; a south path connects it and the existing village pickup. The north trail and west Millgrass connection keep their established landing cells. Planting sits at selected edges, leaving open views and room around people. The camera is slightly higher/wider and looks ahead, while retaining the same third-person adventure presentation.

All cells outside the village rectangle are unchanged, including the cave, Thornwood Trail, discovery, Thornwood town, Gate Loft, first Warden and later boundaries. The moved NPCs, buildings, interaction anchors and pickup agree with collision and the local map. Expanded western yards correctly identify as Larkhaven. No new dialogue, mystery clue, reward, species, save schema, tutorial or unlock is introduced.

## Native comparison

| View | Compact | Expanded |
| --- | --- | --- |
| Ranch | [Before](captures/compact-ranch.png) | [After](captures/expanded-ranch.png) |
| Village | [Before](captures/compact-village.png) | [After](captures/expanded-village.png) |
| Shop | [Before](captures/compact-shop.png) | [After](captures/expanded-shop.png) |
| Trail entry | [Before](captures/compact-trail.png) | [After](captures/expanded-trail.png) |

These are real Godot screenshots with original/fallback artwork. Installed private-art captures were inspected and remain outside Git. The open spaces are intentional; final yard activity, ground transitions, foliage and architecture remain an art/playtest question. The expansion does not claim a finished town or human approval of its pacing.

## Rendering observations

Godot 4.7.2, RTX4090, project window1536×864 and logical canvas384×216. Runs were sequential, with warmed camera views and90 measured frames each, using the same inherited environment treatment. Corresponding viewpoints follow the relocated landmarks; the expanded camera composition is part of the candidate. This compares whole layouts, not an isolated map-area cost.

| Renderer | View | Visible draw calls compact → expanded | Wall median ms compact → expanded |
| --- | --- | --- | --- |
| gl_compatibility | ranch | 925 → 768 | 4.165 → 4.166 |
| gl_compatibility | village | 965 → 656 | 4.166 → 4.165 |
| gl_compatibility | shop | 944 → 649 | 4.162 → 4.163 |
| gl_compatibility | trail | 827 → 857 | 4.165 → 4.163 |
| forward_plus | ranch | 300 → 282 | 4.163 → 4.163 |
| forward_plus | village | 292 → 166 | 4.163 → 4.161 |
| forward_plus | shop | 223 → 128 | 4.164 → 4.168 |
| forward_plus | trail | 264 → 259 | 4.164 → 4.165 |

[Raw observations](measurements/) include p95, visible primitives and scene-process timing. Most village views draw fewer objects; the trail view can draw slightly more. Wall times stay close to the local~4.16ms pacing interval, so this is not proof of a GPU speedup or low-end/mobile performance. More land did not cause an observed frame-time increase in this local sample. Triangle counts, shadows and active content still matter. No loading, memory or thermal claim is made.

## Checks and scope

**51/0 native checks** pass on both Compatibility and Forward+, with both fallback and installed private art. **38/0** compact comparison checks pass on both renderers. Checks verify the explicit collision map, exact preservation of cells outside the village, BFS reachability/return to all relocated anchors and regional destinations, each moved interaction, closed later boundaries, held-key walking/follower behavior, F6 modal protection/F7 restoration, one-time discovery reward, healing entry/return and refusal to create a save.

```powershell
& $env:GODOT --path wildbond-godot --rendering-method gl_compatibility --script res://tests/opening_space/capture.gd -- C:/temp/wb-space --fallback
# Repeat with forward_plus; add --compact for the old layout; omit --fallback only with the installed private pack.
```

The unchanged full repository runner passes **all28 suites**, including Wildbond **26,976/0**, Starfall **488/0**, **189species**, **23unchanged save names** and **21context checks**. All **65local documentation links** resolve; raw measurement JSON and whitespace checks pass. Runtime changes are confined to `tests/opening_space/`, over the existing tested environment/chapter systems and premade CC0 props. There is no public pack, version, release or production-profile migration. Before this layout becomes the saved main chapter, integration must deliberately version/remap saved positions and reconcile authored story/layout data. That integration is not silently included in this bounded audition.
