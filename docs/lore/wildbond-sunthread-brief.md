# Sunthread Commons: build brief for Godot

WB3.5 part 2 / T49, 2026-10-09. For Claude's WB3.3 build. Documentation only: existing browser/exported canon
and proposed physical staging. Hollowecho is already built; this introduces no encounter, mechanic or new clue.

## The feeling and the promise

After Hollowecho's quiet listening, Sunthread is a place where useful work is shared. Broad upland meadows,
wind-loosened shelter cloth and a busy gathering make room for large and small partners. Wren is still competitive,
but now notices someone who needs a role before she asks for a rematch. The last two badges are within reach;
the journey's lesson is becoming visible in what people do, without a speech telling the player what to feel.

Source of truth: [Area 7 canon](wildbond.md), [T40 clue ledger](wildbond-threads.md#areas-58-clue-placement-t40-codex-2026-10-08),
browser [00-data.js](../../games/wildbond/js/00-data.js), [11-maps.js](../../games/wildbond/js/11-maps.js),
[12-walk.js](../../games/wildbond/js/12-walk.js), [10-sound.js](../../games/wildbond/js/10-sound.js) and
[06-scene.js](../../games/wildbond/js/06-scene.js). Import the actual exported data and exact dialogue, not a
transcription of this document. Follow the depth/footprint and in-window rules in PROJECTS and CREATIVE.

## Route and places: the exported contract

Map ID `sunthread`, name **Sunthread Commons**, 30 columns by 14 rows. Zero-based tile coordinates below.
The existing rows already describe irregular meadow grass, a winding path and a meeting hall above its forecourt.

| Anchor | Source location / destination | Preserve |
|---|---|---|
| Arrival | `[1,9,'right']` | Enter from Hollowecho with Echo; a readable path before optional exploration |
| West exit | local `[0,9]`; destination Hollowecho `[28,9]`, left | Ordinary return route |
| Shelter mender | Mirel `[8,6]` | Clear approach beside western meadow |
| Gathering runner | Aldren `[19,7]` | Shared forecourt and room for partners |
| Visiting peddler | Pell `[21,4]` | Conversation only, no new shop; Brisket is mentioned in his existing lines |
| Weaver | Nesla `[22,5]` | Cloth, shared clues, four heritage perspectives and Loom payoff |
| Route sign | `[17,5]` | Nursery ground and directions |
| Shelter sign | `[27,4]` | Four braids, common knot; readable even with gathering furniture |
| Warden | Halen `[24,5]` | Beside meeting hall; leave clear walking and battle approaches |
| East exit | local `[29,9]`; destination Farwatch `[1,9]`, right | Loom required; explain build availability honestly |
| Supplies | `st1` `[3,4]`: 8 grain; `st2` `[14,10]`: 6 lures; `st3` `[26,11]`: 8 berries | Existing one-time IDs/rewards |

Local exit tiles and destination arrival coordinates are different. Preserve the exported collision rows rather
than placing an exit at its destination coordinate. Decorative cloth must not close a narrow route or hide a sign.

**Staging suggestion, not new canon:** give Mirel a mending corner, Aldren a clear crossing and Nesla a cloth
bench where the four loose braids can be seen. A broad shelter silhouette, low nursery beds and partners resting
beside rather than over one another distinguish the gathering from Hollowecho. Use footprints and heights,
contact shadows and the existing map; no required sewing minigame, task list or new rewards. If Brisket is drawn,
keep him beside Pell and off the path; his presence does not unlock trading here.

## People and their voices

| Person / ID | Voice / current interaction | Keep |
|---|---|---|
| Mirel / `mirel` | Shelter mender; gentle, practical trainer | Clovercolt holds the cord; Hemglow shows fraying |
| Aldren / `aldren` | Gathering runner; attentive trainer | Messages, returning teams and different useful jobs |
| Pell / `pell` | Friendly exaggeration, answered by Brisket | Passing through, shelter ties; no new transaction |
| Nesla / `nesla` | Weaver; generous but careful about blame | Three shared clues, Loom replacement, four heritage reactions |
| Wren / `wren` | Competitive friend who makes room | Helps young tamer's small partner hold the tie, then asks to battle |
| Halen / `halen` | Patient organizer, names each returning team | Different strengths; frightened youngster's choice complicates the Unbound slogan |

People speak beside their world positions using the existing scene system; the book records the encounter.
Keep `{name}`, trainer after-battle lines and original titles. Nesla and Pell are not trainers. Preserve shared
clues and the badge payoff for every heritage; origin recognition is an addition, not an exclusive truth route.

## Encounters and pacing: implemented data wins

`BIOMES.sunthread.lv = [62,68]`, prerequisite `echo`. Six badges give cap 65; winning `warden7` grants `loom`,
cap 70. Exploration thresholds are the existing local story counters, not a request for a new timed chore.

| Encounter | Local explores | Team / result |
|---|---:|---|
| `rival8` | 6 | Blazefang 64, Ribbonstride 66, `$rival` 67; existing partner substitution |
| `meadowmantle` | 14 | Wild tuple `['meadowmantle',67,4]`; unique guardian |
| `warden7` | 24 | Tilthtusk 63, Hemglow 64, Bloomcourser 65; Loom Badge |
| Mirel | Route trainer, sight 2 | Clovercolt 64, Hemglow 65 |
| Aldren | Route trainer, sight 2 | Pennantlark 65, Blazefang 66, Ribbonstride 67 |

**Stale lore:** Area 7's older paragraph gives Halen 65/66/68. Runtime/browser export is **63/64/65**. Keep the
implemented team unless a separate balance decision changes it. The area range does not override that team.
Guardian lures/calm, uniqueness and knockout retry keep their existing rules. The tuple's final value is encounter
metadata; do not create a new rarity mechanic or ordinary wild entry for Meadowmantle.

## Species: ten represented, eight ordinary wild entries

The original eight remain (Hearthrunner is cut from the roster, WILD-CUT-1); T37 added Sunfrill and Boughchorus to the current regional wild table. Do not port an
older seven-entry table or drop those catalogue creatures. Relative weights are not percentages.

| ID / name | Element / family | Current encounter route |
|---|---|---|
| `clovercolt` Clovercolt | Grove / horse | Weight 24; evolves to Bloomcourser at 64 |
| `bloomcourser` Bloomcourser | Grove / horse | Evolution and Halen; no ordinary wild entry |
| `tilthtusk` Tilthtusk | Grove / boar | 18 |
| `hemglow` Hemglow | Radiant / sprite | 18 |
| `pennantlark` Pennantlark | Radiant / bird | 16 |
| `ribbonstride` Ribbonstride | Gale / horse | 14 |
| `dawntassel` Dawntassel | Radiant / sprite | 3; uncommon, not unique |
| `meadowmantle` Meadowmantle | Grove / boar | Unique large guardian, story only |
| `sunfrill` Sunfrill | Radiant / lizard | 4; newer catalogue entry, preserve existing evolution data |
| `boughchorus` Boughchorus | Grove / bird | 4; newer catalogue entry, preserve its existing evolution chain |

Ecology is useful work: soil loosened around marked beds, light on shelter edges, warmth beneath benches, ribbons
returned from wind, an orchard chorus and a sail shading small companions. Stage a few recognisable behaviours
when practical; this brief adds no new ability or feeding rule.

## Thread checklist: observations, attributed claims and a small payoff

Already placed in T40; exact exported lines remain authoritative. No new clue is introduced here.

1. Sign `[27,4]`: four differently braided shelter ties share one knot. Common roots or exchanged craft are
   possible; it does not announce ancestry or the cause of the fading.
2. Nesla base 1: green nursery ribbons are missing; somebody blames the Unbound before finding them. The blame
   belongs to that person, not the narrator.
3. Nesla base 2: an Unbound copy says two became one, the land went pale, therefore free every creature. Keep the
   attribution and Nesla's doubt about a long command from a short account. Their causal reading is not proof.
4. Nesla base 3: wave and hungry-field tales coexist in families preserving the same cloth. Several accounts remain.
5. Halen's T40 appended introduction: an Unbound visitor opened a travel pen; two went home, a frightened youngster
   stayed beside its tamer. Let the youngster's agency remain visible; no faction-wide moral verdict.
6. Nesla `byBadge.loom`: Ribbonstride gathered ribbons out of gusts under the nursery bench; a marked basket helps.
   The Unbound visitor helped move a shelter. Thanking a person does not endorse the copied account.

Append Nesla's existing `farm`, `coast`, `highland`, `wander` recognition with the same once-per-person Godot
pattern. Farm compares land/hands remembering; Coast folds wave and furrow braids together; Highland preserves a
disputed watcher tale; Wander allows both the visitor's care and the youngster choosing to stay. Keep the shared
lines and post-badge replacement. No inferred heritage lines for Mirel, Aldren or Pell in this area.

Unresolved: the fading's opponent, old pair identities, watcher identity and Unbound leader's intent. The ribbon
answer is small and fair; it does not solve those threads or require capturing a particular creature.

## A memorable moment: the smallest useful turn

**Recommended staging of existing events:** let Wren kneel near the young partner, leave physical space at the
loose tie, then show the cloth settling as the next team arrives. Later Meadowmantle shelters the windward nursery
until the gust eases; it invites the team onto clear ground only when the young ones can rest. Halen notices the
same varied strengths before the battle. These are the existing scene beats, without a new weather puzzle,
required input timer, automatic battle chain or extra dialogue. Important lines wait for the player.

## Light, sound and weather

Palette: sky `#9fcfe4` / `#f1e6b6`, hill `#90ac5f`, ground `#b4bf70`. `WEATHER.sunthread` is
`['clear','clear','rain']`; sudden storms in prose do not mean adding a fourth weather type. Cloth shade should
shelter faces without obscuring paths. Existing battle backdrop: dunes/oaks, leaves `.35`.
Browser original tune: `TRACKS.sunthread`, 104 BPM triangle, G-major answering phrases over G-C-Em-D.
Godot may choose its licensed inventory, retaining an open, shared-work feel and credits. No asset download or
new music is supplied here. Off/effects/music and reduced-motion settings apply; no clue depends on audio.

## Build acceptance and verification

- Echo permits arrival; west return and every actor/sign/supply/Halen approach are reachable. Decorations and
  following partner leave a gap. Meeting-hall geometry has real footprints and height.
- Loom opens east only when Farwatch is actually available; a pending build gets an honest explanation.
- Ten species, eight weights, both trainer teams, three story IDs/thresholds and cap match the current export.
- Every heritage gets the five shared clues and ribbon payoff; origin reactions remain once-only across reload.
- Wren, nursery and guardian beats preserve physical space, player control and readable text with sound off.
- Claude should play from a six-badge save, retry the guardian/Warden, return west, reload and inspect phone,
  laptop, desktop and 3440x1440. This document does not claim those Godot tests have run.

Read-only isolated localhost browser inventory confirmed both maps, people/teams, signs, exits, rewards, wild
weights, appended Warden lines, four heritage keys, weather, original tracks and battle backdrops. All eight
browser pages pass. Browser data, engine, exporter, Godot, saves and versions are unchanged.
The real 39-table export matched the live inventory exactly, with no missing or dropped-code warning. Seventy-three handoff checks across both briefs verify source tables, documented IDs/species and actual shortest-path reachability to people, signs, supplies and exits. No Godot JSON was written.

Latest main's [four-seasons proposal](../proposals/seasons-and-holidays.md) is preserved. The palette and weather contract above describe the current area baseline; seasonal looks and festivals belong to WS1-WS6, not new mechanics or calendar claims introduced by this brief.
