# Wildbond: deliver the world we want
Evan requested this plan on 2026-10-19. Codex / root for Evan.
Tactical companion to [STUDIO-PLAN](../STUDIO-PLAN.md), not another competing studio roadmap.

## The destination
A creature adventure we want to get lost in: the discovery and companionship of early Pokemon, the spaciousness and atmosphere Evan likes in classic WoW, and our own places, creatures and woven story. Those references guide design; they do not authorize importing their assets.

The player lives in the world: people teach, places invite exploration, and progress unlocks useful comforts. Crisp creature art sits comfortably in textured terrain, soft path edges, coherent foliage, grounded lighting and readable shadows. Routes have bends, height, landmarks and optional discoveries. Space has a purpose; neither cramped corridors nor empty acreage are the goal. Browser and phone play remain real delivery targets.

The long-term destination includes a connected region, distinctive towns and cities, creature growth, return visits and eventually a safari-style area. Each follows a proven opening. Premade assets and systems are welcome when compatible, licensed, credited and visually consistent.

## What success means next
**One normal entry point launches our current chapter, and a fresh player can choose a partner, learn through play, explore Thornwood, defeat the first Warden and resume after quitting.** The target is a satisfying first sitting, not a promised minute count.

Maren supplies the introductory/research/tutorial function unless an approved canon decision changes it. Do not invent another professor just to fill a checklist. Teach movement, interaction, battles, bonding and the field book when needed. Reward sprint early without making the opening a long forced slow walk. Isolde should test something the player has learned. A hint of the next place makes continuing attractive.

Current prototypes already implement parts of this. Inspect and improve them; do not commission duplicate implementations.

## Deliver in this order
| Stage | Deliverable | Gate before expanding |
|---|---|---|
| 1. Integrate | One chosen current chapter build, with usable entry, a named source revision and a clear relationship to existing saves | It is actually playable outside an isolated audition; quit/Continue and old-save safety are verified |
| 2. First Warden | A complete opening arc with readable objectives, a worthwhile optional discovery, satisfying battles and the first Warden payoff | Evan can play without coaching, wants to continue, and a fresh desktop/phone run finds no major blocker |
| 3. A small living region | The next route and settlement, one meaningful return opportunity and a distinct local identity | Travel offers new choices and discoveries rather than repeating the opening |
| 4. Broader journey | Further regions, growth/evolution payoffs, story consequences and later safari-style exploration | Expand in playable chapters; each addition earns its cost and preserves prior saves/performance |

The studio's existing newcomer target (17/18, with full marks for objective, controls and phone) and launch fun floor (7/10) remain. A higher score is a goal, not a substitute for watching Evan actually play. No schedule is inferred from PR throughput.

## Current promotion work order (2026-10-20)
Verified chapter reference: `codex/wildbond-soft-ground` at `4c0b1277dbb417d928472f24f227ed347815ba0b`, tree `c3785ffc47894c3cfe885a072de2213b433e7a31`. Fence #602 and chapter-check command #593 are integrated. The combined tree passed40Windows fixtures,53/0native Forward+ chapter capture with six inspected images and all28repository suites. It remains an unsaved preview, not the default game.

Source-backed constraints at that revision:
- `tests/environment_sample/scene.gd:16–26` deliberately sets `no_save=true`, selects a process-specific path, starts Mosshog, clears dialogue and teleports to a review camera. `opening_space/scene.gd` and `soft_ground/scene.gd` inherit it. Changing the main scene to that audition would bypass partner choice and Continue.
- `project.godot` still launches `res://scenes/main.tscn`; the production adventure uses `user://journey.json`. The separate chapter uses `user://wildbond_pokemon_chapter_v1.json` via `tests/journey/profile.gd`. Those are distinct profiles; never copy one over the other.
- The chapter profile's nested opening checkpoint currently accepts versions1–2 with x at most26 and z at most17. Expanded Larkhaven includes walkable cells whose world coordinates exceed those bounds. The existing blocked-position fallback in `tests/opening/scene.gd` handles collision, not a geometry-version migration.
- Both Web and Windows presets exclude `tests/*`. Starter adapters, chapter UI/battle, map and presentation dependencies currently live there. An editor play or native test pass cannot prove the exported default chapter includes them.

**WB-DELIVERY-01 remains the next integration bundle, with Claude as sole runtime writer.** Dad's Grok owns the separately assigned source inventory under `docs/research/wildbond-chapter-promotion-review/`; do not duplicate that report. Codex owns this work order and review. One reconciled branch must preserve the already-tested fence, ground treatment, startup, input and profile behavior.

