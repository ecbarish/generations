# WB-C2: first partner sooner

Draft implementation; not merged, exported or published. This is targeted verification of the approved cycle-1 opening fix, not a new exploratory playtest campaign.

## Change

The arrival, Maren greeting and barn invitation lose repeated exposition. Family recognition stays at the register; the exact four existing family tales and the four-tellings clue follow the first bond instead of delaying the first creature choice. No automatic choice, skipped character creator, new lore, save flag or creature-data change.

## Baseline and verification

Baseline source: `40fcaf9c459e55f3e71c98b3a269072c45e707ee`; baseline main.gd SHA-256 `175eedf35465095581b7ca0d1fc9da199ca5d7c2fbf9065f8b4c424e27609801`.

- Local Godot 4.6.3: baseline 1,528 checks pass; revised 1,606 pass, including all twelve heritage/starter combinations and frozen pre-change save loading.
- Local aggregate browser checks could not start Chromium; official-engine aggregate CI and rendered baseline/current timings are pending.
- A repeatable real-input protocol will report both first acquisition and returned control with the partner. Simulated reading/choice budgets are disclosed; they are not a guarantee of every newcomer's reading speed.

## Frozen save provenance

`wildbond-godot/tests/fixtures/wb-c2-pre-change.json` was written by the baseline game's own save_game(), in an isolated test process. It has a renamed Ripplet (Puddle), a named ranch Mosshog (Fern), Coastfolk identity, nondefault HP/trust, inventory, badge, story and position. SHA-256: `643589c680ea74c739c93b586a7e56d475fd6144cf58da24c79b74503a35bb74`.

The revised suite loads those bytes, checks all preserved values and confirms the opening and relocated tale do not replay. Existing corrupt/missing-save recovery and older-format checks remain intact. This proves save-format compatibility; it does not establish browser IndexedDB continuity across the earlier site rename.
