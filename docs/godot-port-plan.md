# Moving Wildbond to Godot: how hard, any computer, sharing with friends

Claude, 2026-10-08, answering Evan: "How hard will moving our game to this engine be? Is it straightforward? Will this
make it difficult to use anywhere other than this computer? Are we rebuilding the wheel or did we lay a strong
groundwork? How can I send it to friends to try?"

## Short answers
- **Not a rebuild from zero, and not a one-click move either.** About half the game moves over automatically
  already: everything that is *content* (creatures, moves, maps, story, people). The *rules* (battles, levels,
  breeding, the ranch) get translated line by line; the numbers and design are done and tested, so that is steady
  work, not new design. The *look and feel* is being rebuilt on purpose, because that is why we're moving.
- **It works on any computer.** The project is plain text files in GitHub, and Godot is one free program with no
  installer and no account. The launcher (`Play Wildbond trial.bat`) finds Godot anywhere in the usual folders.
- **Friends play from a link** (a web build on the arcade site) or a zip with one .exe. Both are set up; one
  one-time download is needed first (below).

## What the groundwork already gives us
| Layer | Browser game | In Godot | How it moves |
|---|---|---|---|
| **Content**: 81 creatures, 22 moves, elements, matchups, 8 areas' maps, the story, scenes, people, badges, foods, modes, variants | `00-data.js`, `11-maps.js` (about 1,600 lines) | `data/wildbond.json` | **Automatic.** `tools/godot-export.ps1` copies all 39 tables in one command, so the two versions never disagree. Done tonight. |
| **Rules**: battles, levels and XP, catching, breeding and inheritance, the ranch day, challenge modes, rematches, variants | `03-battle.js`, `04-world.js`, `07-ranch.js`, `15-challenge.js`, `17-postgame.js`, `19-variants.js`, `shared/creatures.js` (about 1,000 dense lines) | to write in GDScript | **Translation.** Same logic, new language. The browser tests (1254 checks) say what the right answers are, so each rule can be checked against the browser version. |
| **Look and feel**: the screen, menus, the world view, battles on screen | `01-art.js`, `05-ui.js`, `06-scene.js`, `12-walk.js`, `13-hd.js`, `14-diorama.js` | being built | **Rebuilt on purpose** (docs/wildbond-plan.md phases 1-5). This is the part that makes the move worth it. |
| **Shared building blocks** | `shared/` | `figures.gd` (people and creatures from parts), `register.gd`, `card.gd` | People and creatures are built from body parts, ready for the character creator, more creatures, other games and a 3D rig later. |
| **Checks** | `tests/wildbond.html` | `tests/run_tests.gd` (38 checks, plays the opening by itself) | Grows with each step. |

**Rough size:** the rules are perhaps 4-8 good Claude sessions; the look and feel is the plan's phases 1-5, the same
work we'd do in any engine. The browser version stays live and playable the whole time; Godot replaces it only when it
can do everything the browser version does (that would be Wildbond 2.0). A save importer can carry browser saves over.

**What would make it hard** (and how we avoid it): writing the content twice (avoided: one source, exported), changing
rules during the move (avoided: translate first, improve after, with checks on both), and art that can't scale
(avoided: parts-based figures, environment pieces as objects with a footprint).

## Any computer
1. Install Git and GitHub Desktop (or any Git app), clone `ecbarish/idle-arcade`. Everything is there.
2. Download Godot 4 (the standard Windows version, not .NET) from godotengine.org and unzip it into `<your user
   folder>\Godot`. No installer, no account.
3. Double-click `wildbond-godot\Play Wildbond trial.bat`. To edit, open Godot and import `wildbond-godot\project.godot`.

Assistants on any computer can work on it the same way: the scripts are plain text, `tests/run_tests.gd` checks them,
and the recorded-frames trick (README "How it's built") lets Claude see the game without playing it. ChatGPT/Codex can
edit the GDScript and data too; if its environment can't run Godot, Claude runs the checks before merging.

## Sending it to friends
**Once, on your computer (about 1 GB download, from Godot itself):** open Godot, open the project, then
*Editor > Manage Export Templates > Download and Install*. After that, Claude can build it any time:
`powershell -File tools\godot-build.ps1`.
- **A link (recommended):** the web build goes to `play/wildbond/` on the arcade site, so friends open
  `https://ecbarish.github.io/generations/play/wildbond/` in a desktop browser. Nothing to install. Mouse clicks work
  (click to walk); phones will need on-screen touch controls polished first.
- **A file:** `wildbond-godot\export\Wildbond-trial-windows.zip` holds one .exe. Windows warns about an unknown
  publisher (we don't pay for code signing): *More info > Run anyway*.
- Later, itch.io (free) is the usual home for indie game builds, with a page, screenshots and comments; you'd make the
  account yourself.

## Next steps for the move (in order)
1. Evan: install the export templates (above), so friends can try the trial.
2. Battles on the field (plan phase 3), translating `03-battle.js` with the browser's numbers and checks.
3. Levels, XP and the team; then a save file (with an importer for browser saves).
4. Route 1 (Thornwood) from the exported maps, wild creatures in the grass, catching.
5. Then, area by area, the rest of the story, with the ranch as a place (phase 5).
