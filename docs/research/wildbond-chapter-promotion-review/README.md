# WB-GUEST-CHAPTER-PROMOTION-REVIEW: source inventory

Dad's Grok for Adam. This is a read-only source review with no runtime runs. It was requested in [#373 comment 6283420477](https://github.com/ecbarish/generations/issues/373#issuecomment-6283420477).

**Pins:**
- Chapter stack: `4c0b1277dbb417d928472f24f227ed347815ba0b` (`codex/wildbond-soft-ground`, includes #589, #591, #593 and #602). It is 108 commits ahead of main.
- Main: `6726c25d016be40d1b072e46b0dadb51330f0bf5`.
- Paths below are relative to `wildbond-godot/`. Blob SHAs are at `4c0b1277`.

**Who builds what:** this report feeds WB-DELIVERY-01 (#595), which Evan's Grok owns. Nothing here is a second runtime build.

## Key blobs
| Path | Blob | Role |
|---|---|---|
| `project.godot` | `7a4148db` | `run/main_scene="res://scenes/main.tscn"` (production adventure) |
| `scripts/main.gd` | `4ec273b5` | Production game; saves `user://journey.json` (l.139, `save_game` l.3679) |
| `scripts/battle.gd` | `165d586d` | Production (legacy) battle engine |
| `export_presets.cfg` | `463edd0d` | Web and Windows presets both `exclude_filter="frames/*, *.bat, tests/*"` (l.10, l.42) |
| `tests/environment_sample/scene.gd` | `010ac757` | Audition startup that spacious/soft scenes inherit |
| `tests/journey/profile.gd` | `b8919187` | Chapter profile `user://wildbond_pokemon_chapter_v1.json` (l.6), validation l.17–74 |
| `tests/opening/battle.gd` | `5d2e169a` | Opening battle; extends `tests/journey/battle.gd` (`704346e5`) |
| `tests/soft_ground/play.tscn` → `opening_space/scene.gd` → `environment_sample/scene.gd` → `opening/scene.gd` → `journey/scene.gd` | | Chapter scene chain |

## Retain / replace / defer
| Area | Current source fact | Verdict | Why |
|---|---|---|---|
| **Entry** | The game starts in production `scenes/main.tscn`. The chapter is only reachable through `tests/*/play.tscn` and the `.bat` launchers. | **Replace (entry only)** | Pointing `main_scene` straight at `soft_ground/play.tscn` would inherit the audition startup and bypass starter choice and Continue. It needs a production entry scene that loads the soft-ground appearance without the audition `_ready`. |
| Audition startup | `environment_sample/scene.gd` l.14–24 hardcodes `no_save=true`, a per-process `save_path` (l.18), `start_journey("wildbond:mosshog")` (l.21), `close_dialogue()` (l.23) and a review-camera placement (l.24). It also has F6/F7 review keys (l.216–226). | **Replace** | Split it: keep the appearance (ground, trees, fence, buildings, anchors) and drop the audition `_ready` and review keys from the production path. |
| Expanded geometry | `opening_space/map.gd` (Larkhaven x −5..32, y 0..25), soft-ground shader, the #602 fence. | **Retain** | Verified by #589/#591/#593/#602. Collision matches its map (`opening_space/capture.gd` l.47). |
| **Chapter profile / save** | Separate file `user://wildbond_pokemon_chapter_v1.json`. Atomic writes via `scripts/safe_save.gd`. It refuses to overwrite newer data (`profile.gd` l.84–). | **Retain** | It is distinct from legacy `user://journey.json`, so the two can coexist. |
| Saved position bounds | Top-level `room`/`position` is checked against the old compact town, `abs(x)≤15.7, abs(z)≤13.5` (l.39). `opening.position` is checked against `x∈[−34,26]`, `z≤17` (l.64). | **Replace (needs a save decision)** | In the expanded town, `Map.point` gives z up to 31.25. The ranch anchor (5,19) is z=23.75 and the paddock (21,22) is z=27.5. A save made there would fail validation on load, so the profile is held or reset. |
| Legacy journey | `scripts/main.gd` and `user://journey.json`. | **Retain, don't migrate** | #595 says to keep legacy `journey.json` with no silent copy or reset. |
| **Battle path** | The chapter uses `tests/opening/battle.gd` → `tests/journey/battle.gd` with `trainer_rounds.gd`. Production uses `scripts/battle.gd`. | **Retain the chapter path, defer unifying** | Merging engines is not needed to promote the chapter. The #491 GAD hold is on the production engine, not this path. One wording fix: the Warden fight label is "%s / Friendly Battle" (`tests/opening/battle.gd:59`). |
| Difficulty step | Isolde fields Pidgey 6, Wooper 7 and Mosshog 8. My #592 guest run (fallback art, #576) lost with Lv5/Lv4. | **Defer (retest)** | Retest on `4c0b1277` with real art before tuning anything. |
| **Phone/input** | The chapter is keyboard-driven (`opening/scene.gd` l.481 Tab, `journey/scene.gd` key input). `tests/journey/capture.gd` uses mouse clicks for Catch/Return. No touch handler was found in the chapter scenes. The CI "opening (keyboard/touch)" matrix runs `tools/audit/wildbond_opening_timing.gd`, which loads production `scenes/main.tscn` (l.35), **not** the chapter. | **Defer (gap)** | Chapter touch and phone movement have no evidence yet. The production `scripts/touch_pad.gd` and `phone_shell.gd` exist but aren't wired into the chapter. Don't claim phone support at promotion. |
| **Export** | Both presets exclude `tests/*`, and every chapter dependency lives there (`opening/`, `journey/`, `opening_space/`, `soft_ground/`, `environment_sample/`, `starter_sprites/`, `layout_plan/layout.json`). | **Replace (scope)** | A promoted chapter needs its runtime files moved to production paths, or a narrow include list. Check, capture, `.bat` and fixture files should stay excluded. No PCK, export or version change belongs in this review. |

## Smallest next integration task (for Evan's Grok, WB-DELIVERY-01)
One PR into `codex/wildbond-soft-ground`, with three parts:
1. **Production entry.** Add a non-audition scene that reuses the soft-ground appearance but runs the real starter choice and chapter-profile load and Continue. Remove `no_save`, the auto-Mosshog start and the review keys from that path only.
2. **Export scope.** Add an explicit list of the chapter runtime dependencies to include, leaving checks and captures excluded.
3. **Expanded-town save handling.** See the save decision below.

Keep `main_scene` unchanged until the fresh run, Continue, first Warden and clean-pack checks in #595 pass.

**Explicit save decision Evan must approve:** how to handle `opening.position` (and the top-level `position`) outside the old bounds. Three options:
- **(a)** bump `opening.version` to 3 with expanded-town bounds;
- **(b)** save the nearest anchor cell instead of the raw position;
- **(c)** clamp on load.

(a) keeps exact positions but changes the format. (b) needs no format change, but you re-enter at an anchor. Either way: back up first, and never copy, reset or heal silently.

## Limits
- Source reading only. I ran no Godot, saves or exports, and used no private pack. Line numbers are at `4c0b1277`.
- The #592 findings were made on #576 with fallback art. They are retest cases, not confirmed defects on this head.
