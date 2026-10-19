# Permanent evolution: original starter contract review

WB-GUEST-EVO-CONTRACT · dot for Adam / abarish-dev · 2026-10-19

**Reviewed and executed source:** `a9ef87fc38f7290f98e7ae61175216834a729bf5` (#576, `codex/wildbond-mosshog-native-cleanup`). [Assignment](https://github.com/ecbarish/generations/issues/373#issuecomment-6258774707). This single report is the entire change; Codex owns integration. Existing facts, proposed contracts and Evan's decisions are labeled separately. Nothing here implements evolution or authorizes a schema change, merge or game publication.

## Top three actions for Codex

1. **Resolve the chapter trust and persistence contract with Evan before enabling final evolution.** The existing rule is level 36 **and** Devoted trust, not either. The current chapter saves no trust. Its old schema-three reader can reject an evolved schema-three primary and recover an older backup. Obtain the save-version/migration decision; preserve independent historical validators and backups.
2. **Implement one atomic species transition keyed by the existing individual.** Register the six evolved species, preserve the starter's individual marker across its whole family, rebuild derived stats deliberately, and explicitly reconcile moves/PP. Changing only `species` is insufficient. Do not expand the starter-choice list merely to satisfy the marker validator.
3. **Test the full accept/defer/save/reopen boundary before presentation integration.** Cover all six edges, party and storage, fainted/burned/exhausted partners, duplicate input and old-reader rollback. Keep Mega battle-local and separate; concept-art approval is not a combat or save contract.

## 1. Identity and eligibility matrix

These are **existing legacy definitions**, independently evaluated by the probe below. `bond: 3` is a trust **stage**, Devoted, reached at a raw legacy bond value of **140**. It does not mean three bond points. The legacy function requires every named condition and uses `>=` level/stage comparisons. None of these six edges adds a place, weather, time, diet or companion condition. [Evolution data][evo-edges], [trust scale][trust], [eligibility implementation][eligibility].

| Original line: canonical ID (bare legacy alias) | First permanent transition | Final permanent transition | Chapter support at reviewed SHA |
| --- | --- | --- | --- |
| `wildbond:mosshog` (`mosshog`) → `wildbond:thicketboar` (`thicketboar`) → `wildbond:thornback` (`thornback`) | Mosshog → Thicketboar at level **16**, no trust condition | Thicketboar → Thornback at level **36 AND Devoted stage 3** | Only Mosshog is constructible/save-valid |
| `wildbond:ripplet` (`ripplet`) → `wildbond:riverwisp` (`riverwisp`) → `wildbond:tidewyrm` (`tidewyrm`) | Ripplet → Riverwisp at level **16**, no trust condition | Riverwisp → Tidewyrm at level **36 AND Devoted stage 3** | Only Ripplet is constructible/save-valid |
| `wildbond:cindercub` (`cindercub`) → `wildbond:smoulderpup` (`smoulderpup`) → `wildbond:blazefang` (`blazefang`) | Cindercub → Smoulderpup at level **16**, no trust condition | Smoulderpup → Blazefang at level **36 AND Devoted stage 3** | Only Cindercub is constructible/save-valid |

The merged legacy registry contains all nine namespaced definitions and reversible original aliases. Legacy startup overlays `evolution.json.species` before registration; the middle forms are not absent from that engine. It normalizes `at` to `level`, `bond` to `bond_stage`, and both evolution targets and original IDs to `wildbond:`. Legacy individuals deliberately keep their bare `sp` keys. The separate chapter deliberately saves canonical `species` and numeric `individual`; do not rewrite either format into the other. [Startup][startup], [registry][registry], [legacy key contract][legacy-key], [chapter catalogue][catalogue].

The chapter's inherited `ALIASES` maps `pokemon:37` to the old Cindercub **presentation/proxy** and likewise Pidgey/Glimmerwing and Wooper/Bogsnap. These are not identity aliases permitting a Pokémon save to become an original. `wildbond:cindercub` and `pokemon:37` must remain separate individuals/species. [Frozen proxy catalogue][v1-cat], [fallback rendering][fallback].

The selected normal concept designs and standalone Mega overrides are approved. Earlier candidate wording in the family README is superseded by its approval update and `families.json.approval_update`. Runtime readiness is explicitly false; the chapter still lists only six species, including the three original bases. Neither family art nor the isolated Mosshog cleanup expands chapter eligibility. [Family approval][families], [family metadata][family-json], [chapter list][catalogue].

### Existing base-stat inputs, not newly approved chapter balance

Order below is **HP / Attack / Defense / Special Attack / Special Defense / Speed**. The legacy mapping is `hp/pow/grd/wit/spi/spd`; the chapter's JSON uses `hp/attack/defense/special-attack/special-defense/speed`. Do not swap Speed and special stats when adapting the overlay.

| Family | Base | Middle | Final | Existing world element → current chapter adapter |
| --- | --- | --- | --- | --- |
| Mosshog | 60 / 58 / 58 / 42 / 50 / 38 | 74 / 71 / 71 / 51 / 60 / 45 | 88 / 85 / 85 / 60 / 70 / 52 | Grove → Grass |
| Ripplet | 50 / 48 / 55 / 60 / 55 / 45 | 62 / 59 / 67 / 72 / 66 / 53 | 75 / 70 / 80 / 85 / 78 / 62 | Tide → Water |
| Cindercub | 45 / 60 / 40 / 55 / 45 / 62 | 55 / 74 / 49 / 66 / 52 / 76 | 65 / 88 / 58 / 78 / 60 / 90 | Ember → Fire |

Source: [base/final legacy data][legacy-data] at JSON pointers `/SPECIES/{id}/base` (the file is one line), [middle overlay][evo-middle] at `/species/{id}/base`, and [current base adapter][original-data]. Existing definitions provide implementation inputs; importing the evolved balance/growth/catch/XP policy still needs a deliberate chapter decision. No secondary type, ability or Mega stat follows from colors, wings or proposed combat roles.

## 2. State-transition contract

| Boundary | Verified current behavior | Required implementation contract / decision |
| --- | --- | --- |
| Eligibility | Chapter `creature()` rejects all six evolved IDs. Chapter records have no bond/trust, care/battle growth or evolution evaluator. Legacy edges are 16 then 36 + stage 3. | Add only explicitly supported canonical targets. Do not silently remove trust or assign everyone 140. Evan must decide how chapter trust is earned, initialized for existing individuals and persisted, or explicitly change the rule. |
| Derived stats and XP | Chapter uses neutral nature, fixed IV 15, zero EVs: floor((2 × base + 15) × level / 100), plus level + 10 for HP or 5 for other stats. Current originals have medium-slow growth. Level and XP are validated together. | Recompute from the target species at the **same level**, preserve accumulated XP and individual. Keep growth compatible or specify a versioned conversion; do not reset to the level threshold or use the legacy rarity/temperament formulas. |
| HP and condition | Chapter level-up preserves missing HP, keeps 0 HP at 0 and retains burn. Legacy `Rules.evolve()` instead adds rounded 30% of new max HP, capped at max, including when HP was zero. | **Evan decision:** choose evolution HP behavior explicitly. Recommendation: reuse chapter damage-deficit behavior, retain fainting and burn, clamp safely; do not accidentally import legacy healing/revival. Neither behavior is approved by this report. |
| Moves and PP | `encode()` saves species, individual, level, XP, HP, PP and status, **not a move list**. `decode()` reconstructs current species/level lessons. Profile validation requires exact PP-key count and valid values for every reconstructed move. Level-up preserves shared PP and gives new supported moves their defined PP. | Define the target's supported learnset, carry shared PP without refill, and decide genuinely new moves/PP explicitly. Preserve selected moves only with an intentional codec contract; otherwise use a deterministic supported subset compatible with reload. Never add every legacy lesson blindly or silently replace/delete a learned/depleted move. The current four-move limit is a comment/assumption, not an enforced cap. |
| Existing move subset | Mosshog: `wildbond:charge` (35 PP), `wildbond:vineLash` (25). Ripplet: `wildbond:tailWhip` (35), `wildbond:bubbleJet` (25). Cindercub: `wildbond:bite` (35), `wildbond:emberSnap` (25), plus `wildbond:flameRush` (15) from level 11. The first two are available from levels 1 and 5 respectively. | These exact qualified move IDs are already playable. Original Tail Whip is a damaging physical move, unlike Pokémon `tail-whip`. Utility, AOE, guard-break and Scorched moves excluded by the current adapter must not become inert promises. Evolved lessons/forgetting are an owner scope decision. |
| Individual and starter provenance | Profile ensures unique numeric individuals across team + box, each below `next_id`. `original_starter` refers to an individual, but additionally requires its species to be in the **three base** `STARTERS`. | Keep the individual, `next_id`, team/box length, order and starter marker. Add a separate family-membership/provenance check; do not clear the marker, re-grant a starter, allocate a new ID, or offer evolved forms in starter selection. A naïve evolved record would fail validation even after `ALL_IDS` is expanded. |
| Party/storage | Party is live decoded records; box is encoded records. Store encodes, withdraw decodes; lead changes reorder existing records. Capacity is 6/60. | Replace exactly the intended individual in its current container. Do not duplicate into both, move unrelated partners or consume capacity. **Evan decision:** offer evolution only to the party, matching legacy, or also from storage; either way eligible stored partners must survive reload and later withdrawal. |
| Battle commit | Battle works on copied team data; HP/PP/status and XP become world state on Return. `rounds.gd` resets transient stages; encode omits them. Opening Isolde XP is applied before the shared return, which then awards the final opponent's XP and saves. | Evaluate after the complete authorized battle/XP commit, once per individual/edge, not mid-action or separately for each Isolde XP increment. A modal may present a pending transition, but it must not leak a partially replaced party into autosave. Revalidate eligibility/identity at confirmation. |
| Cancel/defer | Legacy “Not yet” stores current level and bond stage; it asks again after **either** increases. Older level-only holds wait for a level. Chapter has no equivalent fields, prompt or serializer support. | Closing/back/cancel must leave species/resources unchanged. **Evan decision:** adopt the legacy reoffer rule, an explicit manual retry, or another documented policy. If deferral persists, version and encode it deliberately; dictionary fields silently dropped by `encode()` will not survive battle/store/reload. |
| Repeated eligibility | Legacy checks only party while free, with no battle/dialogue/shop/card/cinematic active. Current chapter has no evolution prompt. | Guard a pending/committed transition by individual + source + target; double confirm and repeated callbacks must not heal/reward twice, evolve the wrong slot after reorder, or skip the middle. Define whether a level-36 base may receive two separately confirmed edges in succession. Level-100/max-trust deferral needs a retry policy, since no next level/stage exists. |
| Reload and failed save | Current normal save uses temporary file then backup/rename. Save failure is reported; a profile hold prevents writing. | Stage/validate a candidate before mutation. Do not claim permanent success until the whole transition saves successfully. Retain a recoverable previous record on failure and prevent duplicate effects on retry. Close before confirm must load old species; reopen after success must load the exact new species/resources/individual once. |

Sources: [catalogue construction/codec/XP][catalogue], [profile invariants][profile], [original moves/policy][original-data], [legacy evolution/healing][eligibility], [legacy deferral][defer], [party/storage][party], [world return][return], [opening return][opening-return], [rounds][rounds], [safe writer][safe].

## 3. Migration and write-hold matrix

The chapter remains `wildbond-pokemon-chapter` in `user://wildbond_pokemon_chapter_v1.json`, currently outer **schema 3** with optional opening version 1/2. It is separate from legacy adventure `journey.json`. The filename is not the schema version.

| Input/boundary | Current contract to preserve | Evolution acceptance requirement |
| --- | --- | --- |
| Frozen schema 1 | `legacy_profile.gd` validates only three Pokémon IDs using `legacy_catalogue.gd` + `legacy-data.json`. Migration uses implicit level 12, preserves individual/order, converts HP proportionally without reviving, and uses the minimum remaining PP fraction. Validated source is independently retained as `.pre-v2`; it is not the rotating recovery backup. | Do not edit or rederive frozen proxy inputs from expanded evolution data. Run real v1 → new schema migration with living/fainted, depleted PP and storage records. Preserve source and current milestones/resources. |
| Frozen schema 2 | `profile_v2.gd` uses its own `schema-two-data.json`, accepts only three Pokémon IDs and validates level/XP/HP/PP against that frozen numerical subset. Current migration copies full state then changes version/adds `original_starter=0`, retaining independently validated `.pre-v3`. | Do not expand old validators to accept originals/evolutions. Existing v2 records must survive even if the new current catalogue changes. Reopen twice and prove backup bytes do not rotate. |
| Existing schema 3 | Mixed originals/Pokémon, marker, opening data, resources, positions and outcomes must survive. There is not yet an independently frozen v3 acceptance boundary. | Obtain Evan's approval for an explicit successor schema/compatibility plan before emitting newly incompatible species or fields. Freeze the actual v3 acceptance inputs for migration rather than making old-save validation depend on newly tuned data. No schema number or backup suffix is enacted by this review. The older nested-opening reader `tests/opening/profile_before_town.gd:5` and current `.pre-opening-v2` validation also depend on the live Catalogue, so neither provides an independently frozen v3 creature-data boundary. |
| Future records | `open_profile()` scans primary, `.tmp`, `.bak` **before recovery**: recognized outer version 4+ or opening version 3+ holds all writes. An unreadable/oversized candidate also holds. Invalid unrecoverable records hold instead of starting a writable replacement. | Preserve future guards across all three locations, even with a valid older backup present. Do not downgrade, clear, reinterpret or overwrite them. “Play Unsaved” cannot later autosave over a held profile. |
| Backup failure | Bad/unreadable/oversized `.pre-v2` or `.pre-v3` stops the applicable migration; failure to create the source backup or complete migration stops writing. Opening v1 → v2 preserves `.pre-opening-v2` and rejects a bad one. | Test each failure and verify primary/independent-backup bytes remain intact. Evolution must respect `hold` and surface a failed save, not silently proceed as persisted. |
| Interrupted writes | `Safe.read()` tries primary, temporary, backup and accepts the first record passing the caller validator. `Safe.write()` writes temporary JSON before rotating primary to `.bak`. | Test interruption before confirmation, after candidate creation and around save. Future-format detection must precede fallback. Future-schema scanning happens on profile open, not before every subsequent save; it does not protect concurrent writers. No concurrent old/new chapter writer is safe or authorized. |

**Reproduced compatibility hazard, not a current live-evolution bug:** the appendix gives the current reader a synthetic schema-three primary whose starter `species` is `wildbond:thicketboar`, plus a valid pre-evolution schema-three `.bak`. It loads the old Mosshog backup with `hold=false`. Giving the same synthetic primary outer version 4 instead triggers the existing future hold and leaves its bytes untouched. This demonstrates why adding evolved species while retaining an incompatible old-reader contract risks rollback; it does not prove a complete new migration or authorize a version bump. [Current loader][loader], [safe fallback][safe].

Frozen input SHA-256 values checked in this review:

- `legacy-data.json`: `6f68fe13ee8b50609332f88b3e872c93b038671e8790eed88bb6d79f17f15861`
- `schema-two-data.json`: `238f1de6d407f972a5904dc9907715f445d67a26570abc62e769812d77122960`
- `legacy_catalogue.gd`: `771d20211a09b1baa77cde502ab7e44e67bb82c3a7584469c7d17d51ff0f89a8`
- `legacy_profile.gd`: `061d21efc8ea2ee101b55bd5c376ca1ab48c0596866dee836fc37b2067584d7b`
- `profile_v2.gd`: `19f066907a2333afafd2c1d14d8766fac07e3e03a1fe751177e8839791e37216`

Sources: [frozen v1 validator][v1-profile], [frozen v1 catalogue][v1-cat], [frozen v2 validator][v2], [migration/hold implementation][loader], [chapter conversion][catalogue].

## 4. Ordinary evolution versus Mega

Ordinary evolution replaces the saved canonical **species** of the same individual permanently. Each line ends at Thornback, Tidewyrm or Blazefang; the legacy registry has no outgoing Mega edge from those finals. A Mega is a distinct **temporary form referencing that final species**, never a fourth permanent stage, caught creature or stored species. The `wildbond:mega-*` strings in family metadata are proposed concept IDs, not implemented registry/save identities. [Family metadata][family-json], [Stand with it][mega].

Approved direction guarantees coverage for fully evolved original starter lines and clearer activation. The plan's once-per-battle/one-partner activation, end/faint reversion, switching behavior and max-HP-unchanged overlay are **recommended defaults, not separately approved tuning**. Preserve HP/PP/status and individual, keep temporary stages/form state out of party/storage, and clear it on battle end/quit/reload. No old hidden low-HP/last-survivor/real-day condition belongs in ordinary evolution. Exact Mega type/stat/ability values and form IDs remain separate decisions.

## 5. Decisions to route to Evan

These are bounded implementation decisions, not new tuning chosen by this review:

1. Will the chapter retain level 16 then level 36 + Devoted? If so, what trustworthy chapter bond source, earning model and existing-save initialization makes the second gate reachable? Do not infer bond from a badge, starter ownership or the dialogue “Your bond is real.”
2. Approve the save-compatibility/versioning plan for evolved IDs and any trust/defer fields, including an independent v3 input boundary and old-reader protection.
3. Choose permanent evolution HP behavior and evolved learnsets/new-move PP/forgetting policy. Reusing legacy numbers is a candidate, not permission to import unsupported effects, new secondary types or balance changes.
4. Choose prompt/retry semantics: party-only or stored partners too; whether defer survives restart; how max-level/max-trust players retry; and whether overleveled bases get a second separately confirmed prompt immediately.

## 6. Implementation acceptance checklist

These are **future integration tests**, not passes claimed here:

- For all three lines: level 15/16; middle 35 with Devoted; 36 with raw bond 139/140 under the legacy model; later level with insufficient trust; no outgoing permanent Mega edge. If Evan changes the model, test the newly approved boundaries instead.
- All nine canonical IDs resolve with original aliases; Pokémon/proxy aliases never convert ownership. Construct/encode/decode each supported stage, and preserve the same numeric individual and original-starter marker.
- Evolve healthy, injured, fainted, burned and zero-PP records using the approved HP policy; shared PP never refills, unsupported moves never appear, target types/stats/XP are stable after reopen.
- Party lead/non-lead and stored individuals; full 6/60 capacity; reorder before confirmation; store/withdraw/reload; no new individual, duplicate, repeat adoption or lost marker.
- Decline, Escape/back, reopening the menu, no-change autosave/reload, exact reoffer trigger, level 100, repeated confirmation and stale callbacks. Accept each edge once without accidentally jumping stages.
- Win/lose/escape/catch, Isolde's accumulated XP, closing mid-battle, Return twice and a save failure. Commit XP/rewards and evolution in the specified order without duplicate grants.
- Frozen v1 and v2, ordinary v3, evolved successor, corrupt/unreadable/oversized input, all migration-backup failures and future outer/nested versions in primary/tmp/bak. Verify byte retention and no fallback rollback of new-format saves.
- After implementation, run the repository aggregate and relevant chapter starter/journey/opening/summary suites on the final head, plus actual UI/animation inspection. Current report-only evidence does not establish these results.

## 7. What actually ran

In an isolated sparse clone of the pinned source, Godot **4.6.3.stable.official.7d41c59c4** ran the unchanged `tests/journey/rules_checks.gd`: **45 passed, 0 failed, exit 0**. It covers the current battle/XP rules and actual frozen v1 migration/recovery cases, including future `.tmp` write hold and corrupt migration backup. It is not evolution coverage. The project's handoff uses 4.7.2; no 4.7.2 result is claimed.

A standalone scratch probe (complete source below, outside tracked inputs) ran against the same unchanged source: **48 passed, 0 failed, exit 0**. It verified merged-registry aliases, all six legacy threshold edges, lack of final-to-Mega edges, current chapter target rejection, exhausted original level-up/codec behavior and the synthetic old-reader rollback/future-hold contrast. It made only disposable process-specific test saves under an isolated XDG user-data root and removed those saves.

Commands from repository root (save the appendix as `/tmp/dot-wb-evo-contract-probe.gd`):

```sh
mkdir -p /tmp/dot-wb-evo-userdata /tmp/dot-wb-evo-cache
XDG_DATA_HOME=/tmp/dot-wb-evo-userdata XDG_CACHE_HOME=/tmp/dot-wb-evo-cache \
  godot --headless --path wildbond-godot --script res://tests/journey/rules_checks.gd
XDG_DATA_HOME=/tmp/dot-wb-evo-userdata XDG_CACHE_HOME=/tmp/dot-wb-evo-cache \
  godot --headless --path wildbond-godot --script /tmp/dot-wb-evo-contract-probe.gd
```

Actual output:

```text
Godot Engine v4.6.3.stable.official.7d41c59c4
Pokemon rules checks: 45 passed, 0 failed
Evolution contract probe: 48 passed, 0 failed
Probe confirms current boundaries and synthetic old-reader risk; it does not implement evolution.
```

Also checked: all report source anchors exist at the pinned commit; legacy stat/edge matrix matches the actual JSON; whitespace is clean; only this report differs from the pinned base. No production runtime/data/fixture was edited. The full repository aggregate, scene/renderer suites, human playthrough and actual evolution/Mega integration were **not run**. No private art, real profile, export or publication was accessed. Remote CI status belongs to the PR's exact final head and is reported there separately.

## Appendix: reproducible boundary probe

The synthetic evolved record below is intentionally invalid to the old reader and is not offered as an implementation or migration fixture. The assertions test the current reader's behavior.

```gdscript
extends SceneTree
const C = preload("res://tests/journey/catalogue.gd")
const P = preload("res://tests/journey/profile.gd")
const R = preload("res://scripts/rules.gd")
var passed := 0
var failed := 0
func check(ok: bool, label: String) -> void:
	if ok: passed += 1
	else: failed += 1; printerr("FAIL: " + label)
func raw(path: String, d: Dictionary) -> void:
	var f := FileAccess.open(path, FileAccess.WRITE)
	f.store_string(JSON.stringify(d)); f.close()
func _initialize() -> void:
	var data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/wildbond.json"))
	var overlay: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/evolution.json"))
	data.SPECIES.merge(overlay.species, true); data.EVOS = overlay.evos
	R.DATA = data; R.prepare_move_choices()
	check(R.prepare_species_registry().is_empty(), "merged registry validates")
	for line in [["mosshog","thicketboar","thornback"],["ripplet","riverwisp","tidewyrm"],["cindercub","smoulderpup","blazefang"]]:
		for id in line:
			check(R.REGISTRY.resolve(id) == "wildbond:"+id, "bare canonical alias " + id)
			check(R.REGISTRY.legacy_id("wildbond:"+id) == id, "original reverse alias " + id)
		var c := {"sp":line[0],"lvl":15,"bond":0.0}
		check(R.evo_target(c) == "", "below first level " + line[0])
		c.lvl = 16
		check(R.evo_target(c) == line[1], "first level without trust gate " + line[0])
		c.sp = line[1]; c.lvl = 35; c.bond = 140.0
		check(R.evo_target(c) == "", "trust cannot replace level " + line[1])
		c.lvl = 36; c.bond = 139.0
		check(R.evo_target(c) == "", "level cannot replace trust " + line[1])
		c.bond = 140.0
		check(R.evo_target(c) == line[2], "both final gates " + line[1])
		c.sp = line[2]
		check(R.evo_target(c) == "", "final has no permanent Mega edge " + line[2])
		check(C.creature("wildbond:"+line[1],16).is_empty() and C.creature("wildbond:"+line[2],36).is_empty(), "chapter does not yet support evolved identities")
		var live := C.creature("wildbond:"+line[0],15)
		live.individual = 41; live.hp = 0; live.status = "burn"
		for move in live.moves: live.pp[move] = 0
		C.gain_xp(live, C.threshold(live.id,16)-live.xp)
		check(live.level==16 and live.individual==41 and live.hp==0 and live.status=="burn" and live.pp.values().all(func(v):return v==0), "chapter level growth keeps exhausted original " + line[0])
		check(C.encode(C.decode(C.encode(live))) == C.encode(live), "chapter codec round trip " + line[0])
	var p := P.new(); p.start("wildbond:mosshog")
	var good: Dictionary = p.state.duplicate(true)
	var path := "user://dot_evo_contract_%d.json" % OS.get_process_id()
	P.Safe.remove(path)
	var next: Dictionary = good.duplicate(true)
	next.team[0].species = "wildbond:thicketboar"
	raw(path,next); raw(path+".bak",good)
	var reader := P.new()
	check(reader.open_profile(path) and not reader.hold and reader.state.team[0].species=="wildbond:mosshog", "current v3 reader falls back from synthetic unrecognized v3 evolved record")
	next.version = 4; raw(path,next)
	var hash_before := FileAccess.get_sha256(path)
	reader = P.new()
	check(not reader.open_profile(path) and reader.hold and not reader.save() and FileAccess.get_sha256(path)==hash_before, "version four preflight prevents fallback and preserves primary")
	P.Safe.remove(path)
	print("Evolution contract probe: %d passed, %d failed" % [passed,failed])
	print("Probe confirms current boundaries and synthetic old-reader risk; it does not implement evolution.")
	quit(1 if failed else 0)
```

## Pinned source anchors

[evo-edges]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/data/evolution.json#L4280-L4325
[evo-middle]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/data/evolution.json#L3-L162
[trust]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/rules.gd#L28-L28
[eligibility]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/rules.gd#L270-L328
[startup]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/main.gd#L212-L227
[registry]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/species_registry.gd#L18-L90
[legacy-key]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/rules.gd#L40-L49
[catalogue]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/catalogue.gd#L5-L76
[profile]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/profile.gd#L16-L74
[loader]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/profile.gd#L76-L146
[v1-cat]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/legacy_catalogue.gd#L1-L19
[v1-profile]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/legacy_profile.gd#L1-L38
[v2]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/profile_v2.gd#L1-L65
[fallback]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/battle.gd#L73-L77
[families]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/docs/art/starter-families/README.md#L5-L55
[family-json]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/docs/art/starter-families/families.json#L17-L172
[legacy-data]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/data/wildbond.json#L1
[original-data]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/original-data.json#L1-L168
[defer]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/main.gd#L4620-L4658
[party]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/scene.gd#L162-L210
[return]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/scene.gd#L253-L314
[opening-return]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/opening/scene.gd#L350-L378
[rounds]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/rounds.gd#L7-L10
[safe]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/safe_save.gd#L7-L45
[mega]: https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/docs/plans/wildbond-world/stand-with-it.md#L5-L64
