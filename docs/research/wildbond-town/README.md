# Wildbond town study

WB-TOWN-UI, Codex / Evan, 2026-10-17, [PR #551](https://github.com/ecbarish/generations/pull/551), stacked on #550. Evan requested a town with a Pokemon Center and an interface capturing Pokemon's essence. This is a native presentation/playability study, without adventure-save, canon-story, production-map or public-export changes.

## Playable result

- Red-roof **Partner Center**: enter from its door, interact at the counter and choose Restore. Restores the entire practice party's HP/PP and clears status/stages, with station lights. The exit restores the exact town doorstep.
- Blue-roof **Mart**: enter its own interior and buy Ranch Berries (40) or Bond Balls (75) into the shared bag. A 300-coin visit wallet tracks spending; insufficient funds cannot create stock or a negative balance.
- Two homes, paved plaza, basin, benches, fences, flower beds, trees and warm night lanterns. Buildings and plaza obstacles block walking. Buildings/trees fade when they obstruct the player.
- Southern trail transition, wild encounter and exact-position battle return. Party health and inventory carry through the visit. Weather stays outside; rain follows the trail transition.
- Compact location banner and contextual E prompt replace the always-open control dashboard. Escape opens a side menu with Party/Bag/Town Map/Time & Weather. Party health bars and framed dialogue use an original cream/navy/teal theme. Menus pause walking and support keyboard focus/mouse input.

Open [Play Town.bat](../../../wildbond-godot/tests/town/Play%20Town.bat). Full controls and check commands are in the [scene README](../../../wildbond-godot/tests/town/README.md).

## Reuse and boundaries

Evan's installed private pack supplies the animated Emerald trainer, including walking and running, and imported encounters. Public captures use original fallback actors solely to keep the private art outside Git; the actual local play session uses the trainer. Original Bogsnap follower frames, the existing practice bag/battle engine and the already credited CC0 Kenney Nature Kit foliage are reused. Buildings, rooms, roof/badge geometry, paving shader and UI are authored here; no new third-party download or extracted Pokemon building/UI texture is added.

The red healing center/blue shop and menu/dialogue conventions are intentional visual references. This is not a copied Pokemon map. The town layout is a study, not a new canon settlement. Houses stay closed, there is no receptionist/NPC schedule/quest integration, the wallet has no earning economy and nothing persists after relaunch. Interiors use cutaway rooms. Browser/mobile performance and final art polish remain unvalidated. All new runtime files are export-excluded under `tests/`.

## Evidence

Focused checks cover the two interiors, building/fountain collision, doorstep reachability, movement, healing HP/status/stages/PP, prices/stock/insufficient funds, exact door returns, held-key pause, building fading, party/map/weather menus, bag, indoor weather/backdrop, trail transitions and exact-position battle return. The private variant also verifies the installed walk/run trainer textures.

Native Forward+ (Vulkan) and Compatibility (OpenGL) both pass held-key walking, pointer menu/party, keyboard center entry, pointer healing, pointer purchase and pointer battle Run/return on an RTX 4090. Both capture runs exit cleanly. This is desktop functional evidence, not a low-end performance benchmark.

Public captures: [town](captures/town.png), [party menu](captures/party-menu.png), [center doorstep](captures/center-door.png), [center dialogue](captures/center.png), [healing](captures/healing.png), [mart](captures/mart.png), [night](captures/night.png), [night rain](captures/night-rain.png), [trail](captures/trail.png). Matching views are in [compatibility/](compatibility/). Private trainer captures stay outside the repository.
