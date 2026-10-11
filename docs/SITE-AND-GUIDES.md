# The website and the guides: refreshed at milestones

Evan (2026-10-11): "we should have them set for when we reach milestones because right now we make such progress with
each update that each can significantly change the next." So the homepage, Come Play (`playtest.html`) and the guides
(`guides/`) are **not** rewritten after every merge. They are refreshed when a game reaches a milestone (the milestones
in docs/GOALS.md and the `-M` milestones in docs/DEVELOPMENT-PATH.md). Whoever finishes a milestone does the refresh in
the same pull request, or opens a follow-up the same day.

## Between milestones (every merge, small)
- A new game, or a game changing name or address: its entry in `launcher/games.js` (`kind`, `goal`, `controls`, and
  `edition`/`newer` if it has two editions). `node tools/launcher-checks.cjs` checks these.
- Controls that change: the `controls` line in `launcher/games.js`. Nothing else.

## At a milestone (the refresh)
1. **Homepage card** (`launcher/games.js`): blurb, status, tags, goal and controls match the game as it is now; a fresh
   screenshot in `images/play/` for the new versions.
2. **Come Play** (`playtest.html`): the game's version, "what to try" and pictures.
3. **The game's guide** (`guides/`): play the start again as a newcomer, fix what changed, take new screenshots, and
   update the edition and "checked" date on its card in `guides/index.html`. No guide yet and the game is near
   finished? Write one (CLAUDE.md: guides come once a game is near-finished).
4. **Arcade version** in `index.html` (VERSION and the label) and a README changelog line.
5. Look at the real page at 375 px and at desktop width before shipping (CREATIVE.md, "Writing for players").

## Two editions: Classic and the new version
Wildbond and Starfall Guild each have a **Classic** edition (the original browser game, finished and kept as it was)
and a **new version** (built in Godot, where all new work goes). The homepage keeps them apart: new versions sit in
their kind's section with a green "New version" ribbon; Classics sit together in the last section, "Classic editions",
with a tan "Classic" ribbon and a link to their new version. Guides name the edition they cover. Saves never cross.
Realmbound, Otherworld, Diamond Manager, Primordial and the cabinets are browser games with one edition: they are not
"Classic", so never call them that.
