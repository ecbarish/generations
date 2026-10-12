# Glossary (the technical words, in plain words)

For Evan, and for any assistant explaining things to Evan. Add a word when you catch yourself using one that isn't here.

## Making the games
- **Godot:** the free game engine the new Wildbond and the Starfall village are made in. Version 4.7.2; every computer
  and assistant must use the same version.
- **Project:** a folder Godot opens as one game (`wildbond-godot/`, `starfall-godot/`).
- **Scene / node:** Godot builds a game from *nodes* (a sprite, a sound player, a timer) arranged in a tree; a saved
  tree is a *scene* (`.tscn`). Think of nodes as the parts of a toy and a scene as the toy assembled.
- **Script (`.gd`):** the instructions for a node, written in GDScript, Godot's own language.
- **Import:** when Godot first sees a picture or sound, it converts it into its own format and writes the settings it
  used into a small `.import` file beside it. Those files are now saved in the repository so every computer converts
  things the same way.
- **The `.godot/` folder:** Godot's private scratch space on each computer. Never saved to the repository; Godot
  rebuilds it.
- **Export:** turning a project into something people can play without Godot: a Windows `.exe`, or a web build.
- **Web build (`index.html`, `index.wasm`, `index.pck`):** the page, the engine (`.wasm`, the same for both games, 38 MB)
  and the game itself (`.pck`: all its code, pictures and sound packed into one file). Lives in `play/`.
- **Headless:** running Godot with no window, which is how tests run on a server.
- **Browser games:** the older games (Realmbound, Diamond Career, Otherworld, the classic Wildbond and Starfall Guild) are
  plain web pages written in HTML and JavaScript; no engine.

## Saving and testing
- **`user://`:** the folder where a Godot game keeps your save on your computer (on Windows, inside
  `AppData\Roaming\Godot\app_userdata\<game>`; in a browser, the browser's own storage).
- **localStorage:** where the browser games keep their saves, inside the browser.
- **Save version (`"v": 1`):** a number inside each save saying which layout it uses, so a later version of the game
  knows how to read an older save.
- **Migration:** the small step that upgrades an old save to the new layout when it loads.
- **Check / test suite:** a list of automatic checks that plays parts of a game by itself and confirms the rules hold.
  We have ten suites: eight browser test pages in `tests/` and one per Godot game.
- **CI (continuous integration):** GitHub running every suite by itself whenever new work arrives. A green tick means
  everything passed; a red cross means something broke, before anyone merges it.

## Working together (git and GitHub)
- **Repository (repo):** the project folder plus its full history, kept on GitHub (`ecbarish/idle-arcade`).
- **Commit:** one saved step in the history, with a message saying what changed.
- **Branch:** a separate line of work, so unfinished work doesn't disturb the playable game. `main` is what's live;
  ChatGPT works on `codex/...` branches, Claude on `claude/...` when not on main.
- **Pull request (PR):** a request to bring a branch into `main`, where it can be reviewed and checked first.
- **Merge:** bringing a branch's work into `main`.
- **Push / pull:** sending your commits up to GitHub / bringing others' commits down.
- **Patch / bundle:** work packed into a file when it can't be pushed directly (a `.patch` holds the changes; a
  `.bundle` holds the commits themselves). Applied on a computer that can push.
- **GitHub Pages:** GitHub's free web hosting; it serves `main` at https://ecbarish.github.io/generations/.
- **`.gitignore` / `.gitattributes`:** a list of files git should never save / rules for how git treats files (line endings,
  which files are pictures and sounds rather than text).
- **Line endings:** Windows and other computers mark the end of a line of text differently; mixing them makes every
  line look changed. `.gitattributes` keeps them consistent.

## Assets and licences
- **Asset:** any picture, sound, tune or font used in a game.
- **CC0:** "no rights reserved": use and change freely, no credit required (we credit anyway, in CREDITS.md).
- **CC-BY:** free to use and change if you credit the author.
- **OGG (Vorbis) / WAV:** two sound formats. WAV is uncompressed and large; OGG is compressed and about a tenth of the
  size with no difference you can hear in a game. Tunes and looping place sounds use OGG.
