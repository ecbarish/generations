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

## Immediate unblockers
- **#593:** owner Windows fallback capture passes 53/0; six images inspected; all 28 aggregate suites pass at 2d0f0da. Dot must repair the Windows fake-engine argument transport; 39 fixture assertions pass before its strict private-pack assertion fails. Keep draft until corrected final-head checks pass. Native capture access is no longer the blocker.
- **Fence:** Dad's Grok owns WB-GUEST-FENCE-CONNECTIONS. Obtain its status and deliver the existing bounded repair; do not start a second fence implementation.
- **Integration:** current chapter reference is #591 / c94e856b, pending the two bounded follow-ups above. It is a reference, not a claim that it is the published game. List each earlier relevant PR as retain, replace or defer, with source evidence. Consolidate deliberately and retire duplicates when their work is preserved.
- **Legacy screenshot:** #491 is already in that chapter's ancestry. Its old scripts/battle.gd issue is not evidence against tests/opening/battle.gd. Review retained legacy entry paths separately. Older branches and web exports overlap; never apply an old pack over the chosen chapter accidentally.

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
| This Codex chat | Preserve intent, choose the next milestone, dispatch bounded tasks, resolve dependencies, review risky changes and coordinate integration | Reduce routine implementation and repeated full-history reads |
| Claude / existing Wildbond lead | Runtime ownership, scene integration, save/entry work and final production wiring | Keep one writer on the shared runtime scene |
| Evan's Grok, returning around October 21 per Evan | Substantial ready implementation with explicit ownership; visual/environment work, content implementation or a self-contained tooling repair | High available usage does not increase scope or permit parallel edits to shared files |
| Dad's dot | Validators, test fixtures, data contracts and bounded tools; first finish #593 | Report unsupported execution honestly and hand off only the missing host checks |
| Dad's Grok | Finish the assigned fence repair, then another named independent task | Distinct from Evan's returning Grok; do not duplicate their claims |
| Fresh reviewer/player | Independently exercise the current build and report what a newcomer experiences | The exact build matters more than the age or volume of old screenshots |

This is a proposed coordination arrangement shared with Generations PM, not a silent reassignment of other chats. Keep the studio-wide ceiling of four building threads plus a reviewer. Inside Wildbond, default to one runtime writer; only independent owned tools/assets/data run alongside it within that ceiling.

## Before and after Grok returns
**Until the return:** close #593's fixture defect, obtain the fence handoff, pin the chosen chapter and resolve the integration inventory. Prepare a single ready work order for Grok; do not spend the two days inventing more far-future content.

**On return:** Grok takes the highest-priority READY bundle with disjoint owned paths. Environment/presentation work is a good default only if integration has established its base and fence ownership is clear. If it would collide with Claude, use a scoped asset/motion deliverable outside the shared scene instead. Finish, review and land the first bundle before claiming another. No deadline or guaranteed output is inferred from the subscription.

## Traffic rules that save usage
1. Existing QUEUE is the task list; #373 is dispatch; each PR's Tower block carries status, paths, dependencies and evidence. This document holds direction. Do not build another dashboard or duplicate ledger.
2. Every work order fits in: goal, exact base, owned paths, done-when/checks, and handoff target. The worker reads those and the necessary source, not the entire history.
3. Ready means the dependency exists and can be tested, paths have one owner, acceptance is concrete and there is a supported verification route. Otherwise resolve the blocker before dispatching.
4. Builder provides one concise self-check and evidence on the final head. Use CI and existing runners. Repeat checks when source, environment or a demonstrated risk warrants it; preserve mandatory final gates. Do not rerun identical suites just to produce another report.
5. Codex reviews decisions, integration and high-risk changes. Routine logs/formatting/fixture work stay with builders. Escalate failed checks, ownership conflicts, save changes, unclear creative decisions or publication discrepancies.
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
