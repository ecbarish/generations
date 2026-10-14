# Lantern Bowl: the pitch (LB0)

**Working title.** A football game in the spirit of Retro Bowl, our own from the ground up. Part of the sports plan
([sports-management.md](sports-management.md), Game 2). Mock screens: [mock.html](lantern-bowl/mock.html), drawn in
code at the arcade's 384 by 216 pixel scale.

## In one paragraph
The Brackenport Lanterns play football under the lanterns at Lamplight Field. You are the head coach and general
manager. On game day you **call and play your offence's drives**: pick a play on the chalkboard, then make the one
readable choice that matters (which receiver, and when). The defence, kicks and the other side's drives play out on
their own, shown quickly. A game is about six of your drives, two to four minutes. Between games you run the club
from the coach's room under the stands: who starts, who gets paid, what to build, whom to draft.

## Why it's fun (what we take from the mobile hits)
You act in the big moments, the simulation handles the rest, and a game is short (Retro Bowl, Football Manager
Mobile). Ratings visibly matter, money is the tension, and players are people you remember (Diamond Manager's own
lessons). Each game ends with one or two decisions, never a screen of forty columns.

## Three screens

| | What you see | What you do |
|---|---|---|
| ![The field](lantern-bowl/1-field.png) | **The field**, seen from the press box: the field runs left to right, under the lanterns. The line of scrimmage is blue and the first-down line is gold. Receivers run chalk-dotted routes. | When a receiver comes open, a lamplight ring appears around them and turns gold at the best moment. Tap or click the receiver (or press their number key) to throw. Wait too long and the window closes. Runs are chosen, not steered. |
| ![The play call](lantern-bowl/2-play-call.png) | **The play call**: the coach's chalkboard held up on the sideline, four plays drawn in chalk, the down and distance, and what the defence is showing. | Pick one of four plays (keys 1 to 4). Your quality-control coach offers a hint grounded in what has happened this game; take it or not. |
| ![The office](lantern-bowl/3-office.png) | **The office**: the coach's room under the stands. The depth chart is a board on the wall, the facilities are a stadium model, trophies sit on a shelf, and players come to the desk. | Walk to (or click) a thing to use it: set the depth chart, hear a contract request, spend coaching points, build up the park. Cap room, coaching points and the fans' mood sit in one thin line. |

## The rules in brief
- **Players:** about twelve who matter: quarterback, running back, two receivers, tight end, the line (one rating),
  the defence (three ratings: pass rush, coverage, tackling), and a kicker. Each has two or three ratings in words
  first, numbers second.
- **A drive:** downs and distance as in real football; four play calls; the passing moment decides throws; runs and
  sacks come from ratings. Touchdown, field goal (simulated kick, odds shown), or punt.
- **The other side's drives:** simulated from your defence's ratings against theirs, shown as a two-line summary
  with a small replay of the key play.
- **Between games:** salary cap, contracts and renewals, coaching points (training or morale), facilities (stadium,
  training ground, rehab room), a draft each winter, owner and fan opinions. The office code is shared with Diamond
  Manager (`shared/sports-office.js`, LB1).

## Kept clearly apart from Retro Bowl
Retro Bowl's code and art belong to New Star Games. We copy no names, screens, art, layout or controls. Where it
helps to be specific:
- **View:** Retro Bowl runs its field up the screen and scrolls; ours runs left to right, seen from the press box.
- **Throwing:** Retro Bowl drags back to aim with a slingshot line; ours picks an open receiver whose lamplight ring
  shows the timing. No aiming line.
- **Look:** our pixel people have real proportions (art guide rule 2, no big heads), our palette is dusk and
  lamplight, the arcade's ink outline and lamp colour.
- **Front office:** ours is a place with people (the coach's room, players at the desk), not a menu of tiles, per the
  "in the game window" rule.
- **Names:** our own club (the Brackenport Lanterns), league clubs and players, drawn from the arcade's world.

Design decisions thread: please confirm nothing here sits too close to Retro Bowl's look (LB0's "checked by" step).

## Open questions (defaults chosen, change if the Design decisions thread disagrees)
- Defence: simulated by default. Default: an optional "call the defence" (three choices) on third down, later.
- Two-point tries and onside kicks: in LB3 as one-tap choices.
- Season length: twelve games plus a two-round final, as in the plan.

## First playable slice (2026-10-14)

One game at Lamplight Field, in `games/lantern-bowl/`. The Brackenport Lanterns against Millrace. Four two-minute quarters. You call a play, then play the snap: drag to throw (a short pull is a bullet, a long pull is a lob), swipe to juke, tap to dive, and a Turbo button that spends a visible wind bar. Run lanes glow green or red from the blocker-versus-rusher check. The pocket ring shrinks. Ratings are 0–100, with the league around 50, and they change who wins blocks, tackles and catches. Their drives are a short telling, not a second stick you hold. The game saves after every play through `shared/engine.js`, and it uses `shared/sound.js` and the shared settings row.

The picture is from behind the offence. That camera is only a view. `view.js` leaves a named place for a side-on look later; it is not built. Team-colour outlines are drawn in code from each club's colour.

Idle progress while the tab is closed does not fit this game: the match is the snaps you play. The shared save resumes the same game, and the arcade's installable shell can keep the page for offline play.

The LB0 mock still shows the press-box picture and a tap-the-receiver throw. This slice follows the later request for a behind-the-play camera and a drag throw. The mock is the pitch, not the control scheme of the slice.

## Follow-ups (not in this slice)

- The defence learns your three most-used plays.
- A league of 8 to 12 teams.
- Currency, and one dilemma a week.
- Scouting ranges, age curves, and a three-round draft.
- Box scores, career stats, and league leaders.
- IndexedDB for the save, plus export and import beyond the shared save string.
- The coach's room, salary cap and facilities (`shared/sports-office.js`, LB4).
- An optional side-on view, using the seam already in `view.js`.
