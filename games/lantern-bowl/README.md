# Lantern Bowl

v0.1.1. One football game at Lamplight Field. You are the Brackenport Lanterns, Millrace is the other side. Four quarters of two minutes. You call the play and play the snap. Their drives are a play-by-play, one line at a time.

Drag from the quarterback. A short pull is a bullet and a long pull is a lob, and the aim line shows which while you drag. Swipe sideways to juke. Tap to dive. Both move the ball carrier and say so when the play ends. Turbo spends the wind bar; when it is empty, Turbo stops helping. Green lanes are blocked open. Red lanes are not. The ring around the quarterback shrinks as the rush arrives, and it stays inside the field. Ratings run from 0 to 100 and sit under the score. About 50 is an ordinary player. When a rating decides a block, a catch or a tackle, the result says the two numbers. A careless game loses. An attentive one wins. One snap never takes more than 14 seconds. Play again returns to the kickoff.

The view is from behind your offence. A side-on look can be added later without changing the rules. Outlines use each club's colour, drawn in code.

Saves, the clock's wording, sound and the settings row are the shared arcade ones. The game saves after every play (`lantern-bowl-save-v1`). A save from this version keeps loading. A later version of the file can be brought forward one step at a time; a file this game does not know how to read is left alone. Closing the tab does not play the game for you. There are no ads, energy bars or paid shortcuts.

Play: [games/lantern-bowl/](index.html). Checks: `node tools/run-all-checks.cjs lantern-bowl`.

## Files

- `model.js` — the rules, the seeded dice, and nothing about the screen
- `view.js` — the behind-the-play camera, and the empty place for a side-on view
- `game.js` — input, drawing, sound, settings and the save
- `index.html`, `style.css` — the phone-first page

## Later

A learning defence, a league, money and a weekly dilemma, scouting, age, a draft, box scores, career numbers, leaders, and a heavier save file. Listed in [docs/plans/lantern-bowl.md](../../docs/plans/lantern-bowl.md).
