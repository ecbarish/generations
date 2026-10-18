# Lived-in healing spaces and building sight lines

Codex / root for Evan, Lane A, WB-LIVED-IN-CENTERS. PR #567, branch `codex/wildbond-lived-in-centers`, stacks on #566. Source review only, not merged or published.

## What changed

The shared Healing Inn / Gate Loft interior now has two approachable waiting visitors as well as the nurse. An Inn Neighbor stands beside Larkhaven's inn approach and a Trail Walker rests beside Gate Loft. Visitors use the installed Pokemon NPC roles (Hiker, child and caretaker) with complete source frames and feet anchors; the outdoor visitors take bounded steps and face nearby players, while the indoor visitors face nearby players from their waiting positions. Their short conversations describe rest and travel, with no new mystery clues, named-cast relocation or quest conditions. Door pads, the center aisle, healing interaction and exit stay clear. Service staff now exist in the fallback review presentation too.

The indoor camera uses a closer field of view so people and services occupy more of the game window. All six chapter buildings have a camera cutaway based on their full transformed mesh bounds, testing rays to lower-body and head height. This protects the player, follower, nearby people and nearby entrance approaches. Roofs, walls and signs fade together and return to solid when clear. Existing tree fading remains in place. Visibility changes do not change collision or let players walk through buildings.

## Pidgey and people art

Evan correctly noticed that the public #566 battle evidence showed an incorrect blue bird. It was the original generic **fallback test artwork**, not the installed Pidgey frame. The actual private-pack capture is a recognizable tan/brown Pidgey. Native checks now explicitly load its actual front frame, and a missing private sprite pack produces an in-battle TEST ART notice. No fake bird is imported as Pidgey. People shown to Evan should use the installed Pokemon NPC presentation; procedural figures remain only a portable review fallback.

The working pack and its Pokemon NPC/creature artwork stay external. No downloaded/imported art, active pack selection, catalogue, save schema, production data, graph, public export or release is changed. Private images remain in Evan's external `wildbond-lived-in-centers-private` evidence directory; this report's captures are deliberately fallback-only and do not establish acceptance of that art.

## Validation

43 native checks pass with the installed private pack in Forward+, and 38 portable checks pass with fallback actors in Compatibility. They cover visitor placement off beds/door pads, real conversations, service/exit priority, healing and outdoor return, wide roof-edge occlusion, unrelated buildings staying opaque, the actual inn cutaway/restoration, a nearby NPC being protected when the player is already visible, Pidgey's actual private front frame and no checkpoint writes. Existing actor (328), opening (55) and Thornwood destination (51) suites pass. Native private/fallback captures were inspected, including populated interiors, behind-inn visibility and real versus fallback Pidgey. All 28 repository suites pass, including Wildbond 26,976 / 0, Starfall 488 / 0, 23 unchanged save names and 21 agent-context checks.

Run from the repository root:

```text
Godot --headless --path wildbond-godot --script res://tests/opening/centers_checks.gd [-- --private]
Godot --path wildbond-godot --rendering-method forward_plus --script res://tests/opening/centers_checks.gd -- --private --capture EXTERNAL_PRIVATE_OUTPUT
Godot --path wildbond-godot --rendering-method gl_compatibility --script res://tests/opening/centers_checks.gd -- --capture FALLBACK_OUTPUT
```

All test saves are disabled or process-isolated; no real player profile was opened. Human play feel, physical-phone framing and low-end performance remain unverified.

## Layout acceptance for future maps

- Give healing spaces staff and a few travelers with a visible reason to be there. Use suitable complete private NPC sprites at the player trainer's quality bar, with believable facing and modest movement.
- Keep door thresholds, service approaches and main travel paths free; place conversations beside the route rather than over it.
- Walk behind every building, test wide roof edges and nearby people from the actual game camera, and restore opacity after leaving. Visibility cutaways do not excuse an obstructive layout.
- Inspect day/night and indoor framing with the real sprite pack. Label fallback-only screenshots clearly; do not present generic creatures as completed Pokemon art.

Portable evidence only: [healing room](captures/healing-room.png), [behind the inn](captures/behind-inn.png), [inn plaza](captures/inn-plaza.png), [Gate Loft visitor](captures/gate-loft-visitor.png), [Gate Loft room](captures/gate-loft-room.png), [explicit TEST ART battle](captures/pidgey-art.png).
