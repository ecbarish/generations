# WB-GUEST-CUT-SAVE-AUDIT: retired forms and existing saves

dot for Adam, 2026-10-19. Report-only response to [the bounded routing](https://github.com/ecbarish/generations/issues/373#issuecomment-6258774707), [claim](https://github.com/ecbarish/generations/issues/373#issuecomment-6259085288), and [WILD-CUT-1 #542](https://github.com/ecbarish/generations/pull/542). Draft [#580](https://github.com/ecbarish/generations/pull/580) owns this file alone. No implementation or replacement is approved here.

## Answer and top three actions

**Keep #542's save-compatibility hold.** Its native saves are accepted with unresolved retired IDs; subsequent appearance/stat/battle consumers produce script errors. Browser saves containing either of its two supported retired species reach JavaScript errors. This is not evidence that every load terminates or that `_load_game()` returns false: Godot can log errors, return empty dictionaries, draw a generic fallback, and exit successfully.

1. **Choose the compatibility contract before removing playable definitions.** Evan must approve replacement identities and the handling of stats, HP, chosen moves and discovery records, or explicitly allow compatibility-only definitions for previously owned creatures. #542's proposed Hearthrunner → Smoulderpup cannot be copied to the browser: Smoulderpup is not in that catalogue. Coalheart is also native-only. No target is selected by this audit.
2. **Have the owning engine implement an explicit, backed-up migration across every ownership boundary.** Adding entries to the existing native retirement map does not migrate current v2 saves. A naive version bump also skips or breaks the existing chain. Team, ranch, eggs, dex and browser variant discovery all need coverage. Do not change the separate chapter schema for this cut.
3. **Require the concrete fixture matrix below before pack/release work.** Resolve the shared catalogue/Realmbound and pending planning consumers with their owners; keep trainer-strength changes separately unapproved. Then integrate/retest on the final owning branch, rather than treating this report's diagnostic passes as a fixed game.

## Source pins and actual verification

- Primary evidence: #576 `a9ef87fc38f7290f98e7ae61175216834a729bf5`, not main. [Feature source](https://github.com/ecbarish/generations/tree/a9ef87fc38f7290f98e7ae61175216834a729bf5).
- Read-only cut comparison: #542 `11433b1ecac68d97e8c4a04391f289821335391b`, branch `guest/wild-cut-1-ember-lines`. [Cut source](https://github.com/ecbarish/generations/tree/11433b1ecac68d97e8c4a04391f289821335391b). #542 is based on older main, not the chapter stack. No merge/cherry-pick was performed.
- Current main was observed as `b8493ff05e08073a7255968a83d015bd520d1c28`. Current #373, COMMS, AGENTS, AI-START, CONTRIBUTING, PROCESS, handoff, PR template and open ownership were checked. The explicit three-task exception overrides old backlog/ready-for-review language; this handoff stays draft.
- Actual tools: Node **24.19.0**, Godot **4.6.3.stable.official.7d41c59c4**, Python 3. The documented Godot 4.7.2 was not run.
- **Native migration / actual chapter loader probe: 117 passed, 0 failed.** Ten unchanged legacy migration/read helper bodies were extracted verbatim; their bodies are byte-identical in #576 and #542. Native data comparison uses both exact snapshots. Actual chapter codec/recovery scripts ran against disposable process-specific files only.
- **Browser VM probe: 38 passed, 0 failed.** Actual shared save engine and selected unchanged browser functions, with exact #542 `00-data.js`, in-memory localStorage and minimal DOM/league/tower stubs. Six expected missing-species `TypeError`s were asserted. This is not a full browser boot/playtest.
- **Independent native consumer probe: 34 assertions, 0 failed, 16 expected `SCRIPT ERROR:` lines, exit 0.** Unchanged pinned rules/registry/figures with all four definition removals modeled only in scratch memory. This specifically demonstrates error continuation; it is not a clean scene run or exact whole #542 execution.
- **Unchanged chapter rules suite: 45 passed, 0 failed**, rerun in the isolated project. Initial sparse-project attempts lacked battle-slice dependencies and did not run the suite; those unchanged dependencies were then materialized and the final command passed. An early probe comparison also needed JSON number normalization; the final 117 assertions compare parsed records correctly.
- Full repository aggregate, actual native scene load/UI/battle, graphical browser startup, real save files, export pack and human play were **not run**. No source/data/schema/asset/frozen fixture/tracked test or CI was changed. Final PR CI is recorded separately on #580 for its exact report head.

## What is present in each engine

| Retired ID | Native legacy before cut | Native after #542 | Browser before cut | Separate current chapter |
|---|---|---|---|---|
| `ashskip` / Ashskip | Base catalogue, catchable; evolution source | Absent | Present, catchable | Never admitted |
| `ashstride` / Ashstride | Godot evolution overlay and wild extra | Absent | **Absent already** | Never admitted |
| `hearthrunner` / Hearthrunner | Base catalogue, catchable; evolution source | Absent | Present, catchable | Never admitted |
| `emberrunner` / Emberrunner | Godot evolution overlay and wild extra | Absent | **Absent already** | Never admitted |

The native loader overlays `evolution.json` onto `wildbond.json` before preparing rules/registry: [main.gd L212–225](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/main.gd#L212-L225). Browser `00-data.js` does not load that overlay. Therefore browser fixtures for Ashstride/Emberrunner are malformed/unsupported imports, not regressions for valid browser saves. None of these four belonged to the six-species chapter catalogue.

## Legacy native adventure: `user://journey.json`, version 2

All four IDs behave identically at these boundaries after their definitions are removed:

| Boundary | Actual path and consequence |
|---|---|
| Read/admission | `_peek_save()` accepts numeric version ≥1 plus a nonempty team. `migrate_save()` checks version progression and team shape, not species membership. `_fix_creature()` normalizes numbers only. A retired ID is admitted unchanged, including in a v1 record. |
| Primary/spare/backup | `SafeSave.read` chooses the first accepted primary, `.tmp`, `.bak`. The unknown species does not reject the primary, so it does **not** automatically recover a healthier backup. No species-specific write hold is set. |
| Ranch/storage, including stall residents | `_load_game()` installs `ranch`, then `_place_ranch()` visits every record. `geared_look()` calls `R.sp(c)`, which indexes the absent species. The probe saw a script error and generic Shade/wolf fallback, not a clean rejection. Moving/storing a creature does not repair its ID. |
| Team lead | `_lead_look()` uses the same lookup when a partner exists. Even without that follower, lead HUD stats consume `R.stats(team[0])`. A non-leading member may remain latent until team book/battle/swap rather than failing at the first lead lookup. |
| Battle/healing/moves | Battle unit setup calls `R.stats`; `sp(c).base` cannot resolve. Move selection also reads the absent learnset. An empty return after a logged error is not usable stats or a playable battle. Inn healing likewise uses stats. |
| Egg | Load merely normalizes `egg.child`. At hatch, `_egg_step()` clears the egg, appends its child to ranch and marks seen/bonded **before** appearance and direct species-name lookups. Egg-only ownership may thus stay latent until hatch and mutate memory before the error. |
| Dex-only | `seen` and `bonded` load unchanged. The book enumerates current species, so the retired visible entry disappears, while raw dictionary sizes can still count it. Dex-only history is not the same failure as an owned creature's missing stats. |

Exact anchors: [save admission/migration/fix L3700–3823](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/main.gd#L3700-L3823), [load L3825–3899](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/main.gd#L3825-L3899), [ranch placement L4171–4191](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/main.gd#L4171-L4191), [look/card L4371–4415](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/main.gd#L4371-L4415), [egg L4284–4296](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/main.gd#L4284-L4296), [transfer L4661–4674](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/main.gd#L4661-L4674), [rules identity L42–71 and stats/moves L161–228](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/rules.gd#L42-L228), [battle unit L137–146](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/battle.gd#L137-L146), [book IDs L48](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/book.gd#L48), [counts L144](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/book.gd#L144), [team L213–223](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/book.gd#L213-L223), [SafeSave L29–36](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/safe_save.gd#L29-L36).

The newer registry does not supply a save migration: [species_registry.gd L2–4/L18–31](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/scripts/species_registry.gd#L2-L31) explicitly handles definitions only. After deletion neither bare nor `wildbond:` aliases resolve; `species_key` falls through unchanged. A successful registry build therefore does not establish compatibility with historical ownership.

## Browser adventure: localStorage `wildbond-save-v1`

For legitimate Ashskip/Hearthrunner records, `load()` shallow-merges the save without remapping. The registered import validator only checks that team/ranch are arrays; normal shared `load()` parses without invoking that validator. Startup then renders the selected tab. A retired team member on Team or retired ranch member on Ranch reaches `cardHTML → stOf → sp(c).base`. Battle `unit()` and egg `hatch()` also reach `stOf`. All six team/ranch/egg consumer probes produced `TypeError: Cannot read properties of undefined (reading 'base')`.

Failure timing depends on tab and ownership: an egg or non-displayed ranch resident need not throw during `load()` itself. Offline ranch care can later read `sp(c).fam`, and hatch needs stats. The report does not assert that the full startup always fails at the same statement. Save code itself does not validate species and can persist unresolved IDs. Raw seen/caught keys remain; dex rendering enumerates `SPECIES`. Source inspection also establishes cosmetic `variantDex[species]` as an additional discovery boundary; individual `variant` must survive any migration. The 38 browser assertions do not exercise cosmetic wrappers or a variant migration.

The shared engine already supports `Arcade.versions`, `Arcade.migrates`, failure holds and backups, but **Wildbond registers neither version nor migrator**. The VM confirmed `v:999` is returned without a hold for this key. A future implementation must register a supported version and migration before `load()`, preserve a pre-migration copy, validate the complete result and hold writes on an unsupported/failed conversion. Merely renaming the key would abandon existing saves. Older browser releases without registration cannot be assumed to respect a future-schema hold.

Anchors: [02-state.js L3–4/L19–27/L57–67](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/games/wildbond/js/02-state.js), [boot L72–87](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/games/wildbond/js/99-boot.js#L72-L87), [UI L20–76/L111–124](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/games/wildbond/js/05-ui.js#L111-L124), [battle L8–22](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/games/wildbond/js/03-battle.js#L8-L22), [ranch L38–58/L117–122](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/games/wildbond/js/07-ranch.js#L117-L122), [variant discovery L28–44](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/games/wildbond/js/19-variants.js#L28-L44), [shared engine L98–149](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/shared/engine.js#L98-L149).

## Separate chapter: no legitimate retired ownership to migrate

The chapter uses `user://wildbond_pokemon_chapter_v1.json`, **format `wildbond-pokemon-chapter`, schema 3**, with `species`/`individual` records in `team` and `box`. Native adventure uses `journey.json`, `v:2`, and `sp` records in `team`/`ranch`; browser has another key and format. The filename's `v1` is not the current chapter schema.

`Catalogue.ALL_IDS` contains only `pokemon:16`, `pokemon:37`, `pokemon:194`, `wildbond:mosshog`, `wildbond:ripplet`, `wildbond:cindercub`, from separate core/original data. Frozen chapter v1/v2 migration inputs likewise do not grant the four retired original forms. There is no `journey.json` import. Registry/catalogue expansion is not implicit.

Actual synthetic chapter results, each retired name in team and box: validation rejects; with no recoverable sibling, opening fails, `hold` is true, save refuses and bytes remain identical. **With a valid same-schema `.bak`, it recovers that older checkpoint instead and a subsequent explicit save can replace the invalid primary.** Thus rejection is not a universal permanent hold. Future schema 4 in a sibling correctly holds the whole load/write path. All six supported species still validate, and the existing 45 rules/migration checks pass. These malformed injected records are future-expansion guardrail evidence, not a regression caused by #542 in today's chapter.

Anchors: [profile path/fresh/validation L6–54](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/profile.gd#L6-L54), [recovery/migration L76–148](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/profile.gd#L76-L148), [catalogue L5–22](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/wildbond-godot/tests/journey/catalogue.gd#L5-L22). Do not edit chapter schemas or frozen fixtures to solve this legacy-only cut.

## Smallest compatible migration proposal, pending owner approval

The smallest **full-removal** implementation is an explicit species-identity conversion in each affected adventure save adapter, before any consumer sees the record. It is not a roster rewrite or chapter import. Before conversion, retain a validated, independently named pre-cut backup rather than relying solely on the rotating `.bak`; stage a deep copy, check every destination and derived invariant, then write atomically. If any required mapping is unavailable or invalid, hold writes and keep the original bytes rather than dropping an individual or silently selecting a starter.

| #542 proposal only | Native target after cut | Browser target after cut | Decision still needed |
|---|---|---|---|
| Ashskip → Emberling | Present | Present | Identity substitution and derived stats/moves |
| Ashstride → Coalheart | Present | **Absent** | Native policy; unsupported browser imports must hold rather than guess |
| Hearthrunner → Smoulderpup | Present | **Absent** | A separate approved browser-compatible policy is essential |
| Emberrunner → Blazefang | Present | Present | Native policy; browser source was unsupported already |

Full-catalogue VM assertions verified target presence/absence against exact #542 data, rather than inferring absence from a short excerpt or from concept art. The base browser [Cindercub/Blazefang definitions](https://github.com/ecbarish/generations/blob/11433b1ecac68d97e8c4a04391f289821335391b/games/wildbond/js/00-data.js#L61-L65) and [native evolution overlay](https://github.com/ecbarish/generations/blob/11433b1ecac68d97e8c4a04391f289821335391b/wildbond-godot/data/evolution.json) differ. Adding compatibility-only definitions for existing owners could avoid irreversible substitutions, but that alternative changes the full-removal contract and also needs Evan's decision; it is not permission to reintroduce encounters.

Native version mechanics: current `SAVE_V=2`; only v1 invokes `_migrate_v1`, whose `next.v=SAVE_V` jumps straight to current. Adding four map entries alone misses all v2 saves. Raising the constant alone makes v2 fail because no step exists. A later approved v2→v3 step also requires v1→v2 to set **literal 2** (or equivalently ensure both transformations run), so v1 cannot skip it. Schema number 3 here would be the native adventure's version, unrelated to chapter schema 3. **No version bump is authorized by this proposal.**

Preserve identity/ownership/count/order and all existing individual data: browser `uid`, names, level/XP, potential/rarity/temperament/traits, bond, raising/training/care/gear, held-evolution decisions, generation/parent names and cosmetic variants. Native `partner` is the follower's starter mover key, not another arbitrary individual-species field; do not blindly replace it. Preserve story, badges, items, map/position, defeated trainers and resources. Nicknames remain; only blank/exact old default names may follow an approved identity change. Existing parent/from names and log text are history, not species pointers.

But field preservation alone does not preserve gameplay: target bases recalculate stats, `moves_of` filters chosen moves against the target learnset, HP may exceed a new maximum, and future evolution/breeding changes. The owner must approve an HP policy (preserve-and-clamp or percentage, never revive a fainted creature accidentally), whether chosen moves are grandfathered or explicitly converted, and how discovered identities/variants merge. Native existing dex collision behavior keeps the destination's value rather than combining it; for boolean seen/bonded and nested browser variant discoveries, propose a non-destructive union and test it. Do not invent a PP migration: these legacy creatures have no chapter-style saved PP record.

## Ownership and adjacent compatibility boundaries

- **Native owner:** `scripts/main.gd`, rules/registry integration and full old-save tests. Team/ranch/stall/egg plus seen/bonded; source data and generated export are separate from this report.
- **Browser owner:** `02-state.js` save adapter and existing hooks; team/ranch/`eggs[].child`, seen/caught and `variantDex`. Shared engine edits need shared ownership; its hooks already exist. Randomizer stores a seed, not the permutation; removing species changes the regenerated pool/shuffle for the same seed ([15-challenge.js L16–26](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/games/wildbond/js/15-challenge.js#L16-L26)). That continuity tradeoff is separate from preserving owned creatures.
- **Shared catalogue / Realmbound owners:** #542 leaves `shared/catalogue.js` and `games/realmbound/js/31-creature-catalogue.js` unchanged. With the stale shared catalogue, existing Ashskip-linked sightings still resolve. If regenerated without coordinated consumer changes, `catalogueForMob` returns null and hides those sightings ([L24–34](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/games/realmbound/js/31-creature-catalogue.js#L24-L34)). Do not describe that future regenerated-catalogue loss as already happening in #542. This is a catalogue-display boundary, not evidence that Realmbound owns these Wildbond party saves.
- **Grok/planning owner:** pending #539's trainer proposal still names retired IDs; its separate branch is not silently updated. Trainer substitutions in #542, balance acceptance, hard-coded catalogue count, export freshness and the single pack rebuild remain with their respective owners/Reviewer. This report clears none of those holds.
- **Chapter owner:** preserve six supported identities and frozen migrations unchanged. Any later introduction/import of these species needs its own version/older-reader contract. No game publication or merge follows from diagnostic evidence.

## Concrete implementation fixtures and acceptance

The following are proposed tests for the owner, not new tracked test files or passing replacement behavior:

1. **Native cross-product:** v1 and v2 × each of four IDs × lead team, non-lead team, ranch, breeding-stall ranch, and `egg.child`. Include one at max/full HP, one injured, one fainted, custom/default/empty names, selected old move, hold/hold_bond, gear/train/raised and generation/parent history. Migration must retain counts/order and all unrelated fields; target lookup/stats/moves, book, heal, battle, swap, hatch and reload must be valid under the approved policy.
2. **Dex collisions:** only retired seen/bonded keys, both old and destination keys, false/true combinations; browser nested variant seen/bonded discoveries plus the same individual variant. No discovery lost or double-counted under the agreed rule.
3. **Versions and durability:** native v1→v2→approved next step and v2→next, repeated load/idempotence, malformed primary with good spare/backup, future primary/**each sibling**, truncated write, failed pre-cut backup and failed final rename. Do not silently roll back a newer save; do not mutate the raw input or any production profile. Verify version holds on actual older supported readers, not merely the new writer.
4. **Browser:** valid Ashskip/Hearthrunner in team/ranch/egg, hidden tab/offline-care path, nickname/uid/variant retention; supported target availability; unsupported Ashstride/Emberrunner import explicitly held or handled by an approved import rule. Register version/migration before load; verify future versions, backup/import/restore and no accidental reset of the old key. Validate changed randomizer continuity separately.
5. **Chapter negative/control:** every retired qualified ID in team/box must remain invalid today; no-backup hold must preserve bytes; same-schema backup fallback and later save are explicitly tested; future sibling holds; all six supported species and frozen v1/v2 upgrades stay valid. Do not add retired IDs to `ALL_IDS` to make a fixture pass.

**Stop condition reached:** the technical save question is answered. Integration, mapping/compatibility policy and release decisions remain open for the named owners. No further backlog task is claimed.

## Reproduction appendix

These are scratch probes, intentionally embedded in this one allowed report rather than added to the repository's tests/CI. The Godot migration adapter extracts only the listed source helpers; it does not instantiate `main.gd` or assert a successful full native load. Browser controls mock only the documented surroundings; it does not execute `99-boot.js` or cosmetic wrapper installation. The independent consumer probe models definition deletion in memory and explicitly expects errors.

Inside a disposable clone of `ecbarish/generations`, obtain both pinned refs and materialize source without assets:

```sh
git fetch origin codex/wildbond-mosshog-native-cleanup guest/wild-cut-1-ember-lines
PIN=a9ef87fc38f7290f98e7ae61175216834a729bf5
CUT=11433b1ecac68d97e8c4a04391f289821335391b
# These exact scratch destinations must be new/empty; never reuse a player profile.
mkdir /tmp/dot-wb-cut-save-audit-20261019 /tmp/dot-wb-cut-source
git archive "$PIN" wildbond-godot/scripts wildbond-godot/tests/journey wildbond-godot/tests/battle_slice/rounds.gd wildbond-godot/tests/battle_slice/muse_math.gd wildbond-godot/data games/wildbond/js shared/creatures.js | tar -x -C /tmp/dot-wb-cut-save-audit-20261019
git archive "$CUT" wildbond-godot/scripts/main.gd wildbond-godot/scripts/rules.gd wildbond-godot/data games/wildbond/js/00-data.js games/wildbond/js/11-maps.js | tar -x -C /tmp/dot-wb-cut-source
git show "$PIN":shared/engine.js > /tmp/dot-wb-cut-engine.js
```

Save the following three blocks to their indicated `/tmp` filenames, then run:

```sh
python3 /tmp/dot-wb-cut-prepare.py
mkdir -p /tmp/dot-wb-cut-test-data /tmp/dot-wb-cut-test-cache
export XDG_DATA_HOME=/tmp/dot-wb-cut-test-data XDG_CACHE_HOME=/tmp/dot-wb-cut-test-cache
godot --headless --path /tmp/dot-wb-cut-probe-project --script /tmp/dot-wb-cut-probe.gd
godot --headless --path /tmp/dot-wb-cut-probe-project --script res://tests/journey/rules_checks.gd
node /tmp/dot-wb-cut-browser-probe.cjs
```

Expected final summaries: `117 passed, 0 failed`; `45 passed, 0 failed`; `38 passed, 0 failed` with six intentionally asserted browser exceptions. These results establish the audit, not fixed save compatibility.

### `/tmp/dot-wb-cut-prepare.py`

```python
from pathlib import Path
import re, shutil, hashlib
root=Path('/tmp/dot-wb-cut-save-audit-20261019');cut=Path('/tmp/dot-wb-cut-source');out=Path('/tmp/dot-wb-cut-probe-project');out.mkdir(exist_ok=True)
for folder in ['scripts','tests/journey','tests/battle_slice']:
 shutil.copytree(root/'wildbond-godot'/folder,out/folder,dirs_exist_ok=True)
(out/'project.godot').write_text('[application]\nconfig/name="dot-cut-disposable-probe"\n[rendering]\nrenderer/rendering_method="gl_compatibility"\n')
names=['_save_version','_peek_save','_newer_save','migrate_save','_migrate_v1','_remap_list','_remap_retired','_read_save','_fix_creature','_migrate_dex']
def extract(source,name):
 lines=source.splitlines(keepends=True);start=next(i for i,x in enumerate(lines) if x.startswith('func '+name+'('));end=start+1
 while end<len(lines) and (lines[end].startswith(('\t',' ')) or lines[end].strip()==''):end+=1
 return ''.join(lines[start:end])
pin=(root/'wildbond-godot/scripts/main.gd').read_text();old=(cut/'wildbond-godot/scripts/main.gd').read_text()
parts=[]
for name in names:
 a,b=extract(pin,name),extract(old,name);assert a==b,name;parts.append(a)
print('10 migration/read helper bodies byte-identical between #576 and #542.')
constants='\n'.join(x for x in pin.splitlines() if x.startswith(('const SAVE_V','const RETIRED_FORMS','const RETIRED_NAMES')))
(out/'legacy_adapter.gd').write_text('extends RefCounted\nconst SafeSave := preload("res://scripts/safe_save.gd")\nvar DATA: Dictionary = {}\nvar save_path := "user://unused.json"\n'+constants+'\n\n'+'\n'.join(parts))
for label,path in [('pin',root),('cut',cut)]:
 (out/label).mkdir(exist_ok=True)
 for name in ['wildbond.json','evolution.json']:shutil.copyfile(path/'wildbond-godot/data'/name,out/label/name)
```

### `/tmp/dot-wb-cut-probe.gd`

```gdscript
extends SceneTree
const Adapter=preload("res://legacy_adapter.gd")
const Profile=preload("res://tests/journey/profile.gd")
const Cat=preload("res://tests/journey/catalogue.gd")
const Safe=preload("res://scripts/safe_save.gd")
var passed:=0
var failed:=0
func check(value:bool,label:String)->void:
	if value:passed+=1
	else:failed+=1;printerr("FAIL: "+label)
func data(label:String)->Dictionary:
	var d:Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://"+label+"/wildbond.json"))
	var e:Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://"+label+"/evolution.json"))
	d.SPECIES.merge(e.species,true);return d
func put(path:String,d:Dictionary)->void:
	var f=FileAccess.open(path,FileAccess.WRITE);f.store_string(JSON.stringify(d));f.close()
func _initialize()->void:
	var before=data("pin");var after=data("cut");var migration=Adapter.new();migration.DATA=after
	for sid in ["ashskip","ashstride","hearthrunner","emberrunner"]:
		check(before.SPECIES.has(sid) and not after.SPECIES.has(sid),sid+" removed from merged native catalogue")
		for version in [1,2]:
			var c={"sp":sid,"name":"Keep nickname","lvl":30,"xp":123,"rar":1,"hp":12,"pot":{"hp":9},"bond":160.0,"moves":["scratch"],"raised":{"meat":2.5},"gear":"harness","hold":true,"hold_bond":true,"parents":["A","B"],"gen":2,"stall":true}
			var raw={"v":version,"team":[c.duplicate(true)],"ranch":[c.duplicate(true)],"egg":{"child":c.duplicate(true),"steps":1},"seen":{sid:true},"bonded":{sid:true},"sentinel":"untouched"}
			var original=raw.duplicate(true);var result=migration.migrate_save(raw)
			check(not result.is_empty() and result.v==2,sid+" v"+str(version)+" admitted")
			check(result.team[0]==c and result.ranch[0]==c and result.egg.child==c,sid+" all ownership preserved but unresolved")
			check(result.seen.has(sid) and result.bonded.has(sid),sid+" retired dex unchanged")
			check(raw==original,sid+" input untouched")
			check(migration.migrate_save(result)==result,sid+" repeat idempotent but still broken")
			check(migration._fix_creature(result.team[0].duplicate(true)).sp==sid,sid+" fix does not validate identity")
			check(not after.SPECIES.has(result.team[0].sp),sid+" admitted lookup unresolved")
		for boundary in ["team","box"]:
			var p=Profile.new();p.start("pokemon:16")
			var d=p.state.duplicate(true);var c=d.team[0].duplicate(true);c.species="wildbond:"+sid
			if boundary=="team":d.team[0]=c
			else:c.individual=2;d.next_id=3;d.box=[c]
			check(not Profile.valid(d),sid+" invalid chapter "+boundary)
			var path="user://cut_"+str(OS.get_process_id())+"_"+sid+"_"+boundary+".json";put(path,d)
			var bytes=FileAccess.get_file_as_bytes(path);var q=Profile.new()
			check(not q.open_profile(path) and q.hold and not q.save(),sid+" invalid chapter held with no backup")
			check(FileAccess.get_file_as_bytes(path)==bytes,sid+" invalid chapter bytes preserved")
			put(path+".bak",p.state);var recovered=Profile.new()
			var opened=recovered.open_profile(path)
			check(opened and not recovered.hold and recovered.state==JSON.parse_string(JSON.stringify(p.state)),sid+" invalid same-schema primary falls back to valid backup")
			check(FileAccess.get_file_as_bytes(path)==bytes,sid+" fallback open alone does not rewrite")
			check(recovered.save() and Profile.valid(Safe._parse(path)),sid+" explicit save after recovery replaces invalid primary")
	var v1={"v":1,"team":[{"sp":"pyremane","name":"Pyremane"}],"ranch":[],"seen":{"pyremane":true,"blazefang":true},"bonded":{}}
	check(migration.migrate_save(v1).team[0].sp=="blazefang","existing EVO-1 mapping still works")
	check(migration.migrate_save({"v":3,"team":[{}]}).is_empty(),"legacy future version held")
	for sid in Cat.ALL_IDS:
		var p=Profile.new();check(p.start(sid) and Profile.valid(p.state),"supported chapter unchanged "+sid)
	var p=Profile.new();p.start("pokemon:16");var path="user://cut_"+str(OS.get_process_id())+"_future.json";put(path,p.state)
	var future=p.state.duplicate(true);future.version=4;put(path+".bak",future);var q=Profile.new()
	check(not q.open_profile(path) and q.hold and not q.save(),"future sibling blocks recovery/writes")
	print("NATIVE MIGRATION / CHAPTER AUDIT: %d passed, %d failed" %[passed,failed])
	quit(1 if failed else 0)
```

### `/tmp/dot-wb-cut-browser-probe.cjs`

```javascript
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='/tmp/dot-wb-cut-save-audit-20261019',cut='/tmp/dot-wb-cut-source';
let checks=0; const ok=(condition,label)=>{assert.ok(condition,label);checks++;};
function context(isCut){
 const box={console,document:{querySelector(){return{}},addEventListener(){},createElement(){return{}},head:{appendChild(){}}},Date,Math};
 box.window=box;box.localStorage={}; Object.defineProperties(box.localStorage,{getItem:{value(k){return this[k]??null}},setItem:{value(k,v){this[k]=String(v)}},removeItem:{value(k){delete this[k]}},key:{value(i){return Object.keys(this)[i]??null}},length:{get(){return Object.keys(this).length}}});
 box.leagueState=()=>{};box.towerState=()=>{};box.challengeLocked=()=>false;box.teamMax=()=>3;
 vm.createContext(box); vm.runInContext(fs.readFileSync('/tmp/dot-wb-cut-engine.js','utf8'),box,{filename:'shared/engine.js'});
 for(const file of ['shared/creatures.js','games/wildbond/js/00-data.js','games/wildbond/js/02-state.js','games/wildbond/js/03-battle.js','games/wildbond/js/05-ui.js','games/wildbond/js/07-ranch.js','games/wildbond/js/20-battle-choices.js'])vm.runInContext(fs.readFileSync((isCut&&file.endsWith('/00-data.js')?cut:root)+'/'+file,'utf8'),box,{filename:file});
 return box;
}
const run=(box,code)=>vm.runInContext(code,box);
const before=context(false),after=context(true);
for(const sid of ['ashskip','ashstride','hearthrunner','emberrunner']){
 const supported=['ashskip','hearthrunner'].includes(sid);
 ok(run(before,`!!SPECIES['${sid}']`)===supported,`${sid} prior browser availability`);
 ok(!run(after,`!!SPECIES['${sid}']`),`${sid} absent after cut`);
 if(!supported)continue;
 const creature=JSON.parse(run(before,`JSON.stringify(newCreature('${sid}',30,{name:'Keep nickname',temp:'steady',rar:1}))`));
 for(const boundary of ['team','ranch','egg']){
  const input=JSON.parse(run(before,'JSON.stringify(fresh())'));
  const control=JSON.parse(run(before,"JSON.stringify(newCreature('mosshog',5,{temp:'steady',rar:0}))"));
  input.started=true;input.team=boundary==='team'?[creature]:[control];input.ranch=boundary==='ranch'?[creature]:[];input.eggs=boundary==='egg'?[{child:creature,days:1,from:['One','Two']}]:[];
  input.seen[sid]=true;input.caught[sid]=true;after.localStorage.setItem('wildbond-save-v1',JSON.stringify(input));
  ok(run(after,"Arcade.validators[KEY](Arcade.load(KEY))"),`${sid} ${boundary}: structural validator accepts`);
  run(after,'load()');
  ok(run(after,`S.${boundary==='egg'?'eggs[0].child':boundary+'[0]'}.sp` )===sid,`${sid} ${boundary}: load leaves id unchanged`);
  const expression=boundary==='team'?'unit(S.team[0],"a")':boundary==='ranch'?'cardHTML(S.ranch[0],0,false)':'hatch(S.eggs[0])';
  let error;try{run(after,expression)}catch(e){error=e}
  ok(error?.name==='TypeError'&&/base/.test(error.message),`${sid} ${boundary}: missing species fails stats`);
  console.log(`${sid} ${boundary}: ${error.name}: ${error.message}`);
  run(after,'save()');
  const output=JSON.parse(after.localStorage.getItem('wildbond-save-v1'));
  ok(output.seen[sid]&&output.caught[sid],`${sid} ${boundary}: save still accepts retired dex keys`);
 }
}
for(const [sid,present] of [['emberling',true],['coalheart',false],['smoulderpup',false],['blazefang',true]])ok(run(after,`!!SPECIES['${sid}']`)===present,`${sid} proposal target availability`);
after.localStorage.setItem('wildbond-save-v1',JSON.stringify({v:999,team:[],ranch:[]}));
ok(run(after,'Arcade.load(KEY).v')===999,'unregistered browser version accepts future v');
ok(!run(after,'Arcade.held[KEY]'),'browser has no future-write hold without registration');
console.log(`BROWSER AUDIT: ${checks} passed, 0 failed; expected missing-species exceptions asserted; no real browser storage.`);
```

### Independent native consumer probe

Copy the pinned `scripts/{rules,species_registry,battle_effects,figures}.gd` and `data/{wildbond,evolution}.json` into a new scratch Godot project, with the same relative paths. Save this as `probe.gd`. Use a minimal project with application name `Retired Species Isolated Probe` and Compatibility renderer. Run:

```sh
XDG_DATA_HOME=/tmp/dot-cut-semantics-probe/userdata XDG_CACHE_HOME=/tmp/dot-cut-semantics-probe/cache godot --headless --path /tmp/dot-cut-semantics-probe --script res://probe.gd
```

Expected: `ASSERTIONS=34 FAILURES=0 EXPECTED_SCRIPT_ERRORS=16`, 16 actual script-error lines and exit 0. Exact probe SHA-256: `176791502073c3b9b1d600d86cefbb842c55620d08e2bbcb507b8789d718fb45`. All six copied files matched the pinned Git blob hashes and their source SHA-256s.

```gdscript
extends SceneTree
const R := preload("res://scripts/rules.gd")
const Figures := preload("res://scripts/figures.gd")
const CUT := ["ashskip","ashstride","hearthrunner","emberrunner"]
var checks := 0
var failures := 0
func check(ok: bool, label: String) -> void:
	checks += 1
	if not ok:
		failures += 1
		print("FAIL: ", label)
func _initialize():
	R.DATA = JSON.parse_string(FileAccess.get_file_as_string("res://data/wildbond.json"))
	var overlay: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://data/evolution.json"))
	for id in overlay.species: R.DATA.SPECIES[id] = overlay.species[id]
	R.DATA.EVOS = overlay.evos
	R.prepare_move_choices()
	check(R.prepare_species_registry().is_empty(), "baseline registry")
	var rng := RandomNumberGenerator.new()
	rng.seed = 123
	var creatures := {}
	for id in CUT:
		creatures[id] = R.make(id, 16, {}, rng)
		check(creatures[id].sp == id, "baseline individual " + id)
		R.DATA.SPECIES.erase(id)
		R.DATA.EVOS.erase(id)
	# Model definition removal with dangling evolution targets removed, all in scratch memory.
	# This is not the exact cut PR checkout and does not model encounter/lore changes.
	for id in R.DATA.EVOS:
		R.DATA.EVOS[id] = R.DATA.EVOS[id].filter(func(e): return R.DATA.SPECIES.has(e.to))
	for id in R.DATA.SPECIES:
		if R.DATA.SPECIES[id].has("evo") and not R.DATA.SPECIES.has(R.DATA.SPECIES[id].evo.to): R.DATA.SPECIES[id].erase("evo")
	check(R.prepare_species_registry().is_empty(), "cut registry")
	for id in CUT:
		var c: Dictionary = creatures[id]
		check(R.REGISTRY.resolve(id) == "", "bare registry missing " + id)
		check(R.REGISTRY.resolve("wildbond:" + id) == "", "qualified registry missing " + id)
		check(R.species_key(id) == id, "bare unchanged " + id)
		check(R.species_key("wildbond:" + id) == "wildbond:" + id, "qualified unchanged " + id)
		print("EXPECT_RUNTIME_ERRORS_BEGIN ",id)
		check(R.sp(c).is_empty(), "sp error returns empty " + id)
		var look: Dictionary = {}.get(c.sp, Figures.look_for(R.sp(c)))
		check(look.kind == "wolf" and look.body == Figures.RAMP.Shade[1], "look fallback after error " + id)
		check(R.stats(c).is_empty(), "stats error returns empty " + id)
		print("EXPECT_RUNTIME_ERRORS_END ",id)
	print("ASSERTIONS=",checks," FAILURES=",failures," EXPECTED_SCRIPT_ERRORS=16")
	quit(0 if failures == 0 else 1)
```
