# Generations (formerly Idle Arcade)

**Play for the fun. Automate the grind.** Live at https://ecbarish.github.io/generations/

A stable of adventure and progression browser games. Each game saves on its own in the browser,
and the hub page shows where you left off in every one.

**Design rule:** automation (managers, staff, instincts) is always earned by playing, never sold.

## Games

| Game | Status | What it is |
|---|---|---|
| [Primordial](games/primordial/) | Playable | Evolution idle game: cell to Leviathan, mutation drafts, niche fights, extinction resets |
| [Starfall Guild](games/starfall-guild/) | Prototype | Kairosoft-style adventurer guild: recruit, class combos, dungeon autobattle, town, staff, seasons |
| [Realmbound](games/realmbound/) | Prototype | Classic-MMO-inspired adventure: two factions, 5 classes including a pet-taming Hunter, levels 1–40, quests, loot, Focus/Auto play, addons as automation ([design](docs/realmbound-design.md)) |
| [Diamond Career](games/diamond-career/) | Prototype | Batter career from first call-up through a 30-day paid month, timing/tactical batting, two contract terms, calendar salary and permanent home/garage purchases |
| [Otherworld](games/otherworld/) | Prototype | Three authored lives: Asterhold, Hearthmere and the Ashen Throne; costly gifts, choices, endings and knowledge carried between lives |

Design plans live in [docs/](docs/): [Realmbound](docs/realmbound-design.md), [idea backlog](docs/ideas.md).

## Layout

```
index.html            the hub (the "stable")
shared/engine.js      saves, export/import, number formatting, hub progress cards
games/<name>/         one folder per game, plain HTML + JS, no build step
serve.ps1             local test server: http://localhost:8765/
```

## Run locally

```
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```
then open http://localhost:8765/

## Picking up the work

Anyone continuing this project (any AI assistant or person): open [START-HERE.md](START-HERE.md).

## Changelog

