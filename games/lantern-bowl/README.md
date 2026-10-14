# Lantern Bowl

v0.1.5. The field is side-on, with eleven a side, and carries have a real spread (#383, 371-5a).

v0.1.4. Running matters, and Millrace's drives play on the field (#369, closes #359).

v0.1.3. A short pull stays short and the field shows where the ball is going. Pick a play before you drag. When a defender closes, the field says to swipe or dive. Kick and Turbo say why they are waiting. The ratings line is plain words until you tap it. Millrace's drives play on the field, and a change of possession says why. A level score at the gun goes to overtime: each side gets one turn from the 25, Millrace first, and a lead after both turns wins. If it is still level, they play another pair of turns. The page shows its version.

v0.1.2. Millrace remembers the three plays you call most, and sits on a play you keep repeating. A run stays on the field while a defender closes, so a juke or a dive at that moment changes the gain. The result names the check that decided the snap. Halftime is a kickoff to the side that did not receive first. The gun ends on the final score. The field moves with the spot, the ratings follow the ball carrier, and Play again clears the last line.

v0.1.1. One football game at Lamplight Field. You are the Brackenport Lanterns, Millrace is the other side. Four quarters of two minutes. You call the play and play the snap. Their drives play out on the field.

Pull back from the quarterback and drag to aim. Downfield is to the right. How hard you pull sets the distance, and the field draws the arc and the landing circle. The aim holds steady longer when the passer is accurate, then it wanders. Letting go past the sideline throws it away. Settings can switch to All 22: a button on each receiver, a tap for a bullet and a hold for a lob. Pick a play before you throw. With the ball, a floating stick steers. Swipe, or use Juke and Spin. Tap to dive. The field tells you when a defender is close enough for either. Turbo spends wind, and the ratings strip shows what is left. When it is empty, Turbo stops helping. Kick and Turbo stay grey, and say why, until you can use them. Green lanes are blocked open. Red lanes are not. The ring around the quarterback shrinks as the rush arrives, and it stays inside the field. Ratings run from 0 to 100 and sit under the score in plain words; tap that line for the numbers. About 50 is an ordinary player. A careless game loses. An attentive one wins. One snap never takes more than 14 seconds. Millrace's drives are played on the field. If the score is level at the gun, overtime gives each side one turn from the 25. A lead after both turns wins. If it is still level, they play another pair of turns. Play again returns to the kickoff.

The field runs left to right, seen from the side. Before the snap the line of scrimmage sits left of centre, and the camera follows a run or a throw without sliding after the whistle. Eleven play on each side. Linemen are the wider, lower body. Quarterbacks, backs, receivers, tight ends, linebackers and defensive backs are the narrower one. Both are side-on sprites in the club colours, and a drawn figure stands in if a sprite is missing. Outlines are ink.

During a snap the screen keeps the score, the down and the clock. Ratings and wind come back when the play is over. Inside, Outside, Quick, Deep and Kick stay in the same seats, with a small icon beside the name.

Saves, the clock's wording, sound and the settings row are the shared arcade ones. The game saves after every play (`lantern-bowl-save-v1`, file version 2). A save from this version keeps loading. A v1 file steps up to v2 and keeps the same match, with overtime turns at zero if it had none. A file newer than this game is left alone: this version does not write over it, and the page says progress will not be saved. Closing the tab does not play the game for you. There are no ads, energy bars or paid shortcuts.

Play: [games/lantern-bowl/](index.html). Checks: `node tools/run-all-checks.cjs lantern-bowl`.

## Files

- `model.js` — the rules, the seeded dice, and nothing about the screen
- `view.js` — the side-on field and camera, and the older behind-the-play camera the checks still use
- `game.js` — input, drawing, sound, settings and the save
- `index.html`, `style.css` — the phone-first page

## Later

A league, money and a weekly dilemma, scouting, age, a draft, box scores, career numbers, leaders, and a heavier save file. Listed in [docs/plans/lantern-bowl.md](../../docs/plans/lantern-bowl.md).
