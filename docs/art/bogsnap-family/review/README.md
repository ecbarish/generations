# Stillmaw 600/700: independent balance-contract review

WB-GUEST-STILLMAW-BALANCE-REVIEW · dot for Adam / abarish-dev · 2026-10-20

## Result

**The pinned study is internally consistent and remains unsuitable for runtime import.** The existing read-only check passes all 16 species, the regression command passes all 30 cases, and the strict runtime gate intentionally exits 2. These results establish data/reference consistency, not battle balance.

Retain the approved 600/700 target and unchanged starter budgets as design inputs. Before implementation, the runtime owner needs a deliberate progression/access decision, a precise ability/critical-hit contract, and separate chapter-versus-production Isolde checks. No stat change is recommended or made by this report.

The highest-risk misunderstanding is that the current chapter already contains Isolde's Bogsnap. It does not: the chapter roster is Pidgey 6, Wooper 7 and Mosshog 8. Bogsnap 12 belongs to the separate canonical production roster.

## Scope and provenance

- [Owner assignment][routing]; [claim][claim] and draft PR #603 precede this report.
- Exact study base: `eff5d64ec09fc1003822c15ac826f70c340f908f`, tree `80a71d715bc1c2de79a86a3d6b2db0c81a9f7607`. Target: `codex/bogsnap-family-study`.
- The study's runtime audit reference is `7c535ffa896abfc00bf01a96a12df2d7ad308d09`. Its ten relevant runtime sources were compared with parent chapter head `4c0b1277dbb417d928472f24f227ed347815ba0b`; all ten Git blob hashes are identical. Current main observed during review: `8df479c9485969ff4ed6de8fd691e1a5e6094a3d`.
- [SOURCE-MANIFEST.json](SOURCE-MANIFEST.json) records exact source paths, hashes and comparison results. Sources were materialized and Git-blob-verified in an isolated Linux cloud workspace. This was a selected-file materialization, not a full checkout or a Godot run.
- Own only new files in this review directory. No executable code, simulator, candidate data, abilities, source art, lore, Godot, saves, COMMS or START-HERE changed. No merge or release.

## 1. Approved budget, unmeasured distribution

Canonical order is HP / Attack / Defense / Sp.Atk / Sp.Def / Speed.

| Candidate | Spread | Total |
|---|---|---:|
| Boglet | 55 / 55 / 65 / 35 / 60 / 40 | 310 |
| Bogsnap | 75 / 85 / 85 / 40 / 70 / 50 | 405 |
| Stillmaw | 105 / 135 / 125 / 65 / 110 / 60 | 600 |
| Mega Stillmaw | 105 / 165 / 155 / 75 / 135 / 65 | 700 |
| Thornback | 100 / 110 / 105 / 65 / 85 / 65 | 530 |
| Tidewyrm | 85 / 75 / 90 / 115 / 95 / 70 | 530 |
| Blazefang | 78 / 105 / 70 / 92 / 75 / 110 | 530 |

Source: [study README, lines 70–89][spreads] and [candidate JSON][candidates].

- Stillmaw has 70 more base points than each starter final. Against Thornback's physical-tank spread it gains 5 HP, 25 Attack, 20 Defense and 25 Sp.Def, has equal Sp.Atk, and gives up only 5 Speed. This creates a concrete role-overlap risk; rarity, timing and move access must justify the stronger replacement. It is not evidence that Thornback loses an actual battle.
- Mega adds exactly 0 / 30 / 30 / 10 / 25 / 5. The large physical attack/defense gains and already high special bulk compound the defensive ability change. Mega Stillmaw's 65 Speed also equals normal Thornback's base Speed; actual order still depends on level, modifiers, priority and ties.
- Tidewyrm retains a special-offense niche and Blazefang a speed niche. No legal final-form move sets or measured comparisons establish whether those niches are sufficient.
- Original starter spreads remain exactly 306 / 313 / 307, matching the chapter's [original-data.json][originals]. Middle/final/Mega targets remain 405 / 530 / 630. This does not mean all those forms exist in the chapter: its [catalogue allowlist][catalogue] contains only three original starters and three Pokémon.
- Starter Mega ability candidates are explicitly null. A claimed equivalent-form comparison would be premature until the owner selects or deliberately defers those abilities and defines equivalent form/item access.

