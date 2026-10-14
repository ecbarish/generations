# Lantern Bowl

v0.1.0. One football game at Lamplight Field. You are the Brackenport Lanterns, Millrace is the other side. Four quarters of two minutes. You call the play and play the snap. Their drives are told in a few lines.

Drag up the field to throw. A short pull is a bullet. A long pull is a lob. Swipe sideways to juke. Tap to dive. Turbo spends the wind bar; when it is empty, Turbo stops helping. Green lanes are blocked open. Red lanes are not. The ring around the quarterback shrinks as the rush arrives. Ratings run from 0 to 100. About 50 is an ordinary player, and the difference shows up in blocks, tackles and catches.

The view is from behind your offence. A side-on look can be added later without changing the rules. Outlines use each club's colour, drawn in code.

Saves, the clock's wording, sound and the settings row are the shared arcade ones. The game saves after every play (`lantern-bowl-save-v1`). Closing the tab does not play the game for you. There are no ads, energy bars or paid shortcuts.

Play: [games/lantern-bowl/](index.html). Checks: `node tools/run-all-checks.cjs lantern-bowl`.

## Files

- `model.js` — the rules, the seeded dice, and nothing about the screen
- `view.js` — the behind-the-play camera, and the empty place for a side-on view
- `game.js` — input, drawing, sound, settings and the save
- `index.html`, `style.css` — the phone-first page

## Later

A learning defence, a league, money and a weekly dilemma, scouting, age, a draft, box scores, career numbers, leaders, and a heavier save file. Listed in [docs/plans/lantern-bowl.md](../../docs/plans/lantern-bowl.md).
