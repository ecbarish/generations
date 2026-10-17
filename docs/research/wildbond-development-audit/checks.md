# WB-DEV-AUDIT validation record

Audited runtime source: `b8493ff05e08073a7255968a83d015bd520d1c28`.
Audit branch claim: `f03d24b962c22b67063362b4c73fdc27a42197ba`.
Run on Evan's Windows host, 2026-10-16 local / 2026-10-17 UTC, Node 24.19.0, Chrome, Godot 4.7.2 (`ed1daf0bf`).

No tracked runtime, tests, assets or exported packs changed. Test caches are local only; the suite uses isolated browser contexts and Godot test save paths/`no_save`.

## Commands

The clone uses the bundled Playwright package through NODE_PATH:

```powershell
$env:NODE_PATH = 'C:\Users\evanb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node tools/run-all-checks.cjs
```

Initial setup: a missing Playwright lookup was fixed with that environment variable. Sandboxed Chrome returned `ERR_NETWORK_ACCESS_DENIED` for localhost; that attempt was interrupted and the authorized unsandboxed run supplied the results below. Its partial Wildbond import cache caused the first Godot suite to time out on missing imported textures. The explicit import completed successfully, then only the two affected suites were rerun:

```powershell
& 'C:\Users\evanb\Godot\Godot_v4.7.2-stable_win64_console.exe' --headless --path wildbond-godot --import
node tools/run-all-checks.cjs wildbond-godot night-market
node --check docs/research/wildbond-development-audit/inventory.cjs
node docs/research/wildbond-development-audit/inventory.cjs
git diff --check
```

## Results

| Suite | Full aggregate | Focused rerun |
|---|---|---|
| Browser Realmbound (`run`) | 9,076 passed | Not repeated |
| Browser Wildbond | 3,254 passed | Not repeated |
| Browser Starfall | 58 passed | Not repeated |
| Sound | 21 passed | Not repeated |
| Offline | 18 passed | Not repeated |
| Diamond Career | 129 passed | Not repeated |
| Diamond Manager | 119 passed | Not repeated |
| Otherworld | 1,907 passed | Not repeated |
| Runner safety | 35 passed | Not repeated |
| Studio | 43 passed | Not repeated |
| Storm Front | 38 passed | Not repeated |
| Lighthouse Watch | 87 passed | Not repeated |
| Brisket | 73 passed | Not repeated |
| Ember Bricks | 44 passed | Not repeated |
| Little Ranch | 546 passed | Not repeated |
| Tell Us | 181 passed | Not repeated |
| Lantern Bowl | 657 passed | Not repeated |
| Keymaster | 48 passed | Not repeated |
| Shared save | 22 passed | Not repeated |
| Idle core | 66 passed | Not repeated |
| Night Market | Failed: Ready to hire, 568×320, Back/cash overlap | Same failure |
| Launcher | 554 passed | Not repeated |
| Wildbond Godot | Import-cache failure / timeout | **19,717 passed, 0 failed** after import |
| Starfall Godot | 488 passed | Not repeated |
| Wildbond catalogue | Current, 189 species | Not repeated |
| Save names | 23 unchanged | Not repeated |
| Asset library | 25 stable IDs, 23 sources, gates valid | Not repeated |
| Agent context | 21 passed | Not repeated |

The aggregate exits 1 (26/28 passing); the focused pair exits 1 because Night Market still fails. Combined evidence covers 27 passing suites, not an all-green aggregate. Night Market is unchanged from audited main and outside the Wildbond assignment; its failure holds this draft's normal review gate. No checks were disabled or modified.

The new inventory exits 0 with 189 effective species and no missing learned move, element, evolution target or cycle finding. Syntax and whitespace checks pass. See inventory.json for data/art coverage and explicit diagnostic limitations.

No new visual change, new human playthrough, physical-phone check, new exported-pack verification or publication is claimed. Runtime/save behavior is unchanged; the passing Wildbond suite supplies existing save-fixture evidence, not new private-pack compatibility evidence.