The smallest safe runtime pass separates reusable appearance from audition startup, retains existing partner choice/profile load and removes review-only Mosshog/reset behavior from the selected playable path. Propose exact owned production destinations for the scene/map/presentation/battle/profile dependencies before moving them; keep independent tests and the reversible audition. Do not globally remove `tests/*` export exclusions or replace an old exported pack with an unreviewed one.

**Proposed save policy for that owner to make concrete:** keep the legacy adventure untouched; back up the old chapter checkpoint before its first geometry upgrade; preserve party/storage IDs, levels, XP, condition, current HP/PP, bag, wallet, items and progression. Keep unchanged-region positions, deliberately relocate old village/interior return positions onto verified safe approaches, and reject future checkpoint versions without writes. A nested opening-version update with an older-reader hold and a pre-upgrade backup is a candidate mechanism, not an approved schema change. The owner must obtain the repository-required explicit save-design approval before merging persistence changes.

Done-when evidence must include:
1. Fresh entry actually presents all three original starters; the selected partner, tutorial and first-Warden path survive normal play.
2. Damaged/fainted parties, spent PP, storage, collected pickups, defeated trainers and badge/healing flags survive quit/Continue. No save silently heals, rerolls, duplicates rewards or selects a new starter.
3. Old chapter checkpoints in village, moved-door approaches and unchanged regions load under the approved policy; future/corrupt primary/spare/backup cases hold writes. Legacy adventure bytes remain unchanged.
4. The default exported entry runs from a clean pack, with fallback art and no editor/import cache or private pack. Required assets/scripts/data are included; actual touch/keyboard paths and first-Warden Return flow work.
5. Full aggregate and scoped native entry/save checks pass on the final source. One desktop/phone player session decides usability; publishing gets a separate exact-pack check.

This work order authorizes preparation within the existing delivery goal. It does not claim runtime implementation, schema approval, final art approval or publication. New evolution/Mega mechanics and the600/700family are not dependencies of chapter promotion.

## Next Wildbond cycle: six bounded bundles
These are proposed delivery bundles, not six new simultaneous claims. Generations PM puts the selected rows into QUEUE's next cycle and preserves the existing quotas for other games. Split risky work across cycles rather than exceeding the six-task Wildbond quota.

| Order / ID | Result and acceptance | Ownership and scope |
|---|---|---|
| 1 / WB-DELIVERY-01 | Retain/replace/defer inventory, followed by one reconciled chapter branch. Exact entry, source revision, inherited fixes and outstanding choices are explicit | Codex directs/reviews; Claude integrates runtime. Existing PRs count toward work, not reasons to rewrite it |
| 2 / WB-DELIVERY-02 | Chosen chapter starts through its intended entry and safely survives quit/Continue; existing saves remain intact | Claude owns runtime/profile/entry. Reuse current profile work; any new save schema or migration needs Evan's explicit approval before merge |
| 3 / WB-DELIVERY-03 | Partner choice, first battle/bond, field-book purpose and early sprint are understandable through play; no repeated tutorial trap | Claude owns the shared opening scene; review existing dialogue/profile/round-battle work first. Record clues in the lore ledger |
| 4 / WB-DELIVERY-04 | Larkhaven and Thornwood invite exploration: connected fence, readable route, one optional discovery, coherent foliage/light and adequate breathing room | One assigned environment builder; owned map/presentation paths fixed before work. Preserve approved interactions, collision and entrances |
| 5 / WB-DELIVERY-05 | All three starters support a fair first-Warden run; healing, move resources, rewards and the next objective make sense | One assigned gameplay builder. Test the chosen battle flow, not screenshots of an obsolete flow |
| 6 / WB-DELIVERY-06 | Fresh desktop/phone play, measured rendering/load checks, a useful feedback path and one identified release candidate | Builder supplies evidence; Codex checks integration risks; Evan plays. Fix blockers before publication; verify release URL against source |

Runtime paths span current chapter/prototype directories and production entry/export files. These are ownership areas, not blanket permission to edit all of them. Each claim pins exact paths and a base SHA. No two builders own the same scene/script simultaneously.

