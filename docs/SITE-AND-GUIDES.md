# The website and the guides

Evan (2026-10-11): the homepage, Come Play (`playtest.html`) and the guides (`guides/`) are not rewritten after every merge. They are refreshed when a game reaches a milestone, or when Evan changes which games the site should talk about. This page was checked against the code, `launcher/games.js` and the live site on 10 November 2026.

## What the site says now

Little Ranch is the game a newcomer is pointed at. The homepage hero is Little Ranch, and the big Play button opens `games/little-ranch/index.html`. The visit itself is not saved. Only the sound choice stays on the device. The hero note says that.

**Play now** (the picture row, from `Hub.CURRENT` in `shared/hub.js`) is three games you can already open:

- Little Ranch
- Starfall Guild, the early preview at `play/starfall/`
- Realmbound

That row is not the list of games being built next. Starfall's 3D work is waiting. Realmbound gets no new work. The sentence under "Play now" says so, and it sends people to the Lab for Keymaster and the Saltmarsh Shipping Office.

**The Lab** (`lab.html`) is every other game in `window.ArcadeGames`. On 10 November 2026 that is Storm Front, Lighthouse Watch, Brisket's Crossing, Ember Bricks, Diamond Manager, Keymaster, Otherworld and the Saltmarsh Shipping Office. The Lab's own words name Keymaster, the Saltmarsh Shipping Office, a baseball club, arcade cabinets and a story life sim. They do not mention a football night.

**Off the site, by direct link only.** `window.ArcadeOffShelf` in `launcher/games.js` is not read by any page a visitor sees. The code, folders and save keys stay.

- Lantern Bowl is shelved (Evan, 2026-10-18). No new work. `games/lantern-bowl/` still opens.
- Starfall Guild Classic (`games/starfall-guild/`)
- Diamond Career (`games/diamond-career/`). Diamond Manager replaced it.
- Primordial (`games/primordial/`)

There is no "Classic editions" section or ribbon on the homepage. That section was removed in the v1.7 work and is still gone on the live site and in this checkout. Do not put it back. Do not call Realmbound, Otherworld, Diamond Manager, the cabinets, Keymaster, Little Ranch, the Saltmarsh Shipping Office or Night Market a Classic edition. They have one edition.

**Not listed, on purpose.**

- Night Market Stalls is playable at `games/night-market/index.html` and is not in `window.ArcadeGames`, so it has no card on the homepage or in the Lab. A hall card is still being built (NM-HUB, open and not merged on 10 November 2026). The homepage no-JavaScript list names the direct address and says it is not on the picture row yet.
- Wildbond is not in this repository. It was dropped in #606 and now lives in a private project for Evan and select friends. Do not promote it on the public site or in a public guide. There is no `guides/wildbond.html` here.
- 3D games wait (Evan, 9 November 2026). The Starfall preview stays on Play now because people can already open it. It is not the current build focus. The Realmbound 3D experiment is not a public game.

**Near-term focus** (Evan, October and November 2026; the work queue's 9 November note): Little Ranch is the premier game. Keymaster, the Saltmarsh Shipping Office and Night Market are the games being finished next, in that order. Otherworld comes after those three. It is already playable from the Lab. Further Otherworld polish is in progress and is not described here as shipped.

## Between milestones (every merge, small)

- A new game, or a game changing name or address: its entry in `launcher/games.js` (`kind`, `goal`, `controls`, and `edition`/`newer` if it has two editions). `node tools/launcher-checks.cjs` checks these. Night Market's hall card is that kind of change, and it belongs to the NM-HUB pull, not to a guide refresh.
- Controls that change: the `controls` line in `launcher/games.js`.

## At a milestone, or when the focus changes

1. **Homepage card** (`launcher/games.js`): blurb, status, tags, goal and controls match the game as it is now. A fresh screenshot in `images/play/` or `images/lab/` when the picture is wrong. Do not add a card for a shelved game, for Wildbond, or for a game whose hall entry is owned by another open pull.
2. **Come Play** (`playtest.html`): the game's version, "what to try" and pictures. This November pass did not rewrite Come Play. It still leads a playtest with Little Ranch and still offers Realmbound. That page is behind the focus above.
3. **The game's guide** (`guides/`): play the start again as a newcomer, fix what changed, and update the edition and "checked" date on its card in `guides/index.html`. Write from the code you can open. If a feature is only in `docs/QUEUE.md`, `docs/PRIORITIES.md` or `docs/STUDIO-PLAN.md`, and not in the game, the guide may name it only inside a section marked as still being built. Do not describe a feature that is in neither the code nor those plans. District data files that the game does not load are not a player feature.
4. **Player-facing sentences** on the homepage (`index.html`): the hero, the Play now sentence, the Lab band and the footer. Layout and which cards appear belong to Website Lead. This page does not move cards between Play now and the Lab.
5. Look at the real page at a phone width and at desktop width before shipping.

Guides that exist on 10 November 2026:

| Guide | What it covers | Checked |
|---|---|---|
| `guides/little-ranch.html` | The visit a grown-up plays with a child | 10 November 2026, against `games/little-ranch/game.js` |
| `guides/keymaster.html` | Alder Street as it plays today, plus the pass still being built | 10 November 2026, against `games/keymaster/` |
| `guides/saltmarsh-shipping.html` | The office as it plays today, plus the polish pass still being built | 10 November 2026, against `games/saltmarsh-shipping/` |
| `guides/night-market.html` | Night Market Stalls as it plays today, with a capture of the opening lane. The hall card and the second night are marked as not in this build | 10 November 2026, against `games/night-market/` |
| `guides/realmbound.html` and `guides/realmbound-tips.html` | The browser game. No new Realmbound work. The booklet was not rewritten in this pass | 8 October 2026 |
| `guides/otherworld.html` | The three lives you can play now. Further polish comes after Keymaster, Saltmarsh and Night Market. The booklet was not rewritten in this pass | 8 October 2026 |
| `guides/diamond-career.html` | The shelved batter game, kept for the direct link. The page already says Diamond Manager replaced it | older booklet |

The field-guide shelf is linked from the homepage footer. Guides do not read or change saves.
