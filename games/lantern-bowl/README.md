# Lantern Bowl

v0.1.8. When the crowd bed plays, it holds its peak until it is stopped, then fades out over 0.25 seconds (#489). The live play page may still not wire these cues; the listening page is what exercises the loop. Season standings and playoff pairings are in `standings.js` (#494), and the live game does not load that module yet. LB-SEASON stays open. One version covers both merges. The save stays version 2.

v0.1.7. Before each Millrace drive you pick Blitz, Balanced, or Prevent, and the drive plays on the field as a short highlight (#444). A slower clock keeps a two-minute quarter and leaves room for a full game. On fourth down the call offers a punt, and a field goal when the goal is within 38 yards. A short completion no longer gains one fixed number of yards, and a typical carry lands nearer 3 yards. A miss says why: Overthrown, Underthrown, Wide left, Wide right, Broken up, or Picked. While you drag, the receiver nearest the aim point is highlighted, and Inside and Outside are labelled as runs. On a phone, a full throw takes a long drag, and the camera keeps the quarterback clear of the left edge. After the whistle one result line sits on the bottom edge, and the hint stays above the grass so the top receiver and the yard numbers stay visible. The version label stays whole at 360 pixels wide, and Settings stays on the screen at 390 pixels wide. A phone held upright still shows Turn your phone sideways and the game waits. The save stays version 2.

Opponent scouting data from #496 is in `scouting.json`: styles for the five rival clubs, plus a checker. The game does not load that file yet, so the field stays as it is and Lantern Bowl stays at v0.1.8.

Decision-card data from #481 is in `dilemmas.json`: 16 between-games cards, plus a checker. The game does not load that file yet, so the field stays as it is and Lantern Bowl stays at v0.1.7.

Progression data from #480 is in `progression.json`, plus a five-season simulation checker. The game does not load that file yet, so the field stays as it is and Lantern Bowl stays at v0.1.7.

Sound-cue work from #474 is in `sound-cues.js`, with a checker and a listening page. The game does not play those cues yet, so the field stays as it is and Lantern Bowl stays at v0.1.7.

Kick rules from #479 are in `kick.js`, plus a checker. The game does not use that module yet, so the field stays as it is and Lantern Bowl stays at v0.1.7.

Season schedule data from #478 is in `season.json`, plus a checker. The game does not load that file yet, so the field stays as it is and Lantern Bowl stays at v0.1.7.

Roster and ratings data from #472 is in `roster.json`, plus a checker. The game does not load that file yet, so the field stays as it is and Lantern Bowl stays at v0.1.7.

Play and route data from #451 is in `playbook.json`: 4 runs and 8 passes, with 32 receiver routes, plus a checker. The game does not load that file yet, so the field stays as it is and Lantern Bowl stays at v0.1.7.

v0.1.6. The field has new play art and a playbook. Slingshot passing lets you pull back to throw. A landing circle stays on screen on deep throws. An overthrown pass says "Overthrown: too much power". On phones, a turn-sideways prompt in portrait pauses the game (#432). The save stays version 2.

v0.1.5. The field is side-on, with eleven a side, and carries have a real spread (#383, 371-5a).

v0.1.4. Running matters, and Millrace's drives play on the field (#369, closes #359).

v0.1.3. A short pull stays short and the field shows where the ball is going. Pick a play before you drag. When a defender closes, the field says to swipe or dive. Kick and Turbo say why they are waiting. The ratings line is plain words until you tap it. Millrace's drives play on the field, and a change of possession says why. A level score at the gun goes to overtime: each side gets one turn from the 25, Millrace first, and a lead after both turns wins. If it is still level, they play another pair of turns. The page shows its version.

v0.1.2. Millrace remembers the three plays you call most, and sits on a play you keep repeating. A run stays on the field while a defender closes, so a juke or a dive at that moment changes the gain. The result names the check that decided the snap. Halftime is a kickoff to the side that did not receive first. The gun ends on the final score. The field moves with the spot, the ratings follow the ball carrier, and Play again clears the last line.

v0.1.1. One football game at Lamplight Field. You are the Brackenport Lanterns, Millrace is the other side. Four quarters of two minutes. You call the play and play the snap. Their drives play out on the field.

The field fills the screen. The score, the down and the clock sit in a strip about 18 pixels tall. The hint under that strip stays above the grass, so the top receiver and the yard numbers remain visible. Before the snap, three plays sit in a short row along the bottom, with the route drawn on the card and in chalk on the grass, and a ring under each receiver. Inside and Outside are labelled as runs. On fourth down, a punt is one of those three. When the goal is within 38 yards, a field goal is there too, and it is harder from farther away. During a play there are no action buttons. After the whistle one result line sits on the bottom edge, clear of the players, and the next play cards wait until that line has been shown. They then take that same bottom edge. Before Millrace's drive you pick Blitz, Balanced or Prevent. Their drive then plays as a short highlight, and one line says how it ended. The clock is slower than the snap itself, so a game holds about 8 to 12 of your drives. A short completion does not always gain the same yards.

Drag anywhere on the field and let go to throw. Downfield is the opposite of the drag. How far you pull sets the power, and a full throw takes a long drag that fits the screen. The power meter fills across that whole drag, so a short pull stays short. The dotted landing arc shows where it will come down. A second finger, a right-click, or Shift switches a lob and a bullet. A lob hangs longer. A bullet gets there sooner. The ball lands where you aimed. It does not lead the receiver for you, and it does not steer itself onto a receiver. While you drag, the receiver nearest that spot is highlighted. A catch still needs the ball to arrive near that receiver, a little wider than before, and still a miss if the drag is off. Aim error grows with the distance and with pressure. A defender within about 2.6 yards contests the catch. A breakup is much more common than a pick, and a pick happens only when that defender is closer to the ball than the receiver. A miss says what happened: overthrown, underthrown, wide left, wide right, broken up, or picked. Letting go past the sideline throws it away. With the ball, swipe or hold to steer and juke. Tap to dive. A second finger sprints and spends wind. The result is a short line that does not cover the play, and it does not read out rating numbers. Green lanes are blocked open. Red lanes are not. The ring around the quarterback shrinks as the rush arrives. Ratings still run from 0 to 100 inside the game. About 50 is an ordinary player. A careless game loses. An attentive one wins. One snap never takes more than 14 seconds. Millrace's drive is a short highlight on the field after you pick a defence, and one line says how it ended. If the score is level at the gun, overtime gives each side one turn from the 25. A lead after both turns wins. If it is still level, they play another pair of turns. Play again returns to the kickoff.

The field runs left to right, seen from the side. A phone held upright shows a full-screen note, Turn your phone sideways, and the game waits. Turning the phone back to landscape takes the note away and the same snap continues. A wide desktop window plays the side-on field as it is. Before the snap the camera sits behind the line, and on a pass it keeps the quarterback well in from the left edge so the long drag fits behind him. It follows a run or a throw without sliding after the whistle. Eleven play on each side. Linemen are the wider, lower body. Quarterbacks, backs, receivers, tight ends, linebackers and defensive backs are the narrower one. Both are side-on sprites in the club colours, and a drawn figure stands in if a sprite is missing. Outlines are ink.

During a snap the screen keeps the score, the down and the clock. The play cards leave until the whistle. The result comes back as one short line. Millrace's highlight has no buttons either. The version stays readable when the window is 360 pixels wide, and Settings stays on the screen at 390.

Saves, the clock's wording, sound and the settings row are the shared arcade ones. The game saves after every play (`lantern-bowl-save-v1`, file version 2). A save from this version keeps loading. A v1 file steps up to v2 and keeps the same match, with overtime turns at zero if it had none. A file newer than this game is left alone: this version does not write over it, and the page says progress will not be saved. Closing the tab does not play the game for you. There are no ads, energy bars or paid shortcuts.

Play: [games/lantern-bowl/](index.html). Checks: `node tools/run-all-checks.cjs lantern-bowl`.

## Files

- `model.js` — the rules, the seeded dice, and nothing about the screen
- `view.js` — the side-on field and camera, and the older behind-the-play camera the checks still use
- `game.js` — input, drawing, sound, settings and the save
- `index.html`, `style.css` — the phone-first page

## Later

A league, money and a weekly dilemma, scouting, age, a draft, box scores, career numbers, leaders, and a heavier save file. Listed in [docs/plans/lantern-bowl.md](../../docs/plans/lantern-bowl.md).