- **Diamond Career — DC-N (PR #247):** Play from the wall calendar, learn the swing with a wider opening window, read complete conversations, and return to Play after preparation.
- **Generations hall — AR2.15 (PR #249):** Diamond Career has its own sports card; each sports card shows its own save and opens or resets the correct game.

- Generations name sweep (2026-10-12): the homepage sign and the hall's neon say Generations, with the tagline "Play for the fun. Automate the grind."; promo pages, the trailer card and contributor docs use the new name and repository.
- Brisket's Crossing v0.1.3 (2026-10-12, AC3.3; version bumped on merge): visible death causes, labelled urgent timer, clear lives/session counts, and completed-run progress even when initials are skipped (PR #244).

- Brisket's Crossing v0.1.2 (2026-10-12, AC3.2): wider early wagon gaps and logs, slower opening traffic and more delivery time; the first hop starts in clear road. Original challenge returns from run 4. Existing score records and controls stay compatible. [Phone before/after and checks](docs/playtests/brisket-ac3-2/README.md).
- Godot Wildbond (2026-10-12, WD4b): Saltmarsh is now three connected places. A coast road runs from Thornwood's gate to the original settlement, and Moon Pool opens for a Tide partner, where Foamglint is easier to find. Pre-expansion Saltmarsh saves keep their map and coordinate. Not merged.
- Godot Starfall (2026-10-12, SF2.9): darkness, step 1. Late on an evening when a wall lantern is still dark, sometimes (about 1 in 3) a small creek slime is seen slipping in through that section and making for the nearest building. Each lantern guards its own section, and there's at most one slime in the whole town a night. It leaves a mess on the step with tracks back to the wall, and that place takes 2 coins less a sale until you clean it up with one E press (or Odo does it by day); it dries up by itself after a day. No fighting, nothing permanent; lighting the walls or hiring Odo keeps them out. Old saves load with no mess. 264 checks pass. Source only; the web preview isn't rebuilt by this PR.
- 2026-10-12, Starfall mobile aspect-fit ([source #221](https://github.com/ecbarish/generations/pull/221), [preview #222](https://github.com/ecbarish/generations/pull/222)): phones use fractional aspect-fit while desktop retains integer pixel scaling; unchanged camera, controls and saves. [Rendered review](docs/screenshots/starfall-mobile-fit/README.md) and [exact-build release record](docs/research/starfall-preview-mobile-fit.md).

- Realmbound v1.9.0 (2026-10-12, RB1.11): encounters wait for your order, Focus pauses rather than taking over, Auto is earned on out-levelled roads, and time away grants rested XP only (PR #218; version bumped on merge).

- Realmbound v1.8.1 (2026-10-11): first-session fixes: Focus keeps town visits manual, Map explains blocked travel and the carried Journal shows ready requests (RB-PLAY1, PR #214; version bumped on merge).

- Godot Starfall (2026-10-11, SF2.10): Starfall says what to do next. After the opening a goal line under the status bar names the nearest thing within reach (pin a request, serve meals until Bryn offers, the next rank, an empty plot, someone waiting for a word, a member's story, the next helper to earn) and counts down as you play; G or a tap on it lists the next three. The keys are shown the first time you need them and go once used. Old saves skip the key hints. 230 checks pass; web preview rebuilt.
- Diamond Manager v0.6.0 (2026-10-11): coach hiring: optional hitting/pitching staff, one-season salaries and visible winter development gains (DM3, PR #196; version bumped on merge).
- Godot Starfall preview (2026-10-11, SF-PREVIEW-200): rebuilt from merged `0af5b92` so new towns open with the complete Guild Hall roof/banner and inn roof. Exact pack passes real-browser movement and fresh/legacy saved-town reload checks; engine and save format unchanged. [Release evidence](docs/research/starfall-preview-opening.md).

- Diamond Manager v0.6.0 (2026-10-11): coach hiring: optional hitting/pitching staff, one-season salaries and visible winter development gains (DM3, PR #196; version bumped on merge).
- Diamond Manager v0.7.0 (2026-10-11): player morale: named playing-time and contract concerns through Iona, reversible choices and visible salary expectations (DM4, PR #207; version bumped on merge).
- Diamond Manager v0.7.1 (2026-10-11): six-season balance: ordinary recruits and standouts track the league; winter visitors renew, while earned development and bargain access remain (DM-B2, PR #208; version bumped on merge).
- Diamond Manager v0.8.1 (2026-10-12): outs you can see at every speed (Evan: "not a single ground out, and the infielders never moved"). At Fast and Very fast a ball in play used to flash by before the fielder reached it, so only strikeouts and walks showed. Each ball in play now keeps a watchable pace at every speed, and the OUT or HIT sign stays up until the next batter. The infield reacts: a nearby infielder breaks for a ground ball, the first baseman runs to the bag for the throw, and the batter runs it out down the line. The simulation itself was already right (in 20 games about 30% of outs were strikeouts and 70% were ground, fly, line and pop outs); no numbers changed.
- Diamond Manager v0.8.0 (2026-10-11): season ledger, actual-stat league awards, club records and a dated Trophy Case in the Clubhouse (DM7, PR #209; version bumped on merge).

- 2026-10-11: Diamond Manager six-season balance: ordinary recruits and standouts track the league; winter visitors renew, while earned development and bargain access remain (DM-B2, PR #208; version unchanged pending review).

- 2026-10-11: Diamond Manager player morale: named playing-time and contract concerns through Iona, reversible choices and visible salary expectations (DM4, PR #207; version unchanged pending review).

- 2026-10-11: Diamond Manager coach hiring: optional hitting/pitching staff, one-season salaries and visible winter development gains (DM3, PR #196; version unchanged pending review).
- Godot Starfall (2026-10-11, SF2.6c): new towns open beside the Guild Hall with both full roofs and the banner in view. Removed three unused pack tiles; music and sounds remain. Existing towns keep their saved position and progress. [Before/after and checks](docs/screenshots/starfall-opening-view/README.md). Source change only; the web preview is not rebuilt by this PR.

- Arcade v1.6.0 (2026-10-11, AR2.14): Classic versus the new version made obvious. Wildbond Classic and Starfall Guild Classic sit together in a last "Classic editions" section with a tan Classic ribbon and a link to their new version; the new versions carry a green "New version" ribbon. The guides page says which edition each guide covers and when it was last checked; the Diamond Career guide moves to "Older guides". The site and guides now refresh at milestones (docs/SITE-AND-GUIDES.md). The hall's cabinets keep one readable size in a row that scrolls as you walk, grouped like the sections with the Classics last; phones skip the hall and go straight to the section buttons and cards.
- Wildbond (2026-10-11, WB-DOOR-TAP): clicking or tapping Larkhaven's inn, shop and both homes now queues entry just like the barn. The full-size phone directional pad is moved between the lower doorways so it no longer covers Nora's entrance. Door collisions, walking distance, keyboard controls, phone preferences and saves are unchanged; source fix only, web preview not re-exported.

- Wildbond (2026-10-11, keys in the world, WB-KEYS): the first times each control matters, its key appears in the world: arrow keys over your head until you have walked a little, the Talk key with its word beside you when someone or something is there to use, and the field book's key beside the bag until you have opened it. A gamepad shows its buttons; a phone already shows its pad and Talk button. They step aside once you know them.
- Wildbond (2026-10-11, keys in the game): the opening's notes now name the controls for whatever you're playing on (keys, a gamepad or a phone): how to walk, talk and open your field book (Playtester's note).
- Wildbond (2026-10-11, the reveal): after the wild bond, three old pages turn up one after another beside Orri, Ceryn and Sivet. Once you've read all three and won the league, Toren and Isolde wait by Hollowecho's cave with copies, and the valley's deepest secret is told. Depth comes back to the world: shadows fall long from then on, and each Warden has something new to say.
- Starfall web preview (2026-10-11, guest): `play/starfall/` rebuilt from main `76f73aa`, so the preview includes SF2.8's lantern round and sparring.
- Starfall web preview (2026-10-11, guest): `play/starfall/` rebuilt from main `fa44b3a`, so the preview has SF2.18 (no mandatory chores) and SF2.20.
- Godot Starfall (2026-10-11, SF2.20, guest): Tamsin, the barkeep, also asks for the tap after three evenings you kept it yourself (poured at least one drink by hand), not only after six drinks, so a quiet tavern still gets its barkeep.
- Godot Starfall (2026-10-11, SF2.18, guest): no mandatory chores. If nobody's at the counter, adventurers help themselves from the stew pot (fed, but a hand-served meal is worth more and lifts their spirits). At dusk you light a wall lantern just by walking near it, so the round is a short loop. A bout or a drill past full spirits becomes practice. Adventurers can read the board from anywhere along its front, so standing there doesn't stop them.
- Godot Starfall (2026-10-11, SF2.8 / H5 part 2, guest): two new things to do by hand, each with its own hire later. **The gate watch:** at dusk, walk the walls and light the four lanterns. A lit night leaves lamp money from the carters and your adventurers sleep easy; after three rounds Odo, a night watchman, asks to walk it for five coins a day. **The training yard:** spar with an adventurer at home to raise their nerve (stop the swing in the gold for a clean bout), once each a day; after five bouts Ilse, a drillmaster, offers to drill one adventurer every morning for six coins. Doing it yourself is always worth more than the hire.
- Starfall web preview (2026-10-11, guest): `play/starfall/` rebuilt from main `9c48e64`, so the preview includes the stretch outside the west gate (SF2.7).
- Godot Starfall (2026-10-11, SF2.7 / H5 part 1, guest): you can walk out of the west gate now. Outside is a short stretch of frontier: the trail crosses the miller's creek to the woodcutters' path (strung with webs), a branch runs up to the North Road, another down to Tull's broken fence and dug-up turnips, and waymarkers say what's been seen. Adventurers out on those jobs can be seen at work there. Walk back in the same way. No fighting; the guild's work is still in town.
- Wildbond (2026-10-11, the wild bond): the legend the game is named after can now happen. Later in the journey (from the fourth badge), when your last creature is badly hurt, trusts you completely and faces a harder foe (a Warden, the league, the Spire, or anyone clearly stronger), it looks back at you and one new choice appears: "Stand with it". You fight as one for a short while, then you are both spent. Nothing explains it beforehand; it is named only after the first time.
- Diamond Manager v0.5.1 (2026-10-11): pitcher rest follows big-league habits (Evan: "50 pitches is half a standard MLB expectation"). Starters still throw 90 to 120 pitches, then take four days off and start every fifth day; a reliever who threw 45 pitches rests two days, 25 pitches one day, and a short outing can pitch again tomorrow. The roster says so in full words. 53 checks.
- Diamond Manager v0.5.0 (2026-10-11, DM-G): the ballgame itself, after Evan found it too basic ("I'd love to see more of the game rather than a description"). Games now play pitch by pitch on the field: nine fielders at their positions, the batter at the plate, every pitch thrown, the swing, the ball's flight, the fielder chasing it and the throw, and runners going round the bases, with a broadcast-style scoreboard (balls, strikes and outs) and name tags for the pitcher (with a pitch count) and the batter. You manage your side: pitchers tire past their pitch limit, Iona stops the game to ask about a tired pitcher, a closer or a chance to pinch hit or pinch run, and Make a move (M) lets you change pitchers, pinch hit or pinch run between batters. Box scores during and after every game (B), a Stats page with this season, last season and career numbers (AVG, OBP, SLG, ERA, wins and more) and league leaders. Batters have a new Speed rating. Games left halfway resume. Also: double plays, stolen bases (Iona sends fast runners; you can send one from Make a move), defensive changes late in close games, and pitchers who need rest (starters go every fifth day). The batting numbers stay those of the tested simulation. 52 checks.
- Diamond Manager v0.4.0 (2026-10-11, DM-T): a trade finder, as Evan asked. On the Trades page, press Find a deal on any player in the league and Iona works out the cheapest offer that club would take (one or two of our players, from the roster or the farm club), with Make this trade or Change it in the trade table. Shop one of our players to hear the best one-for-one offer from each club. In the trade table, What would make it work? ticks the cheapest extra players the other club wants. Farm club prospects can now be traded (farm to farm), and a young player's ceiling now counts toward their trade value. 41 checks.
- Diamond Manager v0.3.0 (2026-10-11, DM6): the draft and player development, as Evan asked. Every player now has a ceiling (the best they can become); young players grow toward it each winter, faster when they play every day and with training rooms, and players past 30 slip. Your scouts read ceilings to the nearest 10, then 5, then exactly as the Scouting office grows. Each winter after the final comes a three-round draft of 24 prospects, worst record first; pick yourself, pass, or let Iona pick. Drafted players join a farm club of up to six, play every day there and cost nothing against the budget; call them up when ready, or send down a player 25 and under (their contract still counts). Past 25, farm players leave for free agency. Old saves get ceilings and an empty farm club. 37 checks.
- Diamond Manager v0.2.0 (2026-10-11, DM-B): your choices now matter. The playtest found that an active manager won no more than one who did nothing. Now the owner's budget starts at $10.5M (old saves get +$3M once), two standout free agents reach the market every winter, league-minimum players are always available and do not count against the budget (so a roster can always be filled), training rooms add two points a level, the owner rewards climbing seasons more, and Iona gives her opinion on trade offers. Fixed: a player from another club could arrive with an already-ended contract. In 24 simulated leagues an active manager now wins about 4 to 5 more games a season and reaches the final about one season in five. 27 checks.
- Little Ranch v0.5.0 (2026-10-11, LR15): a cleaner grown-up panel. It's a rounded card with drawn icons and one-line labels, plus an X and a tap on the backdrop to close. 'Back to play' now works on Android, where it did nothing in a WebView because the buttons relied on the browser turning a touch into a click. When the game runs inside a standalone app (`?app=1` or a `window.LittleRanchApp` bridge), the panel shows just Replay, Sound and Exit.
- Little Ranch v0.4.0 (2026-10-11, LR14): the moon's song. At night, while the baby sleeps, tap the moon three times and it softly plays Twinkle Twinkle Little Star while the stars twinkle in time; the baby sleeps on with a little smile. No words, nothing to fail; quiet when the sound is off.
- Little Ranch v0.3.0 (2026-10-11, LR13): the sun surprise. In the daytime, tap the sun and it gets a little brighter each time; on the fifth tap a big rainbow arches over the field and the baby looks up and cheers, then it fades and you can do it again. No words, nothing to fail.
- Little Ranch v0.2.0 (2026-10-11, LR12): once the baby is asleep, six taps on it wake it up for a fresh sunny day. Each tap it stirs and its zzz shrink; on the sixth it wakes happy and the sky brightens from night to morning. No text, nothing to fail.
- Little Ranch v0.1.1 (2026-10-10, LR2): feeding works again after switching to and from Peekaboo, and rotating/resizing the screen keeps the baby and active toys in place. Existing sound preferences are preserved. [Review and before/after captures](docs/screenshots/little-ranch-lr2/README.md).
- **2026-10-10, RB1.9 (pending review):** An isolated third-person 3D Lantern Rest trial with original procedural people/furniture, a following camera, real shadows and modular eight-slot equipment previews. Existing Realmbound gameplay and saves are untouched. No version bump.


- Ember Bricks v0.1.0 (2026-10-11, AC3): keep a coal off a baker's peel until the commons kiln is lit. [Play](games/ember-bricks/) · claimed on `guest/ember-bricks`, not merged. Hub stays v1.5.1. Brisket's Crossing is a separate cabinet.
- Brisket's Crossing v0.1.1 (2026-10-12, AC3.1): recovery/release gating after a hit, keyboard start and readable responsive artwork/captions. [Play](games/briskets-crossing/) · [verified release](docs/playtests/brisket-ac3-1/README.md), #180 merged as `19a7ee37`; old v1 scores retained. Hub unchanged.
- Brisket's Crossing v0.1.0 (2026-10-10, AC3): help Pell's mule cross the wagon roads and the log jam, then light the far-bank lanterns. [Play](games/briskets-crossing/) · [PR #160](https://github.com/ecbarish/generations/pull/160), merged (`a7fac81`). Hub stays v1.5.1. Ember Bricks is a separate cabinet.
- Starfall web preview (2026-10-10, guest): `play/starfall/` rebuilt from main `28cee8c`, so the preview shows the new frontier town: the scrolling stockade, the side-on gate, the fitted smithy and tavern, and evenings. Pack only (3.23 MB); the engine is unchanged. The Come Play picture is refreshed. [Build notes](play/starfall/BUILD.md)
- Godot Starfall (2026-10-10, SF2.6 follow-ups, guest): evenings now look like evenings. A gentle cool tint settles over the town through the second half of the day and lifts early next morning, while lamps, lit windows and the forge stay bright. It only changes the picture; the day runs as before. The training yard now also blocks the row its top fence stands on, so nobody walks through the fence. [Before and after](docs/screenshots/starfall-evening/before-after.png)
- Lighthouse Watch v0.1.1 (2026-10-10, AC2.1): the harbour keeps its proportions on phones and wide screens, with round bursts and taps mapped to the fitted sky after rotation. [Checks and before/after pictures](docs/playtests/lighthouse-watch-display/README.md).

- Godot Starfall (2026-10-10, ART-SF-7, guest): the west gate is now a real gate. It has two posts on stone footings, a beam overhead and its two doors standing open inside the town; before, it was just a gap in the palisade. The smithy and tavern are redrawn two tiles wide, so they fit their plots instead of spilling over. The smithy gets back its water barrel and grindstone by the door. [Before and after](docs/screenshots/starfall-gate-fit/before-after.png)
- Godot Starfall (2026-10-10, SF2.6 / H4, guest): Starfall's own place. The town is now a log-walled frontier stockade drawn with its own ART-SF pictures instead of Larkhaven's cottages: pines outside, a palisade with the gate in the west wall and a watchtower beside it, and a mud road running east past the square with the Guild Hall, the job board and the well, then the Lantern Inn and the plots. The map is bigger than the screen and scrolls as you walk. Finished buildings use their new pictures and footprints. Old saves keep every building, and if you were standing where a wall is now, you start on open ground nearby. [Screenshots](docs/screenshots/starfall-own-place/)
- **2026-10-10, RB1.7 (PR #153, pending review):** Realmbound inns have sleeping corners with linen cupboards, dining tables with chairs and hearth seating. The central arrival route stays clear; existing resting and exits work as before. No version bump.

- 2026-10-10 — Wildbond Godot, WB-ROOF-149 (#154): planned tap routes now avoid roof collision, so the witnessed Larkhaven/Sunthread taps complete. Native regression coverage; web preview export follows after merge.
- **2026-10-10, RB1.8 (PR #155, pending review):** Realmbound walkers show front, rear and profile poses. Walkable scenes cast object silhouettes, room side walls join smoothly, fireplaces contain their flames and interiors have slightly steeper framing. No version bump.

- 2026-10-10 — AR2.4 / X2 (#158): guide and playtest links/pictures checked; all 140 local references, 22 images and desktop/phone views pass. No reader-page changes needed.

- Arcade v1.5.1 (2026-10-10, AR2.11, Tell us): every browser game's ⚙ Settings now has a "Tell us" row (Share feedback, Report a bug, Suggest an idea) that opens a GitHub issue with the game and version filled in, plus a ten-minute playtest script on [Come Play](playtest.html#script). Little Ranch stays without links on purpose. Lighthouse Watch joined it after both merged.
- Lighthouse Watch v0.1.0 (2026-10-10, AC2): the second arcade cabinet, in the missile-defence shape. Storm sparks fall on four harbour boats; tap the sky (or aim and fire) to burst them with the lighthouse beam. Nights speed up, sparks split from night 3, a lost boat comes back every third night, three initials on a local high-score board, two-player turns. [games/lighthouse-watch/](games/lighthouse-watch/)
- Realmbound (2026-10-10): full ability names are larger on phones, desktop and ultrawide; wrapping keeps them readable, with separate shortcuts and cooldown counts.
- Otherworld (2026-10-10): choose a world directly from the Archivist's introduction, or keep reading; world, gift and name decisions remain yours.

- Design (2026-10-10): shared scene/interior layout outline, distinct Larkhaven home briefs, real entrance-input checks and small follow-up tasks for any assistant.

- Tell us (2026-10-10, AR2.11): every browser game's ⚙ Settings now has a "Tell us" row (Share feedback, Report a bug, Suggest an idea) that opens a GitHub issue with the game and version filled in, plus a ten-minute playtest script on [Come Play](playtest.html#script). Little Ranch stays without links on purpose.
- Lighthouse Watch (2026-10-10, AC2): the second arcade cabinet, in the missile-defence shape. Storm sparks fall on four harbour boats; tap the sky (or aim and fire) to burst them with the lighthouse beam. Nights speed up, sparks split from night 3, a lost boat comes back every third night, three initials on a local high-score board, two-player turns. [games/lighthouse-watch/](games/lighthouse-watch/)
- Godot Wildbond (2026-10-10, WB-PREVIEW): refreshed playable web pack with battle practice, the Thornwood trail, Lighthouse Spire and Champion rematches; updated guide and verified old journeys, browser reloads and phone-to-ultrawide screens. [Build notes](play/wildbond/BUILD.md).

- Godot Wildbond (2026-10-10, WB2.4 / H8, guest): the last two homes in Larkhaven. Two new cottages you can walk into, like the inn and the shop: Pip's home, where his mum is (and something Pip left by the window for you), and his gran's cottage by Juniper's, where she hums the harvest tune (and a jar of berries she picked too many of). Old saves standing where a cottage now is step out in front of its door.
- 2026-10-10: ART-SF-6 — original frontier props (barrel, crate, firewood, lantern, cart, bunting, empty plot) on one indexed sheet, with footprint metadata and a scale contact scene; assets only.

- 2026-10-10: ART-SF-5 — original frontier shops, well, job board and training yard, with footprint metadata and silhouette/contact review; assets only.

- 2026-10-10: ART-SF-4 — original Guild Hall and two-storey Inn, lit/unlit windows, stone footprints and scale contact sheet; art assets for review.

- 2026-10-10: ART-SF-3 — original pine forest edge, three tree sizes and clearing props, with footprint metadata and a scale contact sheet; asset review only.

- Starfall art (2026-10-10, ART-SF-2): original palisade runs, corners, ends and stakes, open/shut gate and lit/unlit watchtower, with footprints and a scale contact scene. Game integration remains SF2.6.

- Starfall art (2026-10-10, ART-SF-1): original frontier ground atlas, with moss variants, joining mud roads, packed earth and stone footings. Scale/contact patch and rerunnable generator; game integration remains SF2.6.

- Little Ranch v0.1.0 (2026-10-09, LR1, the smallest test): a toy for ages 2 to 4. A baby Cindercub to feed, bathe in bubbles and play peekaboo with behind the bush, until it yawns, the sky turns orange and it curls up to a lullaby. No reading, nothing to lose, no links out; grown-ups hold the corner lock for three seconds to leave or turn the sound off.
- Diamond Manager (2026-10-09, DM2 playtest): people on the field grow with the screen, Iona's welcome says how much budget room you have, and the owner now rewards a better losing season. Report: [docs/playtests/diamond-manager-1.md](docs/playtests/diamond-manager-1.md).
- Godot Wildbond (2026-10-09, WB5.1): the Lighthouse Spire opens after the Champion. Orla runs escalating three-partner floors from level 75 upward, with a full rest every fifth floor and the best floor saved; every defeated Warden also offers progressively stronger Champion rematches without re-awarding badges.
- Godot Wildbond (2026-10-09, playtest fixes, guest): the workbench's "Have it made (N coins)" button is no longer cut off (a row of buttons now sizes itself to its words), and "End of the trial..." no longer stays on screen after the first battle: the note now says your partner walks with you and the road leads to Thornwood, and it clears at the next door or road.
- Godot Wildbond (2026-10-09, WD4a): Thornwood is now three connected places—a winding trail, the original settlement, and Old Root Grove. The grove is a return spot opened by bringing a Stone creature, with a stronger chance to find Sunspark and a small Elderhorn clue; pre-expansion Thornwood saves keep their map and coordinate.
- 2026-10-09 (WB6.4, guest): guides/wildbond.html, a field guide for the new Wildbond (play/wildbond/): first steps, the element chart and Maren's ranch, with eight real captures of the early preview; linked from guides/index.html.
- Realmbound (2026-10-09, RB1.4): larger phone controls; notebook, dialogue and action bar fit portrait/landscape screens and larger text; XP bar clears ultrawide controls.
- 2026-10-09 (AC1, guest PR #119): Storm Front harbour cabinet, original cloud and lighthouse art, crumbling walls, gull bonus, three-initial scores and two-player turns. Keyboard, touch and gamepad controls; shared sound and settings.

- Arcade v1.5.0 (2026-10-09, AR2.12, the front door): one homepage style, the arcade hall (Evan: "make that one the ultimate one"); the living world and the road are gone and their vote is closed. Games sit in sections by kind (Adventures, Build and manage, Sports, Stories, Something different), each saying what its games are like, with buttons to jump to a section. Every game's card says what you do and its controls before you press Play. The hall's name labels no longer run off the left edge, and cabinet names fit on phones.
- Studio (2026-10-09, C4/E7): a lighting and music tuner. Pick any Realmbound zone or Wildbond area and slide its fog, shadow strength and colour grade over a live preview drawn with the arcade's light engine; pick any Wildbond, Realmbound or Starfall Guild tune and play it with its tempo, pitch and lead instrument changed. Preview only: tweaks stay in this browser (studio-tuner-v1, never a save) and the games don't use them yet.
- Wildbond (2026-10-09, water and phones held upright): the ponds, rivers and sea are our own art too (still water, a glint, lily pads), so none of the borrowed tiles are left in Wildbond's world. Holding a phone upright now shows a "Turn your phone sideways" card, and the game waits until you do.
- Wildbond (2026-10-09, our own art, part 1): Wildbond no longer looks like the other games. Its ground, trees, bushes, flowers, cottages and Maren's barn are now our own art: deep valley greens, broadleaf trees and dark pines, whitewashed cottages with slate-blue roofs and chimneys, and a red barn with a gambrel roof. The art direction, written so the look can grow toward 3D, is in docs/art/wildbond-art-direction.md.
- Wildbond (2026-10-09, Evan's playtest notes): a How to play page shows the controls for a keyboard, a phone and a gamepad side by side (the one you're using is marked). It opens before a new journey, from a new "How to play" button on the title page, and from the field book's Settings page. Roofs are solid now: the path behind Maren's barn (and a corner of Sunthread's hall) is closed, so you're never drawn walking across a roof.
- Wildbond (2026-10-09, WB6.1-6.2): play on a phone or with a gamepad, and a Settings page. On a touch screen a walking pad sits in the bottom-left corner and one button in the bottom-right says what it will do ("Talk", "Feed", "Meet", "Read"); taps still walk you anywhere, and every menu is tapped directly. Gamepads work too (the stick or the cross to walk, A to talk, B to go back, Y for the book). The field book has a fourth page, Settings: music, the sounds of each place and sound effects each have their own volume, larger text for speech, a faster battle pace (only the waiting shortens) and when to show the phone buttons. Settings stay with the device, whichever journey you play. The web preview is rebuilt.
- Diamond Manager v0.1.0 (2026-10-09, DM1): the baseball game becomes one you manage, after Evan found the batting game hard to read and harder to hit. Take over the Brackenport Lanterns: watch or sim each game with a play-by-play, set the batting order, trade (the other club says yes or how far apart you are), sign free agents, re-sign or let go, and spend the gate money on five ballpark upgrades. 30-game seasons, a best-of-three final, aging and contracts in the offseason. The batting prototype stays at games/diamond-career/ but leaves the shelf. Its saves are kept, but the arcade page now reports and resets Diamond Manager instead; the old prototype is reachable from Come Play. Plan: docs/plans/sports-management.md. tests/diamond-manager.html: 18 checks.
- Arcade (2026-10-09, playtest pass 1): [docs/PLAYTEST.md](docs/PLAYTEST.md) scores every game on six newcomer questions (what to do, controls, the core loop, readability, fun, phone) and sets the bar a game must pass before it ships; `tools/playtest/first-look.cjs` takes the screenshots.
- Wildbond (2026-10-09, WD2 part 1): four new body shapes, so whole families stop sharing one outline. Tidewyrm, Deeptide and Rillwhisk are serpents that ripple along the ground; Bogbough, Cairnclasp and Siltjaw are turtles with plated shells; Veilmote, Fogsail and Dawntassel are moths drifting on slow wings; Orchardroot, Flintroot and Meadowmantle are tree-folk on root feet. Picture: docs/screenshots/wildbond-wd2/new-shapes.png.
- Realmbound (2026-10-09, RB1.5): opened conversations wait for their reader; Focus fallback waits for the first victory, then gives the existing fifteen seconds. QuestHelper and background hunting respect dialogue. The sun and clouds sit below the title and health frames.
- Wildbond writing handoff (2026-10-09, T58): three inspectable late observations, Toren and Isolde's final-truth conversation, four depth-return lines and eight Warden responses. [Placement contract](docs/lore/wildbond-reveal.md); no playable behavior changes.

- Studio (2026-10-09, E5 part 1): creature and quest viewers. The Studio lists Wildbond's creatures, moves, evolutions and wild tables (browser and Godot) and Realmbound's quests, and marks in red anything the game checks would reject, with the reason. Today's data has no problems. Read-only; 8 new Studio checks.
- Studio (2026-10-09, E4 part 1): a text browser. The Studio now lists every line of dialogue, quest text, creature and item name and description in all eight games (browser and Godot), about 4,700 pieces, read straight from the games' own files, with a search box, game and kind filters, and where each line lives (file, line and data path). Read-only. 26 new checks in tests/studio.html.
- Otherworld (2026-10-09, X3): consistent character titles and Pocket Space wording; corrected the arcade summary to say "2 lives lived".

- Godot Starfall (2026-10-09): the apothecary's apprentice. Brew four batches yourself and Fen walks in, wanting to learn; for six coins a day Fen keeps the pot going whenever herbs come home. 130 checks pass.
- Wildbond (2026-10-09, WB3.6b): levels keep pace with the journey. A level used to cost about 24 wild wins at the start and nearly 400 by the last areas (the browser game's reward grew more slowly than the XP needed, which an idle game hid). Now a win is worth a share of the level you're fighting at, so a level costs about 12 even-level wild wins all the way through; trainer battles are worth more, stronger foes a little more, weaker ones less. Level caps still hold each area's pace.
- Wildbond (2026-10-09, WD1): the numbers are off the screen. The line of badges, lures, coins and Wilddex counts in the corner is gone; in its place is your satchel, with a pin on its strap for each badge, and tapping it (or Tab/J) opens the field book, which has a new Satchel page for your coins, lures, berries, badges and keepsakes in words. A place's name now shows large in the middle of the top of the screen when you arrive, with a dark outline so it reads on faded ground, then fades. Also fixed the late-game stall ChatGPT's pacing test found: a creature whose every move is still resting (Deeptide at Halen) no longer opens a menu with nothing to pick; it catches its breath while the battle runs on, and you choose as soon as a move is ready. All Wildbond checks pass (287 with the sound effects from main).
- Godot Starfall and Wildbond (2026-10-09): sound effects. Talking, the board, coins, the forge (a clang for a good strike), the tap, the brewing pot, Hob's crew, the town's rank and good or hard days in Starfall; every element's hit, healing, the lure, a creature choosing you, wins, level-ups, the shop, the field book and badges in Wildbond. N turns them off. From the Ninja Adventure pack (CC0); the list is in docs/learning/assets.md.
- Godot Starfall (2026-10-09): feelings over heads. A heart for a fine pour or fine gear, a smile after a meal you served, "..." when someone has waited too long at the counter, "!" when they want a word, a broken heart when someone leaves, and now and then very low or very high spirits. Wildbond's trainers show the same "!" bubble when they spot you. 127 Starfall and 282 Wildbond checks pass.
- Arcade housekeeping (2026-10-09): both Godot games now save safely (a spare file first and the last good save kept as a backup, so a crash or a closed tab can never cost a journey or a town); the Wildbond web preview is a fifth smaller (its place sounds are stored as OGG and places that share a tune share one file); one command runs every check (`node tools/run-all-checks.cjs`) and GitHub now runs them on every push and pull request. Wildbond 277 and Starfall 119 Godot checks pass, and all eight browser pages.
- Starfall planning (2026-10-09, T57): [four seasonal village chapters](docs/plans/starfall-village.md#sf33--t57-four-chapters-in-the-same-village), each with a threat, festival and newcomer. Design handoff only; essential story never waits for a calendar date.
- Wildbond pacing (2026-10-09, T56): [actual Godot late-area and league diagnostic](docs/wildbond-godot-pacing.md), reproducible without player saves. Reports progression deficits and late move cooldown stalls; no gameplay tuning.
- Wildbond writing audit (2026-10-09, T55): [final-truth clue fit and three proposed late observations](docs/lore/wildbond-final-truth-audit.md) for Claude's review. No new playable dialogue or behavior.
- Godot Starfall (2026-10-09): the Tavern. Build it on a plot and adventurers with savings drop in each evening; you pour, and a well-judged pour earns a tip and lifts their spirits. Pour enough and Tamsin asks to run the tap. Leave it unserved two evenings and it shuts its shutters until you open it again. Where you build matters a little: near the inn the room is livelier, and a smithy beside the training yard makes practice count double. 116 checks pass.
- Godot Wildbond (2026-10-09): the homecoming. After you beat the Champion, Maren and Isolde are waiting at the league gate with Wren, Avenne walks down to join them, and everyone quiets for water and rest. Every Warden now welcomes you back as Champion. Written by ChatGPT. 273 checks pass.
- Wildbond content (2026-10-09, T54): exported post-Champion gate scene and eight Warden return conversations. [Staging/dispatch contract](docs/lore/wildbond-champion-returns.md). New fields only; Godot integration remains with Claude.

- Wildbond finale handoff (2026-10-09, T53): existing league script, an optional homecoming and a thread payoff map for Claude's Godot build. [Writing contract](docs/lore/wildbond-finale-brief.md). Unresolved mystery truths remain open; no playable behavior changed.

- Godot Wildbond (2026-10-09): the Returning Light League. With all eight badges the road north from Farwatch opens: Wren waits at the gate, then four courts in order (listening, shelter, shared work, an honest record) and Champion Avenne on the terrace. Nelva heals your team between rooms; lose a court and the courts begin again. Win, and everyone you met is waiting at the gate. The new Wildbond can now be played from start to finish. 269 checks pass.
- Godot Starfall (2026-10-09): every adventurer now has a three-part story. Kaito, Hana and Sora, who arrive as the town grows, each have their own (a bow that sings, a knight learning to listen, a monk learning from real people), and Aki, Ren and Yuna each get a closing chapter. Written by ChatGPT. 106 checks pass.
- Godot Wildbond (2026-10-09): the seasons come alive. Wild creatures shift with the season (a few visitors favour one season and are rare in the others), everyone has a word about the time of year, and on festival days Maren invites you to join in: plant a flower that stays at the ranch, run a lap with your partner, fill the trough for the harvest supper, or make a gift at the workbench and give it to someone in town. Each festival gives a keepsake, kept in your field book. 260 checks pass.
- Starfall writing handoff (2026-10-09, T52): three-beat arcs for Kaito, Hana and Sora and closing beats for Aki, Ren and Yuna. [Additive JSON and integration contract](docs/lore/starfall-member-stories.md); not playable until Claude wires it in.

- Wildbond festival writing (2026-10-09, T51): four traditions, Maren and Pip conversations, activity invitations/completions and cosmetic keepsake names. [Integration contract](docs/lore/wildbond-festivals.md). Exported writing only; the calendar and activities remain Claude's Godot work.

- Wildbond content handoff (2026-10-09, T50): four seasonal encounter tables per region, four existing visitors rare year-round, and 96 seasonal observations for route residents. [Schema and canon boundaries](docs/lore/wildbond-seasons.md). Export-only; Classic's encounters and conversations stay unchanged, with no release bump.

- Godot Wildbond (2026-10-09): festival decorations in Larkhaven. Planting Day ties ribbons on the fences and sets out a seed table; the Long Light strings lanterns over the street; the Harvest Lanterns puts carved lanterns by every door and a supper table on the green; the Midwinter Hearth hangs garlands of coloured lights on every house and raises a big tree with a star and gifts. On the real calendar, the Midwinter Hearth falls on 20 to 31 December.
- Godot Wildbond (2026-10-09): the four seasons. The world keeps its own calendar (a season is about two and a half hours of play): blossom and petals in spring, orange trees and fallen leaves in autumn, snow on the roofs and fields, frozen ponds and falling snow in winter. The date is in the field book; press C there to follow the real calendar (winter in December) or keep one season. Festivals come next. 254 checks pass.
- Godot Wildbond (2026-10-09): Farwatch Reach, the eighth and last area before the league: a stone lookout with a lamp room, the harbor house with nets drying, a pier with shore lanterns, Rysa's open ledger and the sound of waves. All eight areas are now in the new Wildbond. 245 checks pass.
- Godot Wildbond (2026-10-09): Sunthread Commons, the seventh area: a timber meeting hall with pennants on its turf roof, a sunny forecourt where Pell, Nesla and Warden Halen wait, Mirel's mending frame, the weaver's bench with four braided ties, nursery beds with green ribbons, and a bright tune. 239 checks pass.
- Wildbond build handoff (2026-10-09, T49): [Sunthread](docs/lore/wildbond-sunthread-brief.md) and [Farwatch](docs/lore/wildbond-farwatch-brief.md) briefs gather current exported routes, people, creatures, clues and badge payoffs. Proposed staging is explicit; stale Warden levels and the historical future-finale paragraph are flagged. No gameplay or version change.
- Realmbound v1.8.0 (2026-10-09, T48): Walk the road opens an optional town approach, the Lantern Rest inn and a courier's camp. Talk by the hearth, rest at the usual pace or buy a potion; connected paths preserve existing travel and combat. All eight test pages pass. No release version change.
- Godot Wildbond (2026-10-09): trees stand at their true height. Walk behind one and its crown passes in front of you, see-through so you never lose yourself, and washed out like the world around it until the colour comes back. Signs and things on the ground are never hidden. 234 checks pass.
- Godot Starfall (2026-10-09): good and hard days show in the street. Each evening says how the day went; a run of good days hangs bunting, brings more work to the board and draws travelling adventurers (Mirelle and Tobin); hard days quieten the board, and someone who loses heart walks out the gate, but may come back when things improve. 104 checks pass.
- Godot Wildbond (2026-10-09): Hollowecho Hills, the sixth area: the bell keeper's stone house with two bells swaying under the eaves, the surveyor's cord and chalk arrows, cave mouths, resting stones by Warden Senna's cave, low mist and a quiet tune. 232 checks pass.
- Wildbond build handoff (2026-10-09): [Hollowecho area brief](docs/lore/wildbond-hollowecho-brief.md) gathers the existing route, people, teams, creatures and woven clues for the Godot build. It separates proposed staging from canon and flags Senna's stale documented team levels; gameplay is unchanged.
- Arcade (2026-10-09): the current Wildbond and Starfall previews have screenshot cards and direct doors on the launcher. Classic games and progress remain separate; first-load and save guidance is explicit. Keyboard road panning keeps focused doors visible. [Checks and scope](docs/launcher-previews.md).
- Godot Wildbond (2026-10-09): Stillreed Basin, the fifth area, is open: wooden footbridges over the river, its trainers and Warden, the sound of running water and its own tune, the ferry skiff moored at the landing with a sign you can read, the current running down the river, cattails, windfall under the orchard and dragonflies. 225 checks pass.
- Local helper (2026-10-08): preserve the runtime tool-permission order in both task modes; 19 runner checks pass.
- Otherworld v0.4.0 (2026-10-08): all eleven soul memories open practical uses across worlds; six people remember help, harm and repaired trust within a life. Promised cart journeys, shared winter reserves and witnesses happen in portrait conversations. Old saves and Return retain their rules.
- Wildbond v1.8.1 (2026-10-08): early-road heritage recognition (T45): Eleven existing early-road people and all four Wardens have a distinct line for each origin, with clues recorded in the thread ledger. The existing Godot export carries all 60 reactions; Classic conversations and gameplay stay intact. Claude wires the data into Godot; no release bump.
- Accessibility (2026-10-08; Realmbound v1.7.0, Otherworld v0.4.0, Diamond Career v0.4.1): Shared dialogue and Settings respect focused controls; complete scene lines are available to screen readers. Realmbound has named walking destinations inside its world. Larger text, visible focus and opaque reading surfaces improve the launcher, Realmbound, Diamond Career and Otherworld. [Verification and remaining gaps](docs/accessibility.md). No release version change.

- Realmbound v1.7.0 (2026-10-08): shared creature species and short hunter observations appear beneath beast targets, covering all 31 zone beasts and 17 dungeon encounters. Local names, palettes, pets and combat stay the same; the normalized catalogue exports from Wildbond data.

- Realmbound v1.7.0 (2026-10-08): walk into the Trainer and Stable, arrange guild work at the board and supplies at the chest, and meet quest givers in town. Carried pages keep records; service choices happen over the world. Old saves and existing prices are preserved.

- Local helper (2026-10-08): queued local tasks use OpenCode, attach the project primer and lessons, and stop for failed tools or incomplete answers. Reports and edits require review; source in tools/local-ai/.

- Otherworld v0.3.0 (2026-10-08): the Ashen Throne opens: Kael, a fallen house, three costly gifts, five final outcomes plus a death route, Return's remembered dawns and cross-world knowledge. The guide now covers all three worlds.

- Wildbond v1.8.0 (2026-10-08): four later-road witnesses, fair clues in signs and Warden lines, and small mysteries answered after each badge. Heritage recognition is ready as exported data for the Godot areas.

- Otherworld v0.3.0 (2026-10-08): Hearthmere opens: the Reedlight Inn, Puddle, three gifts with real costs, a winter that answers your choices, four endings and memories shared with Asterhold.

- Realmbound v1.6.0 (2026-10-08): the world fills the window, with a Quest Journal and Satchel opened over it, a folded road map and all existing pages in the Field Kit. Reading pauses the world; portrait scenes remain in place. Four sizes checked, no save or balance changes.

- Wildbond v1.8.0 (2026-10-08): fourteen new creatures across eight empty family/element pairs, three long growth lines, three never-evolvers and a conditional Saillet branch authored for Godot. Reach lore maps all 31 zone beasts without changing Realmbound. Browser roster: 107; 1,485 checks.

- Diamond Career v0.4.0 (2026-10-08): the scene fills the window; locker, calendar, notebook and pay envelope replace the side panel. A deliberate second-month road term visits three parks with bus preparations, local people and calendar salary; 122 checks.

- Previews and a trailer (2026-10-08): the new Wildbond and Starfall play in the browser (play/wildbond/, play/starfall/), and a one-minute trailer opens the Come Play page.

- Come Play page (2026-10-08): playtest.html is now the page to send friends: what each game does today, where it's heading, what playing feels like, first steps and help if you're lost, pictures, and Wildbond's element chart. Wildbond v1.7.1: the starter page shows each stat's number, and the bars measure against the strongest creature known (120), said on the page. Wildbond Godot: the same yardstick on every creature page, and your partner steps round to stand beside you instead of peeking over your head.
- Otherworld v0.2.0 (2026-10-08): a living Lanthorn over three days, visible locked choices, consequences for every gift, changing bread prices and neighbors, and memories recognized by the Archivist. Reload-safe scenes and endings; 831 checks.

- Realmbound (2026-10-08): illustrated guide to walk-in Inn and Smithy services and level-55 guild commissions, with costs generated from the game data.

- Diamond Career v0.3.1 (2026-10-08): batting you can see. Nothing covers the field while the ball is coming: tap anywhere on the field (or press Space) to swing, a circle at the plate lights up at the moment to swing, the controls sit high on the field clear of the plate, and the at-bat box says plainly how to hit (Evan's report).

- Realmbound v1.5.0 (2026-10-08): level-55 guild commissions at the Smithy, with rare gear for every class and slot, visible previews and complete supply/coin costs before confirmation.
- Checks (2026-10-08): Otherworld browser tests restore recovery backups as well as saves and hub progress; a 35-check regression page covers failures, exceptions, timeouts and overlapping clicks.


- Realmbound v1.4.0 (2026-10-08): regional town layouts, Fenwatch boardwalks, Lanternrest snow, walk-in Inns and Smithies with keepers offering rest, scrap sales and repairs.

- Realmbound v1.3.0 (2026-10-08): ten guild story choices can now hurt a member's trust, with a way to make amends by the hearth (ChatGPT); story text rewritten in the world's words (Claude). Illustrated guides for Realmbound, Diamond Career and Otherworld, and Realmbound tips.

- Realmbound (2026-10-08): ten guild stories gain warned choices that can hurt trust, immediate portrait responses and one-time conversations to make amends; older decisions keep their original endings.

- Guides (2026-10-08): real game pictures, a Realmbound tips booklet, and starter guides for Diamond Career and Otherworld.

- **Diamond Career v0.3.0 (2026-10-08):** Contact/Power choices and results on the field; off-plate and good/weak-contact explanations; earned Eye cue reliability explained by Iona in a portrait scene and her notebook. 102 Diamond checks pass. No version bump.

- Realmbound v1.2.0 (2026-10-08): three personal story moments for every guild adventurer, unlocked by present party time, mood and friendship. Remembered decisions have two lasting narrative outcomes; Auto never chooses them. Conversations happen in the physical hall; the Guild tab only records what was heard. Old saves, independent supply favors and rejoining members keep their progress. All seven test pages pass (6,683 Realmbound checks); phone, laptop, desktop and ultrawide checked. No version bump; PR #49, docs/realmbound-member-stories.md.
- **Wildbond v1.7.0 (2026-10-08):** twelve new roster definitions fill ten family/element gaps; eleven available through early-road encounters/evolution, including single-form Hearthlaugh. Veilmote reserved for a future encounter. Proposed shared-catalogue habitats; 1354 Wildbond checks pass.

- Realmbound v1.1.0, onboarding (2026-10-08): a skippable arrival ends on the existing first questgiver, followed by optional contextual guidance for Focus, loot, reward choice, town services and actual companions. Returning saves stay quiet; all seven test pages pass. No version or cache bump; see docs/realmbound-onboarding.md.

- Diamond Career v0.2.0, first month (2026-10-08): a second contract with explicit pay/opportunity tradeoffs, 18 possible professional games across 30 calendar days, Iona's recorded coaching notes and a personal month recap. Old payment IDs and possessions persist; all seven test pages pass (83 Diamond checks). No version/cache bump; docs/diamond-career-first-month.md.

- Diamond Career (2026-10-08): a new first-payday prototype with an original evening ballpark, two batting styles, six development games, visible call-up targets, two contracts, calendar salary and lasting home/garage purchases. Shared saves, settings, sound, feedback and launcher integration; tests/diamond.html and all six existing test pages pass. See docs/diamond-career-first-payday.md.
- Research (2026-10-08): preserved Gemini's Starfall report with a review against the current rules; archived answered Wildbond/Godot/Realmbound/Starfall prompts. docs/research/gemini-prompts.md now lists only unanswered Diamond Career, Otherworld, arcade and optional Primordial briefs, revised for current owner decisions and neutral playtests. No gameplay changes.

- **Wildbond v1.6.1 (2026-10-08)** — **A fairer first battle.** Wren always picks the partner whose element beats yours,
  and every starter knew its element move from level 1, so the first battle was lost fast: measured over 100 battles
  each with sensible moves, Cindercub won only 5. Starters now learn their element move (Ember Snap, Bubble Jet, Vine
  Lash) at level 5: your partner arrives knowing it, Wren's level-4 partner learns it a little later. Now Cindercub wins
  97 of 100, Ripplet 78, Mosshog 100, and battles last a turn or two longer. Measured with the Godot trial's copy of the
  rules (`wildbond-godot/tests/battle_odds.gd`), which gives the browser's exact numbers.
- **Otherworld v0.1.0 (2026-10-08), a new game** — Your old life ends. In **the Between**, a starlit library of lives,
  the Archivist lets you choose your next world (Asterhold now; Hearthmere and the Ashen Throne are still being
  woven) and one gift, each a strength with a cost. Live a life in **Asterhold**: wake in a hay cart, touch the guild
  crystal and watch your **status window** appear, meet Mira, and make three choices that branch toward a beast tide,
  with eight endings (hopeful, bittersweet, strange, and a couple of deaths). Your soul keeps memories that open new
  choices in your next life. Playable from the homepage (a portal at the end of the road). Arcade v1.4.0.
- Realmbound (2026-10-07): documented the first-ten-minutes browser audit and onboarding brief; the guide explains immediate Focus fallback and manual quest rewards. No gameplay changes.

- Realmbound (2026-10-07): a lore-first field guide, first fifteen minutes, systems, earned addons and tips, with late discoveries folded away. [Read the booklet](guides/realmbound.html); reference tables follow current game data.

- Wildbond (2026-10-07): cosmetic Gleaming colours, tiny/huge sizes and individual markings, with inherited egg looks and seen/bonded Wilddex notes. Old creatures stay ordinary; stats are unchanged. [Design and checks](docs/wildbond-variants.md).

- **Wildbond v1.5.2, Realmbound v1.0.3 (2026-10-07)** — Wildbond: a day (and the ranch day) now lasts an hour
  instead of five minutes; autopilot and Auto-explore are switched off for now; the late areas' levels are smoothed
  so Wardens sit within your level cap (ChatGPT's launch balance). Realmbound: levels 40-60 in the last three zones
  now take about 20 hours as designed (they took about 10; ChatGPT's launch balance).
- **Wildbond v1.5.1 (2026-10-07)** — Battle results wait for you to press Continue (and a loss says what happens
  next); your tamer wears a red shirt and blue cap so you can find them; the view starts close; the faded start is
  softer; the Ranch only appears once a creature has bonded with you, breeding after the first badge, and challenge
  pennants only on a challenge journey. The bigger redesign Evan asked for (all game world) is planned in
  docs/wildbond-immersive.md.
- **Realmbound (2026-10-07):** launch pacing audit across five classes and three journeys; late-zone XP aligned with the 40–60 budget, reproducible browser simulations and 23 save/bonus regressions. Details: [audit](docs/realmbound-launch-balance.md).

- Wildbond (2026-10-07): smoother Stillreed entry and late Wardens within incoming badge caps; a reproducible full-run pacing audit across three journeys and four challenges, with failed challenge attempts recorded separately. [Measurements](docs/wildbond-launch-balance.md).


- **Wildbond v1.5.0 (2026-10-07)** — From Evan's second play: **turn-based battles** for new journeys (the battle
  pauses on your creature's turn and you pick its move, each described in plain words; the real-time style is in
  Settings), **no autopilot until your first badge** (it used to take over from the first second), a new journey
  starts **in faded colour** instead of four greens (the Thorn Badge brings full colour back), **no menu buttons that
  skip the world** (walk to the inn, the shop, the Warden and the road; riding to visited places is earned with the
  third badge), and creature cards that say what a creature is good at (Tank, Bruiser, Caster...) and what every
  stat and move does.
- **Wildbond v1.4.0 (2026-10-07)** — **A clearer start** (from Evan's first play): tap a partner to see its Wilddex
  page (stats, moves, strengths), choose a story name, roll a random one or type your own, then press **Begin**.
  Challenge modes now unlock once you've been Champion. After the first battle Maren explains where your creatures
  live and hands you her **Wilddex**, with a goal: over a hundred kinds to find. Two of her opening lines that a typo
  had hidden are back. Plan for the rest of the opening: docs/wildbond-opening.md.
- **2026-10-07** — **Easier on phones.** Every button, tab and menu in every game is now big enough to tap
  comfortably on a phone or touch screen (desktop is unchanged), and phones open the homepage on the road style.
- **Arcade v1.3.0 (2026-10-07)** — **The road**, a third homepage style: walk your character (with a partner creature
  trotting behind) along a road through the arcade's world, from Primordial's tide pool past Larkhaven, Thornvale and
  the Starfall gate to the building sites of the games still being designed. Arrow keys, or tap a place to walk there
  and go in. New games simply extend the road. The vote now asks which of the three you like best.
- **Arcade v1.2.0 (2026-10-07)** — **The homepage is a place now, in two styles you can vote on.** *The living world*
  is one landscape on your real clock where each game is somewhere you can go: Primordial's tide pool, Larkhaven,
  Thornvale's walls and the Starfall gate (stars and lit windows at night). *The arcade hall* is a cozy room of
  cabinets playing each game's cover; walk along and step up to play. Switch between them and vote for your
  favourite. Votes are a new shared feature any game can use (docs/VOTES.md).
- **2026-10-07** — **A Settings panel in every game** (the ⚙ button in the header): sound, graphics quality, Wildbond's
  view distance, and two choices that follow you across the whole arcade: **text size** (Normal, Large, Larger) and
  **motion** (follow your device, Reduced, or Full).
- **2026-10-07** — **Your saves are safer in every game.** Each game now keeps automatic backups (a recent one every
  10 minutes and one a day for three days); if a save is ever damaged, the game quietly loads the newest backup
  instead of starting over. A new **Your save** box (Wildbond's Journal, Realmbound's Journal, Starfall's Ledger)
  downloads your save as a file, loads a save file (for moving devices) and restores any backup.
- **Realmbound (2026-10-07)** — Reviewed Rootrot and Heartwood's normal and Heroic loot against Sanctum and Foundry; added browser checks through Heroic 30 and a high-tier boundary. Existing balance and rewards are retained.

- **Realmbound v1.0.2 (2026-10-07)** — **Every zone has its own light.** Sunsets are warm and golden instead of a grey
  wash (the night now falls after the sun sets, not before), each zone has its own night (violet desert, ember-red
  ridge, murky teal marsh, olive forest, amber Crown's Heart...), and light bounces off each zone's ground.
- **2026-10-07** — **Offline play always stays up to date.** The installable arcade now loads the newest version
  whenever you're online and uses its saved copy only without internet (or on a very slow connection), so updates
  never get stuck. The homepage header now has What to try, Credits and Install together.
- **Wildbond v1.3.0 (2026-10-07)** — **The Lighthouse Spire:** Champions climb themed trainer floors from level 75 to 100, rest every five floors, and keep a best-floor record. Coins and lures each floor; once-only ten-floor milestones give Lantern seed, titles and rare ranch eggs. Auto earns less and waits at rest choices. All five league trainers offer one rematch per ranch day. Existing badge caps and saves stay intact.
- **Wildbond v1.3.1 (2026-10-07)** — **Saltmarsh Coast lighting:** lower, thinner sea mist, blue-and-sand bounce light, gentler shafts and a softer colour grade in the lit art eras. Paths stay clearer in mist; other areas keep their original lighting.

- **2026-10-07** — **Wildbond: see more of the world.** A new **View** button (or the V key) switches between Close,
  Wide and Far, so a big monitor shows more of the map instead of bigger tiles; desktops and ultrawides start on Wide,
  phones on Close. Works in every art style. Also: arrow keys inside the Feedback menu no longer walk your tamer.
- **Wildbond v1.2.0 (2026-10-07)** — **The Returning Light League**, the story finale after all eight badges: Wren at the gate, four themed courts with healing rests, Champion Avenne, and a homecoming with Wren, Maren, Isolde and the guardians. Earn the Champion title and record the fully restored colour in the Journal. Cleared courts survive losses and reloads for the current ranch day; leaving ends the attempt. Post-game adventures remain future work.
- **Wildbond v1.1.1 (2026-10-07)** — **Stillreed ferry landing:** visible raised board crossings, a moored reed-green skiff and a landing sign in every art era. The jetty is walkable, the boat stays moored, and existing routes, trainers and saves keep working. W7 town interiors remain to do.

- **Realmbound v1.0.1 (2026-10-07)** — **Frostmere winter light:** low snow haze on the road and in its walkable hubs, cooler reflected light and clearer blue mountain layers. Warm night fires and windows remain visible; dawn, weather and the shared day/night shadows still shape the scene.
- **Arcade v1.0.1 (2026-10-07)** — **What to try (F4):** the homepage links to short version-stamped playtest routes for Wildbond and Realmbound, with optional prototype checks and feedback links. New players and existing saves have separate starting points. See [playtest notes](playtest.html) and [maintainer guide](docs/playtesting.md).
- **Arcade v1.0.1 (2026-10-07)** — A Credits page linked from the hub thanks the contributors and lists the ten font families and three.js used by the arcade. CREDITS.md records sources and usage; full third-party notices are included under licenses/. The page works without JavaScript.
- **Arcade v1.1.0 (2026-10-07)** — **Install and offline play (L5):** the hub prepares all four games for offline use and offers installation when supported. Updates wait for open arcade tabs to close; saves stay in the browser. External fonts fall back locally, and offline Wildbond uses HD-2D when three.js is unavailable. See [offline guide](docs/offline.md) and [browser checks](tests/offline.html).

- **2026-10-10** — **Save doctor** in the Studio: pick a game to see its save at a glance (heroes, team, badges, coins),
  a health check that spots broken values (an empty level, negative coins, a missing current hero) with a one-click
  fix, and every field in plain words, searchable and editable. Nothing is written until you press Save, and the old
  save is backed up first.
- **2026-10-10** — **Readable on big screens.** On desktops and ultrawides, the panels, text and buttons now grow
  with the screen (about 1.1x on a 1920 desktop, 1.3x on a 3440x1440 ultrawide), so nothing is tiny next to the big
  scene. The scenes themselves stay sharp and taps still land exactly where you click.
- **2026-10-10** — **Big screens.** On desktops and ultrawides (like Evan's 3440x1440) every game now uses the space:
  the scene takes most of the width and becomes a cinematic 21:9 view on ultrawides (more of the world when you walk,
  more of each zone in Realmbound), the panels sit beside it, and the homepage shows bigger covers. Phones and laptops
  are unchanged. Also merged: Wildbond's eighth area, **Farwatch** (ChatGPT): Warden Rysa, the Horizon Badge (cap 75),
  the guardian Watchlight, and Wren's last rematch before the league (Wildbond v1.1.0).
- **Wildbond v1.1.0 (2026-10-07)** — **Farwatch Reach**, the eighth and final pre-league area (66–72): nine species, a coastal harbor map, two route trainers, Wren's shared-notes rematch, Watchlight, and Warden Rysa's Horizon Badge (cap 75 with eight badges). Original music, fog weather and a coastal battle backdrop. The league follows in W2.

- **2026-10-10** — **The Studio** (`studio.html`, not linked anywhere so players never see it; bookmark it): Evan's game-master tools. Turn on GM mode
  and every game gets a GM panel (Ctrl+Shift+G): give gold, coins, items and creatures, set levels and badges, teleport,
  change the time of day and the weather, heal, grant the Hollow Key, add supplies and guild experience, reset raid
  lockouts. Saves are backed up automatically before the first change, every action is logged, and the Studio can
  back up, download, import and restore saves.
- **v1.0.0 (2026-10-10)** — **Version numbers and a Feedback button in every game** (built by Jules, Google's coding
  agent, its first contribution). Each game and the homepage shows its version, and a Feedback button opens "Share
  feedback", "Report a bug" or "Suggest an idea", with the game, version and where you are already filled in.
- **2026-10-09 (evening)** — **Light and shadow, inspired by WoW: Forever.** A new shared light engine: the sun and
  moon cross the sky with each game's clock, and every hero, creature, tree, lamp post and building casts its own
  silhouette as a shadow that swings and stretches through the day (long and golden at dawn and dusk, faint under the
  moon, and away from torches and lit doors at night). Shadows carry colour from the sky and ground instead of flat
  black. Each zone and area has its own fog you move through (thick in the Fens, golden in the Hollow Crown, smoky on
  Ashen Ridge, cloud in Cloudglass Pass) with light scattering through it, low sun throws light shafts, the colour of
  the hour grades every scene, and bright lights bloom softly. Realmbound's header has a Graphics High/Low button.
  Also new: `docs/PROJECTS.md`, the master list of everything planned, and `docs/CREATIVE.md`, the ground rules.
- **2026-10-07** — Wildbond area 7: Sunthread Commons (62–68), reached from Hollowecho Hills with the Echo Badge.
  Nine new species, Clovercolt evolving into Bloomcourser at 64, Wren's gathering rematch, Meadowmantle guarding
  the nursery, and Warden Halen's Loom Badge (cap 70). Winding meadow paths, a meeting hall, two route trainers,
  three supplies and Pell visiting the gathering; clear mornings and sudden rain, an original zone tune, and
  meadow hills with drifting leaves behind battles.

- **2026-10-09 (later)** — **Realmbound's hubs get their own character.** Wildclan hubs are now camps: hide tents
  around a great firepit with real flames and smoke, torches, a palisade and a painted totem (the Longhouse, Forge,
  Guild lodge and Corral). Thornvale's inn is the Abbey, with a bell tower. **You can walk into your guild hall:** a
  long room with a red rug, long tables, banners, candles and a roaring hearth, where your guild adventurers gather;
  talk to them for their mood, give them their favor right there, and use the chest and jobs board. Wildbond's walking
  now runs on the same shared engine as Realmbound's towns.
- **2026-10-07** — Realmbound guild raids can draw adventurers from all your heroes, at their owners' levels.
  Gathering pays and stops their jobs; raiders stay reserved across hero switches and reloads, then are free
  when the run ends. Friendship and memories stay with the original companion. Existing raid gates and balance remain.

- **2026-10-09 (late night)** — **Realmbound's towns are places now.** Arriving in town, the scene turns into the hub,
  seen in HD-2D like Wildbond: walk around with the arrow keys or WASD or by tapping, and talk with Enter. The Inn
  heals everyone, the Smithy buys your junk and repairs, the Trainer, the Stable and the **Guild hall** open their
  tabs, the quest giver offers the next quest in a scene, Pip lights the lamps at night, and now and then Pell the
  peddler and his mule Brisket come through selling healing potions. Windows and lamps glow at night, and the town
  gets the zone's weather. On Auto your hero strolls to the smithy and out of the gate. This runs on a new shared
  world kit, and Wildbond's HD-2D view now draws through the same engine.
- 2026-10-07: Wildbond Hollowecho Hills (58–64): nine species, Wren's listening rematch, Undertone and Warden Senna's Echo Badge (cap 65), a winding map beyond Stillreed with two trainers, mist and an original tune.
- 2026-10-07: Wildbond's Journal shows current weather and the next two periods for unlocked routes after the Tide Badge, with notes on which creatures favor each condition.
- 2026-10-07: Wildbond battles in 16-bit and later styles keep their region's scenery, weather and night: woods, coast water, highland stone, cloud peaks and basin reeds. Combat and earlier art styles are unchanged.
- 2026-10-07: Wildbond challenge titles now display four original pennants in the Ranch tab. Existing earned titles work immediately; these decorations give no stat bonuses.
- 2026-10-07: Quiet rain sound follows the weather in Wildbond and Realmbound through the shared sound engine. Off by default; fades between conditions and stops on hidden pages or sound off. Shared sound checks: tests/sound.html.
- 2026-10-07: Realmbound guild adventurers can ask a first supply favor in their own voice. Help in town from the shared bank for mood, friendship and guild XP; each favor is recorded once, even after dismissal and re-invitation.

- **2026-10-07** — Wildbond area 5: Stillreed Basin (52–60), beyond Cloudglass Pass. Nine new species include
  Reedlet's evolution into Ferrycrest and the guardian Stillwake. Wren helps free a ferry rope before the rematch;
  ferryman Warden Olan awards the Reed Badge, raising the existing cap to 60. Walk the reed banks, board crossings
  and orchard, meet two route trainers, find three supplies, and hear an original basin tune between rain showers.

- **2026-10-09 (late)** — **Realmbound: found a guild.** At level 40, in town, buy a charter (5 gold) and gather five
  signatures from your other characters and companions who are your Friends. One guild for your whole account: every
  character is a member and you can invite the adventurers you trust. Adventurers have a **mood**: group with them,
  give them loot and clear dungeons together and they're happy (and work faster); leave them benched too long and
  they'll tell you, then leave. Members can work the jobs board, including the new **Guard duty**. The guild levels up
  from quests, dungeon clears, raid bosses and guard duty: up to +10% experience for every character and six job slots.
  The Supplies tab is now the **Guild** tab.
- **2026-10-09 (late)** — Wildbond's opening now explains its faded green look: the world lost its colour long ago,
  and it comes back with the first badge. (Evan saw green sprites on a fresh start and took it for a bug.)
- **2026-10-09 (night)** — Realmbound's quest log now tells you when an attunement quest is waiting: "will offer this
  once you have cleared the Silent Barrows and Rootrot Hollow". The raid was re-tested at the new level cap of 60.
- **2026-10-09 (evening)** — **The worlds come alive** (a new shared ambience system, inspired by a living pixel-art
  scene Evan saw). **Realmbound:** every zone has its own sky and distant scenery that scrolls past as you travel
  and sways in the wind (Thornvale's oaks, Redsand's mesas, dead trees and reeds in the Fens, glowing volcanic peaks
  on Ashen Ridge, snowy peaks and pines in Frostmere, standing stones in the Barrowfields, giant canopy trees in the
  Hollow Crown); weather that changes every few minutes, including **thunderstorms with lightning and thunder**,
  blizzards, fog, dust and ashfall; birds, bats at dusk, fireflies, grave-wisps, spores and a distant drake; a day and
  night every 24 minutes with stars, the moon and the aurora over Frostmere; a campfire when you rest, the inn's
  windows glowing at night, flickering torches in dungeons and braziers in the Hollow Throne. **Wildbond:** rain
  with splashes and thunderstorms, embers over Emberfall, glittering cloud in Cloudglass Pass, fireflies at night and
  real pools of light around you and at every door in town. **Starfall Guild:** living torches and a window on the
  night sky where a star falls now and then.
- **2026-10-07** — Realmbound: the Crown's Heart (T23) extends the journey from 52 to the level-60 cap.
  Heartwatch Camp, six ordinary threats, Aurethyn the legendary tameable drake, fourteen voiced quests and the
  Heartwood Vault (56+) lead to the Hollow Key. Its final three quests require clears of the Silent Barrows and
  Rootrot Hollow; completing the last unlocks the existing Hollow Throne raid. Includes original zone music and
  measured Focus pacing. Locked attunement quests remain hidden in the log pending a separate UI change.

- **2026-10-09 (later)** — **Realmbound's first raid: The Hollow Throne.** Ten people: you plus nine from your
  companions and your own other characters (two tanks and two healers at least). Four bosses, each with one thing to
  watch for: the Bark Warden shreds its tank (call **Swap!**), the Ashwing Brood hatches adds (**Adds!**), the
  Rootbound Choir sings two songs (**Spread!** or **Stack!**), and Seraveth does all three before an enrage. Before
  each boss you pick a plan; during the fight you make the calls (buttons or S, A, Q, W). Auto makes calls too, badly
  at first but better after each wipe, and reliably once you've cleared it (Raid Leader). Bosses stay dead for 3 days.
  Epic loot and a five-piece set for your class with set bonuses. It opens with the Hollow Key from the Crown's Heart.
- **2026-10-09** — **Realmbound: a third talent tree for every class** (Warrior Fury, Rogue Subtlety, Mage Arcane,
  Priest Discipline, Hunter Survival), each with new abilities (Bloodthirst, Death Wish, Shadow Dance, Arcane
  Missiles, Penance, Pain Suppression, Explosive Shot...) and talents that change how you play: a wider Finishing Blow
  window, repeat Backstabs, Smites that heal your party, stings that make your next shot instant. Everyone gets one
  more free talent reset. **The jobs board grew:** Herbalism (herbs brew healing potions, drunk automatically below
  30% health) and Questing (a benched hero slowly earns their own XP and gold). **Starfall Guild has sound now**
  (ChatGPT, T26): its own town, delve and boss music on the arcade's shared sound system.
- **2026-10-07** — Starfall Guild sound (T26): original town, delve and boss music through the shared sound engine,
  plus effects for recruiting, leveling, purchases, relics, boss victories, wipes and seasons. Sound starts off;
  the header cycles effects and music on, and saves the choice. Catch-up and automated actions cannot flood cues.

- **2026-10-08 (night, later)** — **Realmbound: your other characters can work for you now.** A new **Supplies** tab
  holds a supply bank shared by all your characters and a jobs board: any hero you aren't playing can go Mining (3 at
  a time; higher levels mine faster), and their ore arrives even while you're away, up to 8 hours, with one report
  when you come back. Ore makes **repair kits** that mend all your gear anywhere, and Auto uses a kit instead of
  walking back to town. Each hero keeps their own bags. Built on a new shared roster system the guild will use next.
- **2026-10-07** — Realmbound: The Hollow Crown's Outer Wood (T22) extends the journey to level 52.
  Both factions share Thornmantle Camp, twelve voiced quests follow the empty throne and Ashwing claim,
  Veskareth is a legendary tameable drake, and Rootrot Hollow opens at 49 with four packs and three bosses.
  Old level-45 saves resume earning XP. Seraveth and the Crown's Heart remain ahead.

- **2026-10-08 (night)** — One sound system for the whole arcade (`shared/sound.js`). **Realmbound has sound now**
  (off by default; the header button cycles off / effects / effects + music): its own tune for every zone, from
  Thornvale's flute to the Barrowfields' lament, plus dungeon, boss and spirit-walk music, and effects for levels,
  quests, tames, rare drops, warnings, dodges, deaths and dungeon clears. Quest givers each have their own voice.
  **Wildbond sounds better too:** drums on the Warden, battle, trainer and legend themes, a light echo, and music
  that crossfades between places instead of cutting.
- **2026-10-08 (late)** — One scene system for the whole arcade (`shared/dialogue.js`): pixel portraits that blink, talk
  and show moods, more faces (braids, hoods, beards, pointed ears, tusks), and choices at the end of a scene. Wildbond's
  scenes now use it. **Realmbound's quest givers now speak in portrait scenes:** accept a quest by hand to hear the
  request and choose Accept or Not now; turn one in to hear their thanks. Every giver gets their own face, the same
  every time, drawn from their faction's peoples. QuestHelper and Auto skip the scenes.

- **2026-10-08 (night, ChatGPT)** — Starfall Guild is split into small classic scripts and its unchanged stylesheet (T25).
  Wildbond has 76 new browser checks for its newer systems (T24).
  Adds a browser check page for old saves, recruiting, combat, town purchases and seasons; gameplay and saves are unchanged.

- **2026-10-08 (night, later)** — Decisions from the research brief (`docs/research/decisions.md`). Wildbond: the main
  story will end near level 70, so badge caps now rise 10 a badge for the first four and 5 after (55, 60, 65, 70, then
  75 with all eight); nothing changes for the four badges that exist today.
  Realmbound: kill experience is now shared by the group with classic bonuses (questing with four companions is
  about 1.3× faster than solo instead of 5×), and every hero has a journey length (Breezy, Classic, Long Road) chosen
  at creation and changeable in the Journal.

- **2026-10-08 (night)** — Realmbound: the Silent Barrows' bosses now breathe **Grave Chill** (T1-B), a cold that
  stacks on your whole party and hurts every second until someone heals it off, so a healer really matters there.
  Measured how long levels 40-45 take (2¼-3½ hours of active play solo; Auto is slower for every class).

- **2026-10-08 (evening)** — Realmbound item names now progress through eight tiers (T21, ChatGPT): the original level 1–20 names,
  then new names for 21–30, 31–40, 41–50 and 51–60 across every armor material, weapon, off-hand and trinket.
  Adds ten dungeon-flavored rare-item prefixes. Existing saved items keep their names; item statistics are unchanged.

- **2026-10-08 (later)** — Wildbond area 4, Cloudglass Pass (T17): a rope gate north of Emberfall opens with the
  Ember Badge onto a misty mountain pass. Seven new wild creatures (Mistfinch evolves into Cloudharrier), the guardian
  Lanterncrest, trainers Ilka and Teodor, a Wren rematch, and Warden Vessa, whose Beacon Badge raises the cap to 55.
  Pip now notices when the Tide Badge brings light and depth back. Promo page and hub updated to four Wardens.

- **2026-10-08** — Merged ChatGPT's Realmbound chapter (T20): the Barrowfields beyond the winter road, twelve voiced
  quests about the Wayfolk and their road-stones, Paleweft the Lamp-Eater, and a third dungeon, The Silent Barrows,
  ending with the Last Wayward. The level cap is 45. Talents, part 1 (T1-A): every class gets a second tree
  (Warrior Protection, Rogue Combat, Mage Frost, Priest Holy, Hunter Marksmanship) and each tree grows to 25 ranks
  plus a capstone ability that needs 25 points in it, so you can only ever have one. Points no longer go to waste
  after level 31. Your role in dungeons follows your build: a Protection warrior tanks, a Holy priest heals. New
  talent abilities appear on your bar when you learn them. Resetting talents is free below 40 and once for
  everyone with this update, then costs a little gold.

- **2026-10-07** — Realmbound Frostmere II (T20): The Barrowfields extends the journey to level 45 with twelve
  voiced quests, grave-cold beasts and restless Wayfolk wardens, and Paleweft, a legendary tameable spider.
  The Silent Barrows opens at level 42: four packs and three bosses ending with the Last Wayward, plus existing
  Heroic tiers. Old level-40 heroes can resume earning XP. Grave Chill and pacing measurement follow in T1-B.

- **2026-10-07 (night, later)** — Realmbound plan for levels 40-60, the guild and raids (T1): docs/realmbound-40-60.md.
  Three chapters (the Barrowfields and the Silent Barrows, then the Hollow Crown in two parts), second and third
  talent trees with roles that follow your build, item names for every level band, a guild that is your whole
  account, and a first 10-person raid, The Hollow Throne.

- **2026-10-07 (night)** — Merged ChatGPT's promo pages (T19): promo.html is up to date for Realmbound (levels 1-40,
  Frostmere), and promo-wildbond.html introduces Wildbond to friends; the hub links both.

- **2026-10-07 (evening)** — Wildbond challenges and rematches (T11b). Starting a new journey you can switch on
  challenge modes, alone or mixed: **Nuzlocke** (a creature that faints goes home to the wild, and only the first
  creature you meet in each area can be caught), **Randomizer** (wild creatures shuffled between the areas),
  **Solo Run** (just you and your first partner) and **Hardcore** (smarter opponents, no Rally). Collect every badge
  with a mode on to earn its title. Beaten Wardens now take a rematch once a day, and Wren hangs around Larkhaven
  wanting one too: each tier is tougher, scales to your team and pays better. Each area has three mastery stars
  (Journal): fill its Wilddex, beat its Warden's tier 3, and find every item and beat every trainer.

- **2026-10-07 (later)** — Merged ChatGPT's Wildbond music (T18): original tunes for Larkhaven, Emberfall, Cloudglass,
  Warden battles, night and rain, chosen by where you are and what the sky is doing; voices for the newer characters.

- **2026-10-07** — Wildbond eras, part 3 (T13): the Ember Badge makes the world solid. In the new Diorama style
  every place is a little 3D model, like a carved table-top scene: houses are blocks with red roofs, trees and rocks
  stand up, and you, the townsfolk and every creature are your pixel art pushed out into chunky 3D blocks. Drag the
  scene to turn the camera all the way around, scroll to zoom; the arrow keys follow the camera. Toren also lets you
  ride your lead creature (press R or the Ride button) for a much faster trip. Battles use the HD-2D look.

- **2026-10-07 (early)** — Merged ChatGPT's Wildbond lore bible (T14, docs/lore/wildbond.md). Wildbond eras, part 2
  (T13): the Tide Badge brings light and depth back to the world in a scene on the beach, and the new HD-2D style
  shows the same places through a tilted camera: trees, people and creatures stand up out of the ground, the
  distance fades into haze and goes soft, and warm light falls across everything. Weather arrives too (rain on the
  coast and in the woods, mist, falling ash in the highlands), and it changes which creatures come out. Wild
  creatures now show themselves in the tall grass: walk into one to battle it (they're a little more often rare).

- **2026-10-06 (night, part 4)** — Wildbond eras, part 1 (T13): a new journey now begins in a faded world, four
  shades of green like an old handheld (the Pocket style). Earning the Thorn Badge brings the color back in a short
  scene, unlocks the Pixel and 16-bit styles, and Isolde gives you Warden's boots (hold Shift to run, or tap somewhere
  far away). A day/night clock arrives too: dusk and night darken the 16-bit world, and Shade creatures come out more
  at night. Maren, Pip and Old Tobin each have something to say about the color. Existing saves keep their style
  and can try Pocket from the Journal.

- **2026-10-06 (night, part 3)** — Merged ChatGPT's Wildbond browser checks (T16): open
  http://localhost:8765/tests/wildbond.html (via serve.ps1) and click Run checks; 314 checks of maps, story data,
  walking, gates, level caps, Wardens, old saves, the inn and the shop. Your save is backed up and restored.

- **2026-10-06 (night, part 2)** — Wildbond walkable world, part 2 (T7b): six tamers now wait along the routes
  (two per area). Walk into the line they're watching and they spot you ("!") and come over for a battle; beat them
  once and they'll chat instead. Pouches of coins, lures and ranch food lie around each area, signposts tell you
  where roads lead, and your lead creature now trots along behind you. Fixed a rare crash when a charged-up attack
  landed after your whole team had fainted.

- **2026-10-06 (later still)** — Merged ChatGPT's Emberfall Warden (T15): Warden Toren waits above the highland
  springs and tests your patience; beating him earns the Ember Badge and raises the level cap to 45.

- **2026-10-06 (late night)** — Wildbond walkable world, part 1 (T7b): Larkhaven, Thornwood, the Saltmarsh Coast and
  the Emberfall Highlands are now places you walk around, top-down, with the arrow keys/WASD or by tapping where to go.
  Wild creatures hide in the tall grass. Walk into the inn to rest, the shop for lures and Maren's barn for your
  ranch, whose creatures now roam the paddock. Wardens stand by their gates (a "!" means they're ready for you) and
  townsfolk have things to say. Gates stay shut until you've earned the badge. Auto-explore walks the grass for you.
  Works in both art styles.

- **2026-10-06 (night)** — Wildbond pacing overhaul (T11): levels now go to 100 and the journey is much longer. You pick
  a journey length with your starter (Breezy: first badge in about an hour; Classic: about two to three hours; Long
  Road: less XP and rarer finds) and can change it at the Larkhaven inn in the Journal. Badges set a level cap (15,
  then +10 per badge) as a soft cap, hard cap or off; an optional XP share teaches ranch creatures from your battles.
  Auto-explore earns a little less XP than playing yourself. New: Warden Nerys of the Saltmarsh and the Tide Badge,
  which opens the Emberfall Highlands. Saltmarsh (12-22) and Emberfall (22-32) were rescaled to fit.

- **2026-10-06 (evening)** — Merged ChatGPT's Realmbound **Frostmere: The Winter Road** (PR #7): a snowbound zone
  for levels 30-40 with Lanternrest Lodge and Whitebough Hearth, ten quests, ice trolls, three new tameable beasts
  and Hushfang, a legendary wolf elite; the level cap is now 40. Merged ChatGPT's research and staged plans for every
  game, including a broader sports direction (PR #8, docs/plans/).

- **2026-10-08 (night, later)** — Merged ChatGPT's Realmbound lore pass (PR #6): every zone has a lore paragraph (shown on its
  own line under the zone name) and every quest giver now says something when you turn a quest in. Lore bible in
  docs/lore/realmbound.md. Merged Wildbond Emberfall Highlands (PR #5). Added CLAUDE.md so any Claude session on any
  computer starts with the project's rules and current status.
- **2026-10-08 (night)** — Wildbond feels like a real game, part 1: story scenes with character portraits (Keeper Maren,
  Wren, Warden Isolde) and typewriter dialogue for every beat, from the opening cart ride to Breakwatermane; battle
  animation (teams slide in, lunges, flinches, element sparks, crit shake, fainting); chiptune sound effects and music
  for each area and battle type, made live in the browser (header button, off by default). Saltmarsh story beats.
  Legendaries you knock out now slip away and return instead of vanishing.
- **2026-10-08 (later)** — Wildbond part 2: ranch days every 5 minutes (also while away) with daily food and
  training plans, fatigue, injuries and mood; breeding barn with inherited genes, pedigree and three hidden hybrids
  (Lynxhound, Drakelet, Bramblestag); biome travel. Merged ChatGPT's 16-bit art era (PR #3).

- **2026-10-08** — Wildbond part 1 (early access): shared creature module, three starters with evolutions, rival Wren,
  Thornwood with 10 wild species, lure-and-calm capture, 3v3 auto battles with commands (Focus, Guard, Rally),
  telegraphed attacks, Elderhorn, the Thornwood Warden and the Thorn Badge, Wilddex, art-era system. Merged
  ChatGPT's Realmbound split (PR #2).

- **2026-10-07 (night)** — Hub: "Reset progress" on every game card with progress, with a confirmation step.
  Erases that game's save on this device (for Realmbound, every character).

- **2026-10-07 (evening)** — Primordial rebalance from phone playtest: breeding slowed to a fraction, milestones double at
  25/50/100/200…, first extinction at 10B (simulated ~22 min for a perfect player, ~40 real), at most 3
  mutations waiting at once. Clear "← Arcade" button in Primordial and Starfall Guild.

- **2026-10-07 (later)** — Merged ChatGPT's Ashen Ridge / level 30 / Cindervein Foundry work (PR #1) after review; 118 scenario
  checks pass. Added promo.html, a shareable pitch page for friends.

- **2026-10-06** — Realmbound: level cap 30, Ashen Ridge with two faction outposts, ten quests,
  six enemy types including the legendary Coalmaw, and the Cindervein Foundry (three bosses).
  Dungeons now keep separate Heroic unlocks; existing Sanctum saves migrate automatically.
  New bosses use Cinder Rain and Molten Rupture with the same active dodge controls.

- **2026-10-07** — Realmbound: wandering NPC adventurers with personalities and friendship, grouping,
  combo abilities, the Drowned Sanctum (3 bosses, waves, dodgeable Tidal Surge, loot sharing, infinite Heroic
  tiers), LFG Tool addon. See HANDOFF.md to continue with any tool.

- **2026-10-07** — Realmbound: mounts. Riding skills, faction mount vendors, rare reins from legendary elites,
  mounts that train as you ride them, Hunters riding their own pets. Travel between fights, to town and
  between zones is faster when mounted.

- **2026-10-06 (night)** — Realmbound: character slots (up to 8). Characters button in the top bar; each hero
  keeps their own gear, quests, pets, addons and log. Heroes you aren't playing earn rested XP while away.
  Old single-hero saves upgrade automatically.

- **2026-10-06 (evening)** — Realmbound: Hunter class and pets. Taming with wild rarity from common to
  legendary, 7 beast families, traits, bond levels that unlock Coordinated Strike and a pet that saves you,
  happiness and feeding, a 3-pet stable, PetCare addon, Beast Mastery talents. Playtested taming a common
  and a legendary elite, combat with a pet, feeding, stable swaps; other classes unaffected.

- **2026-10-06 (later)** — Realmbound v0: character creation (2 factions, 4 races, 4 classes), three zones to
  level 20, 26 quests, auto-combat with a 6-button action bar and reactive openings, Focus/Auto modes (active
  play always worth more), loot with rarities and suffixes, durability and corpse runs, town vendor, talents,
  rested XP, 5 earned addons. Playtested all four classes. Design plan in docs/realmbound-design.md. Creature
  and companion idea added to docs/ideas.md.

- **2026-10-06** — Hub and shared engine. Primordial v1 (playtested: drafts, instincts, contests,
  extinction, offline catch-up, import). Starfall Guild prototype (playtested: recruiting, leveling,
  shops, bosses and relics, staff, seasons). Fixed: drafts no longer offer mutations for locked organisms;
  Starfall heal-between-fights and crit math.

## Development checks

Serve the repository with `python -m http.server 8765` (or `serve.ps1`). With Playwright and its
Chromium browser installed, run `node tests/realmbound-smoke.cjs`. The check covers old dungeon
save migration, levels 20–30, quest chains, per-dungeon Heroic gates, save/reload, group-finder
controls and mobile layout. For a DOM-only check without Chromium, install `jsdom` in your development
environment and run `node tests/realmbound-dom.cjs`. This executes the same progression scenarios and
checks save/reload and group-finder interactions, but does not verify browser rendering or mobile layout.
The games themselves still require no dependencies or build step.

Map audit (2026-10-10): native Wildbond/Starfall access evidence and reproducible roof-routing finding in [the report](docs/research/map-scene-audit-2026-10-10.md); rendered scene review remains outstanding. No gameplay change.

