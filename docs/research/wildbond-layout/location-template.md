# Location brief — fill before building

## Identity and place in the region

- Existing map ID and name:
- Region, terrain and purpose:
- Regional graph source / linked node IDs:
- Current connections, with source and destination landing positions:
- Planned connections, clearly separated from implemented exits:
- Return loop / shortcut and its exact unlock:
- What can the player see before they can reach it?

## Preserve

- Existing door roles, quest triggers, NPCs, items and save-coordinate meaning:
- Required world-scale/door/follower rules:
- Story clues already present (link the lore ledger; do not invent new clues here):

## Local layout

- Measured grid, tile/world scale and north direction:
- Building footprints, doors, clear waiting pads and service approaches:
- Roads, optional paths, water, height changes and collision:
- Main landmark visible on arrival:
- Safe route versus encounter patches:
- NPC/item anchors and event trigger footprints:
- Reserved future exit pads; leave unresolved destination landings null:

## Walking check before art

- Can a newcomer identify the route, service and return path?
- Can the trainer and largest allowed partner fit all paths/doors?
- Are entrances, exits and services reachable with current progression?
- Do optional gates keep their intended requirements?
- Do camera occlusion and distances feel good during actual held-key walking?
- Record measured movement-only distances separately from playtime estimates.

## Art reference after layout

- Approved palette, building silhouettes, materials, lighting and biome:
- Reusable asset sources and rights:
- Generate one reference from the measured plan; record prompt and provenance.
- List reference-image deviations. The grid and graph govern topology/collision.
- Keep the same geography through Pocket, Pixel, HD-2D and 3D presentation tiers.

## Integration and acceptance

- Source-of-truth data path and version:
- Feature owner and owned implementation paths:
- Save migration / old-coordinate compatibility strategy:
- Door/exit landings verified against the destination's actual grid:
- NPC/quest/encounter checks and first-visit walkthrough:
- Screenshots, performance targets and browser/mobile validation where applicable:
- Independent art/play review; PR/release state tracked separately:
