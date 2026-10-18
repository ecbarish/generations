# Playable measured Larkhaven–Thornwood chapter

WB-OPENING-CHAPTER · Codex / Evan · 2026-10-17 · [PR #555](https://github.com/ecbarish/generations/pull/555), stacked on #554. Implements Evan's explicit request to connect the measured opening geography and original story hooks to the persistent Pokémon chapter.

## What is playable

Larkhaven, Thornwood Trail, Millgrass Lane and the Dewcut approach now share one continuous walkable grid. The geometry reuses #552's measured town/trail source snapshot and west-lane candidate, with a short east approach. Town → trail, west branch → town and trail → east approach are real collision-aware walks with no teleport or unresolved landing. The 1.25-metre grid, source building footprints, door/NPC/item anchors, paddock and pond govern gameplay. The local map draws those same cells and the player's location; it pauses the game inside the game window.

The healing inn, shop and ranch door work. The inn restores HP, PP and burns; the shop retains the wallet/bag; the ranch/paddock open actual party storage. Maren's first outing is a persistent catch → inn → return loop with a one-time supply reward. Pip reuses his existing chatter. Wren and Bram offer optional friendly turn-based battles using the installed Pokémon subset. Their wins persist, repeats cannot farm rewards, trainer catching/running are blocked in both UI and model, and defeat restores the party beside the measured inn for another attempt. Existing wild catches, party/storage, XP, leveling and bag behavior remain connected.

Warm lighting, shadows, animated private trainer/follower, existing Kenney trees, water/weather controls and building fading are reused. Ground grain, flowers, correctly oriented paddock fences, one-time item markers and forest framing improve the layout's readability. Found items retain their original 30/60-coin rewards. Longer original dialogue is split into readable pages. The original character art remains a procedural placeholder; this is not final NPC-art polish.

The journal shows the outing and trainer results. Tab/Map opens the local map; Escape closes menus. The [existing launcher](../../../wildbond-godot/tests/journey/Play%20First%20Journey.bat) now opens the new chapter. [Controls and save policy](../../../wildbond-godot/tests/opening/README.md).

## Preservation and limits

The chapter's existing schema-two party records and filename remain in use. New optional, validated `opening` metadata stores measured coordinates, Maren/Wren/Bram results and one-time items. Old chapter saves without it receive defaults and a safe measured-town start; party IDs, HP/PP, XP, collection, bag, wallet and catch/inn milestones survive. New outdoor coordinates are stored separately from a safe legacy town checkpoint, so older chapter code need not interpret a different coordinate space. Interior saves resume at the exact measured doorstep. Bad/nonfinite positions and duplicate item claims are rejected; a future nested checkpoint version holds writes rather than falling back and overwriting it. Existing schema-one migration remains intact. Do not run old/new chapter processes simultaneously.

The original adventure's `journey.json`, production maps, species/story data and public export are untouched. Original Maren/Wren/Pip/Bram dialogue and themes are reused and the scoped placement is recorded in the lore ledger; no new mystery explanation or early colour/depth restoration is placed. Wren/Bram have bounded one-partner Pokémon adaptations, not their production rosters. The complete register/heritage/bond opening, ranch simulation, evolution and visual-era unlocks remain future integration work. The installed three species remain samples, not final starters.

Larkburrow remains closed; Stone Break + Loom Badge are still the later home-shortcut requirement. Deeper Thornwood and Dewcut have explicit closed boundaries, not fake destination transitions. The later Stone-partner shelf is not moved to Dewcut's entrance. This is an integrated **native opening chapter**, not the full regional rollout or a published production replacement. Mid-battle closure still resumes the pre-battle checkpoint; outcomes commit on Return to Trail.

## Verification

- All **28 repository suites pass**, including Wildbond **26,962/0**, Starfall **488/0**, the unchanged 189-species original catalogue and 23 save names.
- **50 opening assertions** pass in portable and private modes: every interaction has a reachable approach, actual movement across all branches and back, pond/building/cave/unfinished-route collision, full catch/inn/Maren loop, one-time supplies/items, trainer model/UI restrictions, an actual controlled attack/win, duplicate protection, safe defeat retry, map pause with physical key input, old-party preservation, precise save/reopen and future checkpoint protection.
- The inherited **45 Pokémon rules/migration** and **48 private chapter checks** pass. The original measured-layout contract still passes **53 checks**.
- Native Forward+ and Compatibility captures pass held-key movement, pointer map opening, all local locations, original Maren dialogue, a controlled trainer turn/win and healing room. Both renderers were visually inspected with private trainer/Pokémon sprites. Renderer lighting differs; no low-end/mobile performance or human fun acceptance is claimed.
- Capture uses isolated no-save scenes, controlled battles and camera placements. Tests use only process-specific saves and clean them up. The real player save is not used by checks/captures.

Public evidence uses original placeholder actors only: [town](captures/larkhaven.png), [local map](captures/local-map.png), [trail](captures/thornwood.png), [Maren](captures/maren.png). Actual private captures remain outside Git in `C:/Users/evanb/AppData/Local/Temp/wildbond-opening-private` and `wildbond-opening-compat-private`. No new external artwork is downloaded or committed.

Godot import, whitespace and export-freshness verification are completed at handoff. The chapter stays under export-excluded `tests/`; publication and independent review are separate steps. Next: play the outing for pace/readability, then extend the connected first expedition north using the existing regional plan, rather than adding another disconnected demonstration.
