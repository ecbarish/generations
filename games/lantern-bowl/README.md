# Lantern Bowl

v0.1.2. Millrace remembers the three plays you call most, and sits on a play you keep repeating. A run stays on the field while a defender closes, so a juke or a dive at that moment changes the gain. The result names the check that decided the snap. Halftime is a kickoff to the side that did not receive first. The gun ends on the final score. The field moves with the spot, the ratings follow the ball carrier, and Play again clears the last line.

v0.1.1. One football game at Lamplight Field. You are the Brackenport Lanterns, Millrace is the other side. Four quarters of two minutes. You call the play and play the snap. Their drives are a play-by-play, one line at a time.

Drag from the quarterback. A short pull is a bullet and a long pull is a lob, and the aim line shows which while you drag. Swipe sideways to juke. Tap to dive. Turbo spends wind, and the ratings strip shows what is left. When it is empty, Turbo stops helping. Green lanes are blocked open. Red lanes are not. The ring around the quarterback shrinks as the rush arrives, and it stays inside the field. Ratings run from 0 to 100 and sit under the score. About 50 is an ordinary player. A careless game loses. An attentive one wins. One snap never takes more than 14 seconds. Play again returns to the kickoff.

The view is from behind your offence, and the camera stays with the ball so the field scrolls. Players are drawn in code (head, jersey, a short run) until a sprite file named like `qb_back_run1.png` is added. A side-on look can be added later without changing the rules. Outlines use each club's colour.

During a snap the screen keeps the score, the down and the clock. Ratings and wind come back when the play is over. Inside, Outside, Quick, Deep and Kick stay in the same seats, with a small icon beside the name.

Saves, the clock's wording, sound and the settings row are the shared arcade ones. The game saves after every play (`lantern-bowl-save-v1`). A save from this version keeps loading. An older save steps up one version at a time. A file newer than this game is left alone. Closing the tab does not play the game for you. There are no ads, energy bars or paid shortcuts.

Play: [games/lantern-bowl/](index.html). Checks: `node tools/run-all-checks.cjs lantern-bowl`.

## Files

- `model.js` — the rules, the seeded dice, and nothing about the screen
- `view.js` — the behind-the-play camera, and the empty place for a side-on view
- `game.js` — input, drawing, sound, settings and the save
- `index.html`, `style.css` — the phone-first page

## Later

A league, money and a weekly dilemma, scouting, age, a draft, box scores, career numbers, leaders, and a heavier save file. Listed in [docs/plans/lantern-bowl.md](../../docs/plans/lantern-bowl.md).
