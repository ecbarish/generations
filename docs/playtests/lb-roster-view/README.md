# Lantern Bowl roster view: preview

This is LB-G7. `games/lantern-bowl/roster-view.js` draws one club's players from `games/lantern-bowl/roster.json` as a list, with ratings as words and stars first and numbers second. **The game does not open this screen yet.** It touches no save and no game file, and `style.css` is not edited: the module adds one `<style id="lbrv-style">` block, and every class in it starts with `lbrv-`.

## Look at it

Serve the repo over http (a page opened from a file cannot fetch the roster), then open the page:

```
python3 -m http.server 8731
http://localhost:8731/docs/playtests/lb-roster-view/index.html
```

`?club=millrace` opens one club. `?all=1` draws all six one under the other. The club selector is a 44px control. Lantern Bowl is landscape-only on phones, so there is no portrait layout.

## What a row shows

- the position tag (QB, RB, WR, TE, OL, DL, LB, DB, K), the name, and `age 27`;
- the player's **two best ratings**, each as a word then its number (`Pass rush Elite 80`);
- a **1-to-5 star grade** and its word, from the player's overall (the mean of the ratings they have, as `tests/lantern-bowl-roster.cjs` defines it, rounded to a whole number): 35-45 one star (Rough), 46-56 two (Fair), 57-67 three (Solid), 68-78 four (Strong), 79-90 five (Elite).

Rows are 72px tall at the phone sizes and never under 44px, and no text is under 16px. Offence (10) and the kicker (1) sit on the left on a wide screen and defence (11) on the right, so both sides are 11 rows. Below 640px wide it is one column. Reading order stays Offence, Defence, Kicker.

## Screenshots (Chrome 154, 2x pixel ratio, Brackenport)

| File | Size | What it shows |
|---|---|---|
| `roster-844x390.png` | 844x390 | Top of the list on a common landscape phone |
| `roster-780x360.png` | 780x360 | Top of the list on a short landscape phone |
| `roster-667x375.png` | 667x375 | Top of the list on a small landscape phone (the tightest width) |
| `roster-1024x594.png` | 1024x594 | Top of the list on a small tablet or desktop window |
| `roster-1024x594-full.png` | 1024 wide, full page | All 22 rows, for the full picture |

`report.json` holds the measurements from the same run: 22 rows at each size, smallest row 72px, smallest text 16px, two columns, no sideways overflow, and no page error at any size, for all six clubs picked from the selector, and with all six drawn at once (132 rows).

## Checks

`node tests/lantern-bowl-roster-view.cjs` (no packages, no browser) checks that every club gives 22 rows in order (the backlog row says 23, but the roster file and the Director's correction on #373 say 22), every star grade sits in its band, the best two ratings are picked correctly and ties are broken the same way every time, the same input gives the same rows, an unknown club ID throws a clear error, malformed rosters and clubs (wrong slot counts, a rating outside 35-90, a text or fractional rating, an unknown rating key, no name) are refused, as is a club ID that is not one of the six, and the list draws with the right rows, groups, stars, word-before-number order, one style block, `lbrv-` classes, 16px text and 44px rows. It also runs 21 deliberately broken copies of the module and requires every one to fail a check.

## For the Game Art Director

Please look at the five screenshots. Things I would like a view on: the star and word treatment (filled and empty stars, with the word under them), the row density at 667x375, the dim empty stars (`#4a4a50` on the row colour), and whether the slot tags should be words (Line, Front, Backer) instead of OL, DL, LB, DB. The colours are the game's own (`#f6edd4` ink, `#f2d080` lamp, `#6d5a38` border). If you want the styles moved into `style.css`, that is the later LB-MANAGER wiring.
