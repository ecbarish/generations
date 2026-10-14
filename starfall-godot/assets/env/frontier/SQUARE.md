# Starfall square and road dressing (ART-SF-8)

Original code-drawn indexed pixels from the approved Starfall palette, on one sheet (`square.png`, 128×32).
Generate with `PYTHONDONTWRITEBYTECODE=1 python tools/art/starfall_square.py`; append `--check` to verify.

| Piece | Atlas rect | Footprint | Solid | Where the game puts it |
|---|---|---|---|---|
| ruts-h, ruts-v | 0,0 / 16,0 | 1×1, flat | no | most straight road tiles (wheel ruts) |
| puddle-a, puddle-b | 32,0 / 48,0 | 1×1, flat | no | four spots on the road and square (`PUDDLES`) |
| tuft-a, tuft-b | 64,0 / 80,0 | 1×1, flat | no | moss beside the road or square, outside plots |
| scuff | 96,0 | 1×1, flat | no | some packed-earth square tiles (boot prints, straw) |
| step | 112,0 | 16×8, flat | no | under the apothecary's, healer's and tavern's doors |
| bench | 0,16 | 2×1 | yes | the square's south edge, by the well (8,13) |
| hitch | 32,16 | 2×1 | yes | hitching rail and trough on the road by the inn (22,10) |

Also placed (ART-SF-6 props): a barrel and a crate beside the inn (17,5 and 17,6), two barrels by a finished tavern's
door (its prop slot) and a firewood stack by the smithy's wall (plot + 2,0, solid). Flat pieces are chosen by tile,
so they never shift. `tests/run_tests.gd` (`_dressing`) checks that nothing standing sits on a road, step, station,
lamp stand or reading spot, and that every station stays reachable from the gate with any buildings on any plots.
[Contact sheet](../../../../docs/art/starfall/square-contact.png).
