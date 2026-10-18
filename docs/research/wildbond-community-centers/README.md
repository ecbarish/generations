# Larger community centers

Codex / root for Evan, Lane A, WB-COMMUNITY-CENTERS. PR #568 (`codex/wildbond-community-centers`) stacks on #567. Source review only, not merged/exported/published.

## Playable change

Healing Inn and Gate Loft now share an 18 by 12.5 room, compared with the previous 10 by 8: about 2.8 times the floor area. A broad central hall leads from the entrance to the healing reception desk. One wing has a rest bed, waiting bench and local noticeboard; the other has a communal table with cups and a map, seating and a working partner-storage terminal. Four approachable visitors and the nurse use existing complete private Pokemon NPC roles. Conversations explain rest and gathering; the noticeboard gives local travel advice. No new mystery clue, quest, named-cast relocation or active sprite-pack change is introduced.

The terminal opens the existing party-storage system, preserving all of its capacity, party and starter rules. Reception still restores HP, PP and status. Furniture and room edges have collision; the entrance, service aisle, both side wings, noticeboard, terminal and all visitors are reachable. Only the central front pad offers Leave, so walking into a lounge does not accidentally exit. Low furnishings and a fixed whole-room camera keep people and services in sight; all five heads are checked against actual viewport/HUD bounds. The exterior door footprints and previous building cutaways remain intact.

Interior saves continue to record the actual outdoor doorstep. There is no profile/schema/filename change. Current party identity, wallet and local healing flags survive entering, saving, exiting and reopening. The larger room does not add overnight lodging, food purchases, multiplayer, a new quest board or bed mechanics: the rest and gathering furnishings establish the community setting, while healing and storage are the existing useful services.

## Evidence

80 focused community checks pass in native Forward+ with the private sprite pack and Compatibility with portable fallback actors. Tests walk the real player around furniture to reception, both wings, notices, storage, four conversations and the exit in both towns. They activate the interactions, verify full healing, save/reopen each outdoor return, preserve creature identity/wallet, check camera/HUD framing, collision and boundaries. Existing suites pass: opening 55, Thornwood 51, actors 328 and populated-center/sight-line 49. All 28 repository suites also pass, including Wildbond 26,976 / 0, Starfall 488 / 0, unchanged save names and agent-context checks. Eight local links resolve. The original opening test's old exit position was updated to the expanded room's real entry pad; its return/Maren/save assertions remain intact.

Private native captures were inspected for whole-room layout, people, sight lines, local notices and the storage menu. They stay outside the repository in Evan's `wildbond-community-centers-private` evidence directory. The report's linked captures use fallback figures only and are not the visual-acceptance art. No real player profile was opened. Human fun, phone framing and low-end performance remain unverified.

```text
Godot --headless --path wildbond-godot --script res://tests/opening/community_checks.gd [-- --private]
Godot --path wildbond-godot --rendering-method forward_plus --script res://tests/opening/community_checks.gd -- --private --capture EXTERNAL_PRIVATE_OUTPUT
Godot --path wildbond-godot --rendering-method gl_compatibility --script res://tests/opening/community_checks.gd -- --capture FALLBACK_OUTPUT
```

Portable fallback-only evidence: [whole room](captures/community-room.png), [Gate Loft](captures/gate-loft-community.png), [local notices](captures/local-notices.png), [partner storage](captures/partner-storage.png).

## Continue from here

The larger centers are the requested direction for future towns: spaces where people and partners can recover, gather and share practical advice. Give each town its own social purpose and layout when it is measured; this shared native prefab is the current two-town implementation. Keep clear approaches and low foreground furnishings, use complete suitable NPC art, and inspect the real game camera before adding more decoration. Production data, regional graph, other rooms, exterior building footprints and public export remain unchanged.