“Tyranitar tier” is an approved total budget here, not demonstrated Tyranitar-equivalent matchups. No Pokémon comparison data, new damage calculations or simulated battle results were generated for this review.

## 2. Ability contract and type risks

The [candidate contracts][abilities] say Shell Armor prevents critical hits without reducing ordinary damage. Mega replaces it with Thick Fat, which halves the corresponding attacking stat for incoming Fire/Ice moves while leaving type effectiveness unchanged.

- **Shell Armor has no realized value in the current chapter.** Its damage path passes no critical-hit input or ability through [journey/rounds.gd][rounds] into [muse_math.gd][math]. The separate legacy [scripts/rules.gd][legacy-crit] does have a critical-hit roll. Do not conflate those engines or claim that Wildbond globally lacks critical hits.
- **Mega is an exchange, not stacked protection.** It gains Thick Fat and loses Shell Armor's critical-hit protection. This loss matters only after the chosen critical-hit engine exists. Neither concept art nor a green study check supplies the missing implementation.
- **An attacking-stat modifier is not an exact final-damage promise.** Integer flooring and the additive base-damage term in the chapter formula mean “half the attacking stat” must not be reported as a measured 50% reduction to every damage result. Apply the effect to physical and special Fire/Ice attacks at the explicitly chosen pipeline stage, without permanently changing the attacker's stored stats.
- The pinned [type chart][chart] and dual-type multiplication give ordinary Water/Grass weaknesses to Flying, Poison and Bug; Fire/Ice are neutral, Water is quarter-effective, Ground/Steel half-effective, and Grass/Electric neutral. Thick Fat changes neither those chart values nor weaknesses to Flying/Poison/Bug. Fire/Ice damage mitigation is the separate proposed modifier.
- This makes starter matchups asymmetric even before coverage: the water starter's matching attack is quarter-effective against Water/Grass; grass and fire are ordinarily neutral, with fire additionally subject to proposed Thick Fat in Mega form. Legal coverage, learn timing and starter passives therefore matter more than equal access to 530-total finals.
- Overgrow/Torrent/Blaze require the matching-type attacking-stat multiplier at `hp * 3 <= max_hp`; physical and special cases both matter. The current report provides no trigger, suppression, burn, critical-hit or switching implementation proof. The exact generation/extension contract remains a prerequisite, as the study itself states.

## 3. Progression, identity and Isolde are separate owner decisions

### Provisional levels cannot be imported as settled progression

The candidate's 16/36 edges are still provisional, and the [production contract][progression] says the final level is not approved. The 405-to-600 jump is 195 base points, compared with 125 from a proposed 405 middle starter to its 530 final. That larger payoff makes maturation, availability, growth curve and move timing material design choices. Merely increasing a level would not settle all four.

The legacy [Bogsnap evolution edge][evolution] is level 18 plus bond step 1; the [legacy rules][legacy-evolution] explicitly require level and any additional trust condition. The study's level-only edge list does not encode an agreed replacement trust rule. Preserve old Bogsnap and already evolved Stillmaw individuals; decide grandfathering and future evolutions explicitly rather than demoting species, lowering levels or silently dropping trust.

The legacy evolution helper currently adds HP on evolution ([rules.gd, lines 318–328][legacy-evolution]). That behavior is not a safe migration routine for the study's “no refill” requirement. Existing-identity/stat migration and ordinary earned evolution require distinct owner decisions and checks. Temporary Mega must not become a saved species, refill HP/PP or reset identity.

### Production roster and native chapter must not be treated as one test

| Source context | Actual pinned state | Consequence of future adoption |
|---|---|---|
| Canonical production data | `wildbond-godot/data/wildbond.json`, JSON pointer `/STORY/2/team`: Pebblepaw 11, Bogsnap 12, Thornback 14 | Raising Bogsnap and Thornback budgets would change two members of the first-Warden team, even if roster IDs and levels stay unchanged. |
| Same production data | `/SPECIES/bogsnap/base`: 58 / 62 / 55 / 40 / 48 / 35 = 298 in canonical order | Proposed Bogsnap 405 adds 107 base points: +17 HP, +23 Attack, +30 Defense, +0 Sp.Atk, +22 Sp.Def, +15 Speed. This is not a cosmetic stage relabel. |
| Legacy Godot catalogue | `evolution.json`, `/species/stillmaw/base` = 460; `wildbond.json`, `/SPECIES/thornback/base` = 440 | Proposed 600 and 530 are increases of 140 and 90 respectively. This base-plus-overlay catalogue is not the proposed chapter catalogue. |
| Native chapter at both audited heads | [thornwood.gd:7][isolde]: Pidgey 6, Wooper 7, Mosshog 8; [README:7–13][chapter-readme] calls this an adapted team | No immediate Bogsnap difficulty increase exists in that roster. Test the retained adapted team separately from any later canonical-team adoption. |

