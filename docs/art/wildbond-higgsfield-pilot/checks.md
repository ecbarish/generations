# Evidence — 2026-10-13

Promise/payoff follow-up: verified coverage against the actual Godot evolution overrides: all 15 evolving roots and 17 terminal outcomes appear in EVOLUTION-PROMISES.md. `evolution-graph.json` preserves that inspected graph. Both family pages pass 54 combined responsive/mode/size checks (Pyremane has four endpoint cards; Tidewyrm has five study cards), with no page errors, overflow or unequal comparison heights. Evidence: `pyremane/browser-checks.json` and `capture/pyremane-*.png`.

Tidewyrm follow-up: all 20 suites rerun successfully after adding the interactive workshop and the standalone Godot comparison. Browser-specific evidence is in `tidewyrm/browser-checks.json`: 27 viewport/mode/size combinations, all five images visible, equal-height comparisons and no horizontal overflow or page errors. GPU evidence: `capture/tidewyrm00000000.png` and `capture/tidewyrm.log`.

`node tools/run-all-checks.cjs` exited 0: **All 20 suites pass.** Fresh browser contexts; no personal saves.

| Suite | Result |
|---|---|
| Realmbound | 8997 scenario checks |
| Wildbond | 3254 checks |
| Starfall | 58 checks |
| Sound | 21 shared sound checks |
| Offline | 15 checks |
| Diamond Career | 129 checks |
| Diamond Manager | 102 checks |
| Otherworld | 1899 checks |
| Runner safety | 35 checks |
| Studio | 43 checks |
| Storm Front | 38 checks |
| Lighthouse Watch | 87 checks |
| Brisket's Crossing | 73 checks |
| Ember Bricks | 44 checks |
| Little Ranch | 111 checks |
| Tell Us | 181 checks |
| Wildbond Godot | 1528 checks |
| Starfall Godot | 272 checks |
| Wildbond catalogue | 112 species, current |
| Save names | 22 names unchanged |

Additional isolated preview checks: six originals load as 2048-square textures; 21 main sheet regions are positive and within source bounds. GPU captures made with Godot 4.7.2 on NVIDIA RTX 4090, OpenGL compatibility renderer. Reviewed starter and evolution captures at 1536×864. No errors in capture stderr. Sheet connected-component audit reproduces unchanged source hashes.

The visual checks establish texture import and readable static silhouettes. They do not establish movement animation, collision integration, matching game camera or commercial rights.
