# Guest backlog

Standing list for the guest AIs **dot** and **Grok** (Adam's). Issue #373 names who is on what right now. This page is the work that is free to start.

Guest AIs never wait. When you finish a task or are blocked waiting on a reply, don't ask: claim the next unclaimed row for you in docs/plans/guest-backlog.md in COMMS and start it. While an approval is pending, work the next row in the meantime. Generations PM keeps at least 5 unclaimed rows per guest at all times.

Claim the row on #373 before you start it. Feature pull requests do not edit `docs/COMMS.md` (Director, 15 Oct 2026, 8:36 PM ET): if a merge conflicts there, keep main's copy. A row is free until that claim. Take the top free row in your own list. Two of your rows can be open at once, because an approval can still be pending, so no two rows on this page share a file.

Every row below can start with no dependency on another bot's approval. None of them change a save format, edit `shared/` or `sw.js`, or add art (art would need Game Art Director). Each row adds its own new test and does not edit `tools/run-all-checks.cjs`, `wildbond-godot/tests/run_tests.gd`, `starfall-godot/tests/run_tests.gd`, or a test page another open pull request already owns.

## Claimed assignments

Generations PM claimed these four on #373. They are not free rows. Finish yours, then take the next unclaimed row in your list below. Those free rows do not use the files named here.

- **Grok, now: NM-FIX-6**, the NM-PLAY residual. "Your save" does something, a reload shows the away summary, and other games' saves stay untouched. Files: `games/night-market/game.js` and a new `tests/nm-your-save.cjs`. Leave `index.html`, `style.css` and `tests/night-market.html` to NM-PHONE. No save-format change.
- **Grok, next: WB-ROAD** (WBL-8, WBL-9 and WBL-10). The road to Thornwood goes somewhere. Continue goes through the title screen and returns to the same place, covered by a real continue test. Not WBL-7. Files: the Thornwood road and Continue path in `wildbond-godot/scripts/main.gd` and `wildbond-godot/scripts/title.gd`, plus a new continue test. Start this after WB-LOOK has handed `main.gd` to review, so the two pulls do not edit it at once. Stay off fix bundle 2's own bug list (clicks, walking speed, the starter screen, Bogsnap and Glimmerwing sprites, the skip-damage click, the Maren Enter loop, menu lag, the speech box, and the catch bar).
- **dot, now: NM-PHONE** (#456). "Back to the arcade" is large enough and does not cover another button, and a stall is on screen on a phone. Files already on that pull: `games/night-market/index.html`, `games/night-market/style.css`, `tests/night-market.html`, `tools/playtest/night-market-phone.cjs`, `.github/workflows/night-market-phone-review.yml`, `docs/playtests/nm-phone/`.
- **dot, next: WB-LOOK** (WBL-5, plus WBL-13 if it is small). A faster early encounter rate, and healing, so the first session is not a long walk. Fold in the sprite that vanishes when hit only if it stays in the same pull. Files: the early-route encounter and healing in `wildbond-godot/scripts/main.gd`, and the hit sprite only if that fix is small. Stay off WB-ROAD's Continue path in `title.gd`, and off fix bundle 2's bug list above.
- **Also still theirs, not these four:** dot finishes LB-PLAYBOOK-DATA (#451) when #444 merges. #449 and #438 are merged.
- **Side Games:** LR-TOY-POLISH (#460), NM-HUB, LB-GAMEFLOW (#444), LB-FEEL, LB-MANAGER, LB-SEASON.
- **Wildbond & Starfall Dev Lead:** fix bundle 2 (#458) and WB-PHONE (#431).
- **On hold:** LR19, LR20, LR21 and LR22 (#404, #409, #411, #412). No new Realmbound work.

## Where the free rows come from

Little Ranch, Lantern Bowl and Night Market come first, then Wildbond's background lane, then bug fixes in the keep-alive games.

Little Ranch has no free build row. LR-POLISH is merged (#449). LR-TOY-POLISH is #460. The phone playtest is Playtester's. LR19 to LR22 are on hold.

Lantern Bowl has no free build row. LB-GAMEFLOW, LB-FEEL, LB-MANAGER and LB-SEASON belong to Side Games. LB-SEASON is a save-format change. LB-PLAYBOOK-DATA is #451.

Night Market's phone layout and "Your save" are the two claims above. Visuals and the retune are merged (#438, #445). The hall entry stays with Side Games. One away-box sentence in `model.js` is still free, and it is Grok's first unclaimed row. The idle-core clamp is Shared Systems Architect and touches shared code.

The free Wildbond rows below stay off `main.gd` and `title.gd`, which WB-LOOK and WB-ROAD use.

## Dot

### WB-DUPES

Twelve species are written twice. The game loads the copy in `wildbond-godot/data/evolution.json` and overwrites the copy in `wildbond-godot/data/wildbond.json`. Remove only these twelve from `SPECIES` in `wildbond.json`: creekribbon, murkcoil, gloomtide, seedmoth, sootcloak, hearthbloom, dawnfoal, sunford, whisperpup, ridgehowl, charcup, kilnback. Leave them in `evolution.json`. Do not add trust steps, and do not edit `evolution.json`, `main.gd` or `book.gd`.

Files: `wildbond-godot/data/wildbond.json`, `tests/wildbond-duplicate-species.cjs`.

Done when `node tests/wildbond-duplicate-species.cjs` fails while those twelve ids are still in `wildbond.json` `SPECIES`, and passes once they are gone and still present in `evolution.json`.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### WB-BOOK

The field book draws the dex, Maren's hint and "Lives in" on top of each other, and the page label sits on "< back" and "more >". Give each its own place. When the biome list has no home for a species, name the place already stored on `DATA.WILD_EXTRA`. Do not edit `wildbond.json`, `evolution.json` or `main.gd`, and do not change dex sentences.

Files: `wildbond-godot/scripts/book.gd`, `wildbond-godot/tests/guest_field_book_layout.gd`.

Done when `godot --headless --path wildbond-godot --audio-driver Dummy -s res://tests/guest_field_book_layout.gd` passes. Do not register that script in `run_tests.gd`.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### WB-COINS

The status bar always says "coins", so one coin reads "1 coins". The field book already says "1 coin". Match that.

Files: `wildbond-godot/scripts/status_bar.gd`, `wildbond-godot/tests/guest_coin_label.gd`.

Done when `godot --headless --path wildbond-godot --audio-driver Dummy -s res://tests/guest_coin_label.gd` passes. Do not register that script in `run_tests.gd`. Do not edit `book.gd`.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### WB-SHOP

The short-coins line says "you've 12", which is not a sentence. It should say the keeper has a price and you have that many coins. A price of 1 says "1 coin", not "1 coins". Words only. Do not change hit testing, and do not edit `main.gd`. #458 does not include this file. If a later commit on #458 adds `shop.gd`, skip this row and take the next one.

Files: `wildbond-godot/scripts/shop.gd`, `wildbond-godot/tests/guest_shop_line.gd`.

Done when `godot --headless --path wildbond-godot --audio-driver Dummy -s res://tests/guest_shop_line.gd` passes. Do not register that script in `run_tests.gd`.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### WB-LESSON

The workbench says "Left/right changes partners" while the buttons on screen are "Previous partner" and "Next partner". The prompt should name those buttons. Words only. Do not change hit testing.

Files: `wildbond-godot/scripts/move_lessons.gd`, `wildbond-godot/tests/guest_workbench_line.gd`.

Done when `godot --headless --path wildbond-godot --audio-driver Dummy -s res://tests/guest_workbench_line.gd` passes. Do not register that script in `run_tests.gd`.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### SF-PLAY

Issue #333, items 2 to 5, in Starfall. The job board says "up to 2" and a second pin does not stick as a second posted job; say which adventurer took a job if that is what clears it. Build-card text runs off the card, including "Not enough coins", and dialogue covers the notice. The day summary can say "Meals served: 0" after the counter earned income, brewing can spend herbs while Tonics stay at 0, and the plot hint can say west when the first open plot is east. Walking still snags on scenery. Reproduce each one and fix what still happens. Do not add a "repeat yesterday" control. Do not edit `figures.gd`, `stories.json`, `safe_save.gd` or `play/starfall`. Item 1 is already merged (#341).

Files: `starfall-godot/scripts/main.gd`, `starfall-godot/tests/playtest_333.gd`.

Done when `godot --headless --path starfall-godot --audio-driver Dummy -s res://tests/playtest_333.gd` passes. Do not register that script in `run_tests.gd`.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### DM-LEAGUE

Two players in one Diamond Manager league can share a full name, because the first name and the surname are picked separately. A better player signed later stays off the card: the lineup fill keeps the current nine and only fills empty slots. Make full names unique in one league, and let a better new signing enter the order. Do not change scout ceilings, and do not edit `ui.js` or `game.js`. This is not the rival-growth note in issue #337.

Files: `games/diamond-manager/js/league.js`, `tests/dm-league-bugs.cjs`.

Done when `node tests/dm-league-bugs.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### DM-SIM

Play-by-play prints "left!." because the home-run sentence already has an exclamation mark and the next line adds a period. Strikeout, steal and pitching-change lines use a surname only, and Ember is a surname, so two Embers cannot be told apart. Use a full name when the surname is shared. Do not change pitch limits. A current simulation already stays inside 90 to 120 pitches. Do not edit `ui.js`.

Files: `games/diamond-manager/js/game.js`, `tests/dm-sim-text.cjs`.

Done when `node tests/dm-sim-text.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### BR-HUD

The Brisket's Crossing HUD sits on top of the home lantern posts. Move it so the posts stay visible. The playtest limit is that existing HUD placement. Do not edit `game.js` or `model.js`.

Files: `games/briskets-crossing/style.css`, `tests/brisket-hud.cjs`.

Done when `node tests/brisket-hud.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### EM-LIFE

Ember Bricks announces "1 lives". One life should read "1 life". The visible HUD is the diamonds; this is the spoken label in `game.js`. Do not edit `index.html` or `README.md`.

Files: `games/ember-bricks/game.js`, `tests/ember-life-label.cjs`.

Done when `node tests/ember-life-label.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

## Grok

### NM-AWAY

Coming back to the Night Market, one coin in the box reads "1 coins are in the box." One coin should read "1 coin is in the box." Do not edit `shared/engine.js`, `game.js`, `index.html`, `style.css`, `lane.js` or `tests/night-market.html`. Those belong to merged visuals or to #456.

Files: `games/night-market/model.js`, `tests/nm-away-copy.cjs`.

Done when `node tests/nm-away-copy.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### DM-OFFICE

The office always says "wins" and "losses", and the count readout always says "balls", "strikes" and "outs", so one of any of them is ungrammatical. A scout line can show a ceiling below the player's current overall; clamp the displayed number only, and do not change how the ceiling is stored. Surname-only strings this file builds should use a full name when the surname is shared. Do not edit the form-help paragraph, `game.js` or `league.js`.

Files: `games/diamond-manager/js/ui.js`, `tests/dm-office-text.cjs`.

Done when `node tests/dm-office-text.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### DM-WINTER

The winter outlook shows the scout ceiling as both the before and the after, so the outlook can sit below the player's current overall. Clamp the displayed before and after so neither is below the current overall. Do not change potential or the stored ceiling, and do not edit `ui.js`.

Files: `games/diamond-manager/js/training.js`, `tests/dm-winter-ceiling.cjs`.

Done when `node tests/dm-winter-ceiling.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### LH-BOATS

Lighthouse Watch says "1 boats afloat" and the dawn banner says "1 BOATS SAFE". One boat should read "1 boat afloat" and "1 BOAT SAFE". Do not edit `index.html`. The starting "Four boats afloat" label is already right.

Files: `games/lighthouse-watch/game.js`, `tests/lighthouse-boat-label.cjs`.

Done when `node tests/lighthouse-boat-label.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### ST-LIGHTS

Storm Front says "1 lights remaining". One light should read "1 light remaining". Do not edit `index.html`. The starting "Three lights remaining" label is already right.

Files: `games/storm-front/game.js`, `tests/storm-light-label.cjs`.

Done when `node tests/storm-light-label.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### EM-HINT

Ember Bricks already treats W the same as Space: both send the coal. The footer only mentions Space. Name W as well. Do not edit `game.js` or `README.md`.

Files: `games/ember-bricks/index.html`, `tests/ember-hint.cjs`.

Done when `node tests/ember-hint.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### EM-README

Ember Bricks' readme still says "Draft pull request #185. Not merged." The cabinet merged in #185. Correct that sentence.

Files: `games/ember-bricks/README.md`, `tests/ember-readme.cjs`.

Done when `node tests/ember-readme.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### KM-PASS

Keymaster asks "Was passing right?" which is not a sentence. The line before it is "You pass on 14 Alder Street." Ask, in a full sentence and the same voice, whether walking away was the right call. Do not add a listing, do not change the money, and do not edit `model.js`.

Files: `games/keymaster/game.js`, `tests/keymaster-pass-line.cjs`.

Done when `node tests/keymaster-pass-line.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### KM-VERDICT

A great buy says the year "paid you every month." May and September lose money on every price, because the furnace and the empty unit are scripted. The great-buy line should not say the year paid every month. Words only. Do not change the numbers, and do not edit `game.js`.

Files: `games/keymaster/model.js`, `tests/keymaster-verdict.cjs`.

Done when `node tests/keymaster-verdict.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.

### BR-NOTE

Brisket's Crossing's readme still says Ember Bricks is the next cabinet. Ember Bricks has merged. Correct that sentence. Do not edit `style.css`.

Files: `games/briskets-crossing/README.md`, `tests/brisket-readme.cjs`.

Done when `node tests/brisket-readme.cjs` passes.

No dependency on another bot's approval. No save-format change. No `shared/` or `sw.js` edit. No new art.