The production JSON is a single-line export, so the JSON pointers above are more precise than a line number; its exact blob is recorded in the manifest. Production Bogsnap also appears in `/BIOMES/thornwood/wild`, `/MAPS/thornwood/seasonal/*/wild` and `/MAPS/thornwood_grove/wild`. Availability review must therefore cover both opponent strength and early player access to the stronger 405 species, without silently replacing those encounters with Boglet.

## 4. What the green checker does and does not protect

Current data is correctly marked provisional. Static inspection found one useful guardrail gap and several intentional limits; no additional mutation experiments or new test code were run. The existing regression suite does mutate cloned inputs.

1. **Progression metadata can disagree without this checker detecting it.** [check-study.cjs:65–75][checker] checks the two species edges, integer levels from 1–100 and the unresolved status string. It does not compare levels with `existing_proposal_levels`, require increasing levels, or enforce `final_level_approved: false`. The regression named “reject falsely finalized progression” changes the status string only. A future owner should keep those fields consistent and add a bounded regression if the checker is meant to protect them.
2. **Final spread approval is outside the check.** Only early `preserve_spread` values are pinned; final/Mega distributions are constrained by totals, +100, unchanged HP and nondecreasing Mega components. Passing does not approve this particular 600/700 allocation.
3. **The editable contract is not independent approval evidence.** Ability text and species tiers are compared with the accompanying contract. Coordinated edits to both files still need owner review; source control and the explicit approved target remain part of the boundary.
4. **No runtime safety follows from arithmetic assertions.** The “Mega HP refill loophole” regression tests base HP equality, not live HP/PP or save behavior. `runtime_ready: false`, zero battle simulations and zero production assets checked remain correct.

## 5. Minimal future owner check plan

This is a plan for a separately owned integration task, not authorization or a new implementation assignment.

1. **Pin the integration target and decisions first.** Choose chapter versus legacy production consumer, exact rules/critical-hit version, supported species, final maturation/trust/availability/learnsets, and Mega unlock/item limits. Preserve 600/700 and unchanged starter targets unless Evan explicitly revises them. Resolve the progression metadata mismatch risk before treating it as a machine gate.
2. **Check factories and save boundaries.** At the selected implementation head, verify the six canonical stats and legacy `spd → speed` mapping; unchanged early starters; unsupported IDs fail safely; old Bogsnap/Stillmaw keep identity, level, XP, condition, HP and PP under the approved migration rule. Cover damaged, fainted and already evolved individuals, and temporary form cleanup. Obtain required save-design approval before persistent changes.
3. **Check actual ability hooks deterministically.** Force ordinary and critical hits with/without Shell Armor; normal damage must stay unchanged. For Thick Fat, test physical/special Fire and Ice, a nonmatching move, unchanged type multipliers and loss of Shell Armor. For each starter passive, test below/at/above the one-third threshold, matching/nonmatching types, both damage categories, fainting and switching. Add suppression/interactions only if supported, and record unsupported cases.
4. **Measure legal matchups only after inputs exist.** Compare each starter line with the family at equal levels, individual modifiers and legal move access; normal and equivalent-Mega access separately. Record seeds/policy, turns, remaining HP/PP, healing/item use, relevant speed ties and critical-hit outcomes. Set owner acceptance criteria before calling results balanced; this review supplies none of those measurements.
5. **Play the actual first-Warden route for all three starters.** Keep the adapted chapter baseline separate from any proposed production roster. Record preparation resources, available catches, retries and which team was used. Recheck early access to Bogsnap and both altered production members if canonical adoption is chosen. End with owner/player acceptance, not an arithmetic pass.

