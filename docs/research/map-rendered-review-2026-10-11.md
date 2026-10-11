# MAP-AUDIT-150: rendered map review, 2026-10-11

**Review completed; game fixes are separate.** The door approaches are visually clear, but the actual tap handler still rejects the inn, shop and both home entrances. Keyboard actions work. This confirms the [existing #137 review](https://github.com/ecbarish/idle-arcade/pull/137#issuecomment-6098889694); no duplicate bug issue was filed. The homes and inn need the furnishing work already described in [ROOM-03/04/05](../plans/scene-layout-pass.md). No new hard roof/tree/prop obstruction was found in the sampled views.

## Revisions and evidence

- Game-source baseline: `3c77e086fd95a55112f855abc9a73a55bce64b48`.
- Review harness head: `b505e3c817844f59609fc4dc88f5d6acc19b6a96`.
- Actual rendered/tested CI merge: `c95e8f71a7c04516318bc23c673abcf9df977197`.
- Godot `4.7.2.stable.official.ed1daf0bf`, native X11/Xvfb with Mesa GL compatibility renderer; actual window framebuffer screenshots through ImageMagick, not reconstructed scene drawings.
- [Final capture run](https://github.com/ecbarish/idle-arcade/actions/runs/38158156008): **345 nonblank PNGs** (243 Wildbond, 102 Starfall), manifests, access JSON and logs in artifact `map-rendered-review` (ID `11708937404`; retention to 2027-01-09).
- [Full checks on harness head](https://github.com/ecbarish/idle-arcade/actions/runs/38158156132): all 17 suites passed (Wildbond native 1,340; Starfall native 152). The preceding head's full-check run crashed during Godot asset import (signal 11); no checks were weakened, and the subsequent full run passed. The capture run itself passed throughout.
- [Selected original PNGs](../screenshots/map-review-150/) and [portable evidence summary](map-review-150-summary.json) are retained in this PR. These images are unaltered original captures; the full artifact retains all views.

The main game's files, assets, saves, versions and web exports are unchanged. Keep this PR as a review deliverable; no merge is authorized here.

## What was exercised

- Every one of the **13 Wildbond outdoor maps**, with four sector viewpoints plus overview, faded/restored colour, and the real camera at **1920×1080 and 812×375**. All five Larkhaven entrances have front/left/right approach views. Barn, inn, shop, Pip's home and Nora's cottage have arrival and service/resident views.
- Wildbond engine input: named movement action through the real `_process()` loop, and the real `_tap()` handler followed by that loop. Five interior entry/exit paths with a follower, at both sizes. This is engine-level input evidence, not an operating-system touch or physical-keyboard test.
- Starfall: empty rank 0 and two fully completed rank 3 plot permutations, covering all five building types and four plots. Gate, hall, inn, board, plot steps and smithy/apothecary/tavern service positions at **1920×1080, 812×375 and 375×812**.
- Existing access fixtures rerun unchanged: **18 Wildbond maps/interiors, zero target findings, zero roof-route witnesses; all 501 Starfall construction states, zero unreachable targets.** A green access/capture run does not mean the tap-entry behavior passed.

## Reproduced input failure: existing #137 finding

In free play, stand immediately below a door and tap its tile centre:

| Destination | Player tile | Door tile | Tap result at both sizes | Movement action |
|---|---|---|---|---|
| Inn | (4,5) | (4,4) | Rejected; remains outside | Enters and exits |
| Shop | (7,11) | (7,10) | Rejected; remains outside | Enters and exits |
| Pip/Mira | (13,5) | (13,4) | Rejected; remains outside | Enters and exits |
| Nora | (2,11) | (2,10) | Rejected; remains outside | Enters and exits |
| Barn (control) | (18,5) | (18,4) | Enters and exits | Enters and exits |

For each rejected tap, `route_candidate` contains the single door step, `queued_at_input` is empty, and the player remains in Larkhaven after 120 frames. `_tap()` accepts only a walkable goal, partner, barn door or barn exit; `walkable()` rejects these four `D` tiles. `_step()` separately accepts registered `DOORS` in Larkhaven/free play. No roof obscures the visible targets.

Evidence: [rejected desktop tap](../screenshots/map-review-150/wildbond/inn-tap-handler-entry-1920x1080.png), [rejected phone-size tap](../screenshots/map-review-150/wildbond/inn-tap-handler-entry-812x375.png), [successful phone-size movement entry](../screenshots/map-review-150/wildbond/inn-key-action-entry-812x375.png). All four cases are in the manifest. Reproduce with `tools/audit/wildbond_render.gd`; the report makes no claim that the separate repair has landed.

## Visual pass/fix record

“Pass” here means no new hard obstruction in the captured views, not a full end-to-end gameplay certification.

| Place | Result / concrete next step |
|---|---|
| Larkhaven | All five front/side approaches remain visible below roofs. Barn, cottage fronts, crossroads and pen opening read clearly. [Shop approach](../screenshots/map-review-150/wildbond/larkhaven-door-7-10-from-7-11-1920x1080.png). Input failure above is separate. |
| Thornwood Route | Main trail and pond-side route clear. At tile (6,12), foreground canopy partly covers lower body; intentional translucent depth, potential readability polish. |
| Thornwood | Central road, pond rim and gaps between tree clusters readable. |
| Old Root Grove | L-shaped path and pond clear. At entrance (1,8), canopy covers lower torso/feet while head remains visible; consider stronger player-reveal transparency. [Phone evidence](../screenshots/map-review-150/wildbond/thornwood_grove-faded-812x375.png). Not a collision failure. |
| Saltmarsh | Beach, junction and shoreline readable; entrance foliage only brushes player edge. |
| Emberfall | East–west road, hot pool and cliff openings visually separate. |
| Cloudglass | Rock clusters leave route/eastern exit clear; translucent clouds do not hide them. |
| Stillreed | Both bridges, ferry landing and orchard path remain readable. |
| Hollowecho | Bell-house roof, cave openings, survey cord and resting stones leave route clear. |
| Sunthread | Hall roof stays above forecourt; planting beds and mending frame leave winding path readable. |
| Farwatch | Lookout/boathouse roofs stay off route; pier boards, posts and lamps describe landing. |
| League | Court roofs, forecourts, roads and reflecting pools separate cleanly. Repeated facades/lawns are dressing opportunities, not failed access. |
| Lighthouse Spire | Route clear. Focal tiles x6–12/y2–6 read as two repeated shrub rows over mostly empty sand, with little distinctive landmark silhouette. [Evidence](../screenshots/map-review-150/wildbond/spire-sector-6-5-812x375.png). Candidate art/layout task: clarify the existing Spire's identity without moving access anchors or inventing lore; builder/design owner should assess it. |
| Maren's barn | Stalls, nursery, trough and workbench are distinct; large working floor and exit remain clear. [Trough approach](../screenshots/map-review-150/wildbond/barn-service-21-8-812x375.png). |
| Inn | Clear counter/Old Ned at (10,4), arrival and exit. Four isolated candle tables at (7,7), (15,7), (7,9), (15,9), with no visible seats/resting group. ROOM-05: add hospitality/seating groups while preserving counter front (10,6) and exit (11,11). [Evidence](../screenshots/map-review-150/wildbond/inn-resident-1920x1080.png). |
| Shop | Counter, goods shelves/crates and Juniper read clearly; service front (11,6) and exit clear. Further dressing is lower priority than tap entry. |
| Pip/Mira home | Resident (12,4), gift (15,8), exit (11,11) visible. Bed/hearth/shelf/table remain isolated around a largely unused floor. ROOM-03: family eating/seating and sleeping/storage groups, using existing dialogue's everyday details. Preserve gift/route. [Evidence](../screenshots/map-review-150/wildbond/pip_home-resident-1920x1080.png). |
| Nora's cottage | Resident (9,4), gift (14,9), exit (11,11) visible. Hearth (7,3) and candle table (12,6) lack a coherent chair/kettle grouping. ROOM-04: a compact hearth-centred composition distinct from Pip's home. [Evidence](../screenshots/map-review-150/wildbond/gran_home-resident-1920x1080.png). |
| Starfall gate/hall/inn/board | Gate (2,9), hall step (12,6), inn step (20,7), serving (18,8), board (7,8) clear. Roof/counter canopy does not hide sampled feet. Hall/inn are intentional exterior facades, not failed walk-in doors. [Hall approach](../screenshots/map-review-150/starfall/empty-rank0_1920x1080_hall-approach.png). |
| Starfall empty/completed plots | All four plot approaches and all five building silhouettes remain distinct. Southern palisade stays below sampled player feet. [South plot](../screenshots/map-review-150/starfall/completed-a-rank3_812x375_plot-south-approach.png), [smithy service](../screenshots/map-review-150/starfall/completed-a-rank3_1920x1080_service-smithy-west.png), [tavern service](../screenshots/map-review-150/starfall/completed-b-rank3_812x375_service-tavern-west.png). |
| Starfall square | Sparse dressing and northern roofs cropped in initial view remain visible. Existing ART-SF-8 and SF2.6c cover them; do not duplicate. [Starting view](../screenshots/map-review-150/starfall/empty-rank0_1920x1080_square.png). |

## Limits and reproduction

The screenshots use a native-window proxy for phone dimensions, not Safari/Chrome on a phone. At 812×375 both games render a centred 384×216 image because of shipped integer scaling. Wildbond portrait shows its rotate prompt; Starfall portrait displays a 375×216 strip, clipping nine rightmost columns. These are native presentation observations; browser/device behavior and touch-pad activation require their own test.

Static fixture viewpoints pause actors/time and stage the player. The follower is placed one tile south for composition, which may be invalid beside a tree/wall; such follower overlaps were **not** counted as gameplay defects. Transition samples then drive real following/movement. Starfall's frozen starting actor overlap is likewise not evidence of a dynamic bug. These checks do not cover every festival/night/progression state, interaction reward, moving-NPC combination, physical gamepad, or long-play save. No save/reward decisions were made; `no_save` is enabled.

Run the dedicated `.github/workflows/map-rendered-review.yml` on the review branch, or reproduce its import/access/Xvfb commands with Godot 4.7.2. `REVIEW_OUTPUT` selects each game's output directory. The validator rejects missing/blank images and records access results; a human must inspect composition separately. Startup fade is explicitly settled before pausing, avoiding the black WD4a/WB5 evidence seen in an older workflow artifact. Engine teardown logged resource-in-use warnings after the transition fixture; there were no script errors or capture failures.