## Who does what
| Person/AI | Best use | Boundary |
|---|---|---|
| Evan | Creative direction, choosing between meaningful alternatives, short real play sessions | Do not make Evan relay routine status or inspect every technical detail |
| This Codex chat | Preserve intent, choose milestones, direct art, create key sprite/image assets and reference sheets, dispatch bounded tasks, review risky changes and coordinate integration | Reserve usage for high-value visual creation and decisions; delegate routine implementation and repeated history reads |
| Claude / existing Wildbond lead | Runtime ownership, scene integration, save/entry work and final production wiring | Keep one writer on the shared runtime scene |
| Evan's Grok, returning around October 21 per Evan | Substantial ready implementation: animation setup, asset preparation/import, placement, environment implementation, content or a bounded tool repair | Build against approved references and owned paths; available usage does not increase scope or permit parallel edits to shared files |
| Dad's dot | Validators, test fixtures, data contracts and bounded tools; first finish #593 | Report unsupported execution honestly and hand off only the missing host checks |
| Dad's Grok | Finish the assigned fence repair, then another named independent task | Distinct from Evan's returning Grok; do not duplicate their claims |
| Fresh reviewer/player | Independently exercise the current build and report what a newcomer experiences | The exact build matters more than the age or volume of old screenshots |

This is a proposed coordination arrangement shared with Generations PM, not a silent reassignment of other chats. Keep the studio-wide ceiling of four building threads plus a reviewer. Inside Wildbond, default to one runtime writer; only independent owned tools/assets/data run alongside it within that ceiling.

## Art ownership and the asset handoff
Evan clarified that this Codex chat should retain a visual-creation role as well as direction. Codex handles creature concepts, evolution/Mega designs, reference sheets, important sprite corrections and environment concepts that establish the target look. This is a workflow choice, not a claim about comparative model capabilities.

Approved starter artwork remains the foundation. Generate or revise art for a named current milestone; reuse approved designs instead of repeatedly redesigning them. Each handoff identifies approved source/reference files, intended scale/palette/facing, frame needs, runtime use and acceptance images. A new candidate is not automatically approved production art.

Builders handle deterministic sheet slicing, animation/frame wiring, asset validation/import, collision/placement and tests against those references. They may flag defects and propose alternatives; coordinate before replacing approved designs or changing creature identity. Pixel-critical cleanup is inspected at native size. Outside assets retain their licence/credit requirements; private art stays private.

Claude and Dad's AIs are actively working: their current claimed paths and assignments continue. This plan does not stop, duplicate or transfer an active task. Codex creates key art outside those owned runtime paths and hands off finished assets through an explicit PR/reference revision.

## Before and after Grok returns
**Until the return:** retain the integrated #593/#602 handoffs, use pinned chapter4c0b1277, and resolve the promotion inventory and startup/save/export contract above. Prepare a single ready work order for Grok; do not spend the two days inventing more far-future content.

**On return:** Grok takes the highest-priority READY bundle with disjoint owned paths. Environment/presentation work is a good default only if integration has established its base and fence ownership is clear. If it would collide with Claude, use a scoped asset/motion deliverable outside the shared scene instead. Finish, review and land the first bundle before claiming another. No deadline or guaranteed output is inferred from the subscription.

## Traffic rules that save usage
1. Existing QUEUE is the task list; #373 is dispatch; each PR's Tower block carries status, paths, dependencies and evidence. This document holds direction. Do not build another dashboard or duplicate ledger.
2. Every work order fits in: goal, exact base, owned paths, done-when/checks, and handoff target. The worker reads those and the necessary source, not the entire history.
3. Ready means the dependency exists and can be tested, paths have one owner, acceptance is concrete and there is a supported verification route. Otherwise resolve the blocker before dispatching.
4. Builder provides one concise self-check and evidence on the final head. Use CI and existing runners. Repeat checks when source, environment or a demonstrated risk warrants it; preserve mandatory final gates. Do not rerun identical suites just to produce another report.
5. Codex handles art direction, key visual creation, decisions, integration and high-risk reviews. Routine sheet processing, wiring, logs, formatting and fixture work stay with builders. Escalate failed checks, ownership conflicts, save changes, unclear creative decisions or publication discrepancies.
6. At most two READY tasks wait behind the active Wildbond work. Do not keep stacking dependent feature PRs when their parent has not landed. A larger existing stack is reconciled; it is not grounds for starting another chain.
7. A cycle ends with a playable link and a short play session. The next work comes from what confused, bored or delighted the player. Reserve part of Codex's remaining usage for review and handoffs rather than spending it all on code.

### Reusable work-order template
Task: <one current-cycle result>.
Base: <verified branch and full SHA>; depends on <PRs>.
Own: <exact paths>; coordinate <named runtime owner>.
Done: <player-visible result>; check <existing commands and required captures>.
Handoff: <PR URL, exact head, pass/fail evidence, blocker or next action>.

## Scope held for later
No new endgame, broad roster expansion, simultaneous biome overhaul, safari build, runtime AI service, multiplayer infrastructure or extra management tooling before the first-Warden milestone. Ideas remain welcome; schedule them at the stage where they improve a playable journey.

Use only the assets/systems needed to deliver the next experience. Keep the ambition; make each landed chapter prove the next investment.