## Executed checks and limits

Run at 2026-10-20 04:39:35 UTC with Node `v24.19.0`, Linux `6.18.55 x86_64`. Full outputs: [CHECKS.txt](CHECKS.txt).

| Existing command | Observed result |
|---|---|
| `node docs/art/bogsnap-family/check-study.cjs` | Exit 0; 16 species; no errors; all four runtime blockers retained |
| `node docs/art/bogsnap-family/check-study.test.cjs` | Exit 0; 30 regression cases pass |
| `node docs/art/bogsnap-family/check-study.cjs --require-runtime` | Expected exit 2; valid study remains runtime-blocked |

All materialized study input SHA-256 hashes were identical before and after these commands. Reference PNG Git blobs and the contract's SHA-256 hashes matched. Images were not edited or visually reapproved. The historical 101 arithmetic assertions in `validation.json` were read, not independently rerun as a separate generator.

No battle simulation, new executable test, native Godot run, save-load test, first-time-player session or full local aggregate was performed. Normal exact-head PR CI, if triggered, is a separate PR/Tower observation and does not upgrade this report into gameplay acceptance. The review stops at this handoff.

[routing]: https://github.com/ecbarish/generations/issues/373#issuecomment-6283420477
[claim]: https://github.com/ecbarish/generations/issues/373#issuecomment-6283466237
[spreads]: https://github.com/ecbarish/generations/blob/eff5d64ec09fc1003822c15ac826f70c340f908f/docs/art/bogsnap-family/README.md#L70-L89
[candidates]: https://github.com/ecbarish/generations/blob/eff5d64ec09fc1003822c15ac826f70c340f908f/docs/art/bogsnap-family/balance-candidates.json
[abilities]: https://github.com/ecbarish/generations/blob/eff5d64ec09fc1003822c15ac826f70c340f908f/docs/art/bogsnap-family/balance-candidates.json#L325-L360
[progression]: https://github.com/ecbarish/generations/blob/eff5d64ec09fc1003822c15ac826f70c340f908f/docs/art/bogsnap-family/production-contract.json#L236-L252
[checker]: https://github.com/ecbarish/generations/blob/eff5d64ec09fc1003822c15ac826f70c340f908f/docs/art/bogsnap-family/check-study.cjs#L65-L81
[originals]: https://github.com/ecbarish/generations/blob/7c535ffa896abfc00bf01a96a12df2d7ad308d09/wildbond-godot/tests/journey/original-data.json#L3-L90
[catalogue]: https://github.com/ecbarish/generations/blob/7c535ffa896abfc00bf01a96a12df2d7ad308d09/wildbond-godot/tests/journey/catalogue.gd#L5-L29
[rounds]: https://github.com/ecbarish/generations/blob/7c535ffa896abfc00bf01a96a12df2d7ad308d09/wildbond-godot/tests/journey/rounds.gd#L94-L115
[math]: https://github.com/ecbarish/generations/blob/7c535ffa896abfc00bf01a96a12df2d7ad308d09/wildbond-godot/tests/battle_slice/muse_math.gd#L12-L26
[chart]: https://github.com/ecbarish/generations/blob/7c535ffa896abfc00bf01a96a12df2d7ad308d09/wildbond-godot/tests/journey/core-data.json
[legacy-crit]: https://github.com/ecbarish/generations/blob/7c535ffa896abfc00bf01a96a12df2d7ad308d09/wildbond-godot/scripts/rules.gd#L356-L376
[legacy-evolution]: https://github.com/ecbarish/generations/blob/7c535ffa896abfc00bf01a96a12df2d7ad308d09/wildbond-godot/scripts/rules.gd#L290-L328
[evolution]: https://github.com/ecbarish/generations/blob/7c535ffa896abfc00bf01a96a12df2d7ad308d09/wildbond-godot/data/evolution.json#L4469-L4475
[isolde]: https://github.com/ecbarish/generations/blob/7c535ffa896abfc00bf01a96a12df2d7ad308d09/wildbond-godot/tests/opening/thornwood.gd#L7
[chapter-readme]: https://github.com/ecbarish/generations/blob/7c535ffa896abfc00bf01a96a12df2d7ad308d09/wildbond-godot/tests/opening/README.md#L7-L13
