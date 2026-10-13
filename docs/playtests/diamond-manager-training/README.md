# Diamond Manager Training Rooms feedback (DM-N1b)

## Player experience

Ballpark now links to a named-player winter outlook inside the existing front-office clipboard. Each eligible roster or farm player shows their current scout estimate and the ceiling with the current rooms and the next room. Training is an end-of-season effect; building does not change today's ratings. The outlook explains that growth depends on space below the ceiling, playing time, winter form and coaches. Players older than 27 do not receive a training forecast.

The calculation mirrors only the deterministic ceiling part of develop(): two training points per room, lifting a young ceiling by one per room up to 92. All displayed ceilings go through the existing scouting rounding. Rough scouts keep saying about; exact values require the existing upgraded scouting. No hidden precision is leaked. Growth numbers are allowances, not promises of exact overall increases.

## Validation

- All 20 suites pass; Diamond Manager has 102 checks (five new).
- Forecasts compared to actual develop() across 36 age/room/ceiling cases, including age 27 and the 92 cap. Additional checks cover scouting levels, no mutations or dice rolls, older players and no immediate rating promises.
- 28 browser checks across phone 375×812, laptop 1366×768, desktop 1920×1080 and ultrawide 3440×1440: named rows, actual purchases at original prices, unchanged players and seed, farm players, reload and approximate scouting.
- Twelve screenshots: before screens load the committed b847504 ui.js; exact and approximate after screens show the real purchases. All browser contexts and fixture saves are isolated; phone is emulation.

Run with the own-clone serve.ps1 server on localhost:8777 and Playwright available in NODE_PATH:

`node docs/playtests/diamond-manager-training/browser-checks.cjs`

BASELINE=1 captures the previous UI. The fixture sets enough cash and exact scouting to make the numerical comparison legible; the normal rules are not changed. results.json records the patched checks.

## Scope

A read-only feedback repair for Flint's reported invisible upgrade effect. No balance, dice order, development mechanics, save fields, version numbers, shared systems or Godot edits. The pure helper is in games/diamond-manager/js/training.js. It is tested against develop() to catch drift. Existing offseason growth reports remain unchanged. Streaks and new dugout calls remain DM-N1 and wait for cycle planning.
