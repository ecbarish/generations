# Scene layout pass: believable rooms and clear entrances

Evan requested this outline on 2026-10-10 after seeing the Larkhaven homes. His direction: look at how Pokemon and
similar games make interiors understandable, and give other AIs a plan they can help build. Codex wrote this design
handoff; it is not a claim that every map has had a visual playtest or that the proposed furniture is already built.

## Start here: coordinate before building

- Read COMMS, START-HERE, CREATIVE, PROCESS and the game's art direction. Check open PRs before taking a task.
- [MAP-AUDIT #147](https://github.com/ecbarish/idle-arcade/pull/147) owns the existing native audit fixtures/report.
  It reports static access checks for 16 main Wildbond maps, 18 maps with the homes, and 501 Starfall plot assignments.
  Its source revisions and limits are in that PR; these results do not establish visual quality or working pointer input.
- [Issue #149](https://github.com/ecbarish/idle-arcade/issues/149) tracks tap routes crossing roof collision.
  [Issue #150](https://github.com/ecbarish/idle-arcade/issues/150) tracks the outstanding rendered/visual review.
  Use those reports rather than commissioning a duplicate audit.
- Homes were built in [#137](https://github.com/ecbarish/idle-arcade/pull/137). Preserve Mira, Nora (Gran), their
  conversations, the one-time gifts and old-save relocation. Check its latest state before changing that code.
- The Starfall frontier assets are being built in ART-SF-1 through ART-SF-6. Check their current PRs; request missing
  pieces from the asset owner instead of painting a competing set. Starfall keeps its frontier look.
- This outline changes no game, asset, preview, save, version, story text or mystery clue. Follow-up implementation
  uses a separate draft PR claim per task. Unclaimed suggestions below do not reserve files.

## What we learn from references

[Pokemon's player houses](https://bulbapedia.bulbagarden.net/wiki/Player%27s_house#Kanto) separate bedroom functions
(bed, computer, personal possessions) from downstairs living/dining functions. FireRed/LeafGreen also has a kitchen
area; the mother is associated with the dining table. [Stardew Valley's farmhouse](https://stardewvalleywiki.com/Farmhouse)
starts as a modest home with sleeping space, a fireplace and furniture, then grows with play.

Our design interpretation: arrange a few recognizable activities in a compact space. A table belongs with seating;
a hearth belongs with a place to sit or cook; a bed belongs with personal storage. Keep a clear route through them.
These games are layout references, not asset sources. Do not copy sprites, screenshots into game textures, exact
floor plans, dialogue or characters. Wildbond follows [its own art direction](../art/wildbond-art-direction.md).

## Quality rules for every room and route

1. **Purpose first.** Write one sentence about who uses the room and what they do there. Furnish for that activity.
2. **Group objects.** Use a few coherent groups instead of isolated objects along the edges of a large empty floor.
3. **Size for the activity.** Reduce empty space or give it an identifiable use. An ordinary cottage should feel
   intimate; a guild hall may need a deliberate open gathering space. Avoid a universal decoration-density target.
4. **A readable threshold.** Show the door, its outside approach and its inside landing. Keep a continuous foot-level
   route from arrival to the resident, service and exit. Prefer extra passing space at corners where a partner follows.
5. **Art agrees with collision.** Walls, tall furniture, trees and building footprints must match what the player can
   cross. Decorative foliage or a roof must not visually disguise a usable entrance. Ground rugs do not block movement.
6. **People belong to activities.** Place residents near something they use, beside rather than in the doorway.
   Check their idle/walking destinations as well as their initial position. Followers must be able to yield or pass.
7. **Different homes tell different everyday stories.** Use existing dialogue and belongings for identity; do not add
   ancient symbols, unexplained relics, family history or mystery evidence as casual decoration. New Wildbond clues
   require the thread ledger and normal canon review.
8. **Light explains the room.** Warm light near the hearth, softer daylight by a window, shadows consistent with each
   source; readable furniture silhouettes in both faded and restored colour. No extra flicker needed for this pass.
9. **Keep the world in the window.** Residents speak through the existing in-world scene code. Do not introduce side
   panels, a new furnishing editor or a new interaction system to deliver this polish.

Exterior and interior scale need not match literally, but must feel related. Respect current building footprints and
entrance anchors; any larger exterior change needs its own placement/access review. Think about physical furniture
height and footprint so the room also makes sense if the art becomes richer later.

## First room briefs: Larkhaven

These are visual proposals based on the current home dialogue, not new canon or final tile coordinates.

| Room | Activities and arrangement | Existing identity to show | Keep unchanged |
|---|---|---|---|
| Pip and Mira's home | Family eating/cooking group; clear entrance landing; sleeping/storage group away from the route | Pip's boots near, but off, the entrance; his sleeping space; Mira's scarf if the art supports it; the lure pouch in a deliberate, reachable place | Names, dialogue, home/door identity, gift ID and exactly 2 lures once |
| Nora's cottage | Smaller hearth-and-chair group; kettle within that group; table with seating; sleeping/storage nook | Berry basket and the kettle already mentioned in her conversation; a warmer, quieter composition than Pip's family home | Nora/Gran, harvest-hum dialogue with its origin unresolved, gift ID and exactly 3 berries once |
| Larkhaven Inn | Table with seating; clearly recognizable rest/service point; room to approach Old Ned | Hospitality rather than rows of unrelated props | Existing healing, prices/rewards if any, entrance and save behaviour |
| Juniper's shop | Goods/storage around a legible counter; approach lane to Juniper and space to turn around | Visible goods suited to the existing lure/berry shop | Existing stock, costs, counter interaction and doorway |
| Maren's barn | Keep stalls, feed/trough and workbench functionally distinct; check their approach lanes | Working ranch space, not a cottage with different walls | Starter choice, bond, ranch jobs, workbench and story progression |

Start with the two homes. Build one cohesive room, review it at player scale, then adapt the principles to the other.
Do not merely mirror the first layout. Furniture suggestions such as chairs and boots require available original art;
if a piece is absent, list it in the asset request instead of importing a new pack.

## Suggested small tasks others can claim

Task IDs are local to this outline. None is claimed by this documentation PR. Check the linked issue/PR and message
its owner in COMMS before taking code they already own. Create the draft PR claim first; actual source filenames
must be verified against the current tree, not inferred from this table.

| Suggested ID | Deliverable | Owner/file boundary | Done when |
|---|---|---|---|
| ROOM-01 | Rendered entrance review | Reviewer; continue #150. Captures/report only; no game edits | Inventory every built Wildbond and Starfall map/interior, with entrance views, reproduction steps and per-area findings |
| ROOM-02 | Input and collision repair | Builder of the affected game; coordinate #149 and the door-input note on #137 | Actual keyboard, pointer/touch and supported gamepad paths enter/leave correctly; no walking through roofs; regression checks reproduce the failures |
| ROOM-03 | Pip and Mira's furnishing pass | Wildbond builder, after homes settle; existing interior data/drawing only | Cohesive family space, clear landing/routes, reachable resident/gift, before/after captures and old saves pass |
| ROOM-04 | Nora's furnishing pass | Wildbond builder; after ROOM-03 or stack on it if files overlap | Clearly different, compact hearth-centred home; berry gift and conversations preserved; same acceptance checks |
| ROOM-05 | Inn, shop and barn pass | One Wildbond room per PR unless genuinely independent files | Service/stall/workbench layouts make sense and all existing actions remain reachable |
| ROOM-06 | Starfall room/door composition | Starfall builder with current frontier asset owners; one building per PR | Building purpose obvious from composition, service approach clear under every legal plot placement; wages/jobs/hiring unchanged |
| ROOM-07 | Area-by-area exterior pass | Game builder; use ROOM-01 findings, one area per PR | Continuous believable paths, readable bridges/gates/settlements and landmarks, existing exits/story/hidden pockets preserved |

Fix a broken input or entrance before embellishing it. The art owner may prepare requested furniture concurrently,
but two builders must not independently edit the same shared room renderer or main script. If tasks share files,
finish/merge the first or explicitly stack the next branch and state its dependency.

## Acceptance: three different kinds of evidence

**Automated access:** arrival reaches each required doorway, interaction standing point, resident, service, gift and
exit; furniture and roofs are solid where intended. Cover relevant stage, NPC, follower and legal plot states, not
just one frozen arrangement. Keep existing audit fixtures and extend them through their owner's PR.

**Actual controls:** start from the street, click/tap the visible entrance, walk through with keys and use supported
gamepad controls; interact, leave, then re-enter with the partner following. Test the real input handler. Teleporting
into a room or calling `_step()` directly is useful unit evidence but does not establish that a door tap works.
No player decision may be auto-selected to complete the route.

**Visual playtest:** inspect actual captured frames with the player away from the entrance and approaching it from
both sides. Distinguish the player from a blocking NPC. Check roofs, tree canopies, signs, furniture and festival
props for occlusion; inspect both faded/restored colour and available day/night states. Confirm the room's purpose
and resident are recognizable without a text description. A static pathfinding pass cannot prove this.

For each changed room, include before/after phone (375px), laptop (1366x768), desktop (1920x1080) and ultrawide
(3440x1440) captures, plus phone landscape for touch entry. Assess relative proportions and camera framing; do not
stretch the room or sprites to fill an ultrawide. Honour larger text and reduced-motion settings.

Old saves must keep progress, gifts and inventory. If moved furniture covers a saved standing tile, relocate safely
to a reachable landing inside that same place, without replaying rewards or the opening. Exercise saves made both
inside and outside the room, returning after the gift, and loading after the layout change. Preserve existing IDs.
No save-schema redesign, game-version bump or preview export as part of a furnishing PR.

Run `node tools/run-all-checks.cjs` and the task's input/access tests. Review screenshots separately. Record the
source commit, tested story states and any unavailable platform instead of calling an untested map all-pass.
The preview/build owner exports only after the source changes merge and verifies that the deployed pack matches.

## Copyable task prompt

> Repo: github.com/ecbarish/idle-arcade. Read START-HERE.md, AGENTS.md, docs/COMMS.md, docs/PROCESS.md and
> docs/plans/scene-layout-pass.md. Check open PRs, #149 and #150; choose one unclaimed ROOM task and claim it
> in a draft PR before building. Work in your own clone on a branch, never switch Evan's Desktop checkout.
> Keep to the task's room/area and coordinate shared renderer or art files with their owner. Preserve existing
> canon, rewards, IDs and old saves. Test real entrance controls as well as static reachability; show before/after
> captures at the specified sizes. All suites must pass. Commit as 206636510+ecbarish@users.noreply.github.com.
> Open a ready PR with Design, validation and remaining limitations. No game-version bump or preview export.

## Review record template

| Game / map / room | Source commit and story state | Entrance and controls | Furniture / identity / light | Evidence / issue / claim |
|---|---|---|---|---|
| Fill one row per place actually reviewed | Include player/follower and relevant NPC or plot state | Keys, tap/click, gamepad if supported; entry, service, exit | Specific observed problem or pass, not "looks basic" alone | Screenshot paths, reproduction and linked issue/task |

The reviewer records observations; the builder proposes the smallest repair. Mark a finding resolved only after
checking the merged source or exact exported pack. This outline does not close #149 or #150.
