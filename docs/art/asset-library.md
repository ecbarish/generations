# One reusable asset library

**Evan, 2026-10-13:** use the same asset library consistently; improve or replace the wheel rather than rebuilding it each time.

The first registry is [shared/assets/catalog.json](../../shared/assets/catalog.json). [Browse it here](library.html). It registers existing resources in place: it does not duplicate PNGs/GLBs or replace game loaders. New Starfall references sit beside the already licensed Realmbound-trial body, clothing, hair and animation resources, existing equipment factories and game palettes.

## The reusable identity

An **asset ID** is the stable handle. Its **representation** points to today's PNG, GLB, palette or code factory and records a revision and source hash. A future better model replaces that representation or adds another, while the game keeps the same asset ID and documented contract. If its skeleton, collision footprint or attachment meanings change incompatibly, give it a new contract/version and migrate deliberately; never silently substitute a different rig.

Keep these identities separate:

- **Asset:** the reusable body, garment, weapon, prop, material or animation.
- **Character/species:** the game's individual, story and save identity.
- **Equipment:** the gameplay item and stats, mapped to a visible asset by the game's adapter.
- **Style variant:** the game's palette/material treatment of the reusable part.

Sharing a body, rig, boot or sword does not make Starfall and Realmbound the same world. Use game-specific palettes, costumes and wear while preserving the same geometry/attachment conventions where compatible. Do not rebuild a torso because a second game wants another shirt.

## States that another agent can trust

| State | Meaning |
|---|---|
| `reference` | A design image/brief. No mesh, rig, animation or shipping clearance implied. |
| `prototype` | An existing usable experiment component, with stated engine/rig limits; not accepted for all games. |
| `production` | Rights verified, compatibility contract documented and acceptance evidence recorded. |

Rights are a separate field. Generated references are `unverified`, not CC0. Existing Quaternius resources retain their local CC0 notice. A production label requires both clearance and actual acceptance evidence. The registry check rejects missing files, duplicate IDs, changed unrecorded source hashes, unsafe paths, missing dependencies and unsupported production claims.

## Shared character/equipment contract

Reuse the existing Realmbound trial's contract as the starting point, rather than creating another incompatible character system. It defines metre scale, ground-zero feet, a documented forward axis, named attachment points and item-slot visual IDs in [realmbound-assets.md](../proposals/realmbound-assets.md).

For a reusable body/rig packet, record:

- Source skeleton and the adapter's aliases for head, chest, hips, shoulders, hands and feet.
- Rest pose, unit/axis convention, ground pivot and compatible animation clips.
- Garment binding, shoulder articulation and allowed body-proportion adjustments.
- Held versus stowed weapon mounts and clearances during idle, walking, turning and interaction.
- Front, profile and rear acceptance captures, including mixed equipment and removed items.

The current Quaternius experiment is an existing **prototype**, not a promise of automatic compatibility with every Godot character. Its CC0 animation/body/outfit resources can be reused after matching skeletons and attachments. The registry records that limitation instead of inventing a universal rig.

Existing `gear/chest/mail`, `gear/weapon/sword` and `gear/offhand/shield` identities are kept from the trial's equipment factory. New models should preserve the descriptor contract through a loader adapter. No current game loader was changed in this library foundation.

## Add or replace an asset

1. Search the registry by role, category and tags before making another resource.
2. Reuse or adapt an existing compatible asset. If its contract is insufficient, document why.
3. Register the original source, rights, applicable games, representations and dependencies.
4. When replacing a representation, update its hash/revision and preserve the asset ID if the contract still holds.
5. Run `node tools/check-asset-library.cjs`; review the actual asset at intended camera/scale and record evidence before upgrading its state.

Keep provider prompts/job IDs beside generated sources and credit outside assets. Current Wildbond work awaiting review in PR #277 stays in that PR; do not copy its unmerged files into another game just to fill this registry. Register it after merging or reference its PR explicitly in a future intake entry.

## Next production step

Prove one common adult body and a fitted travel kit across the existing Realmbound experiment and a separate Starfall import test. Preserve their different palettes. Confirm skeleton/animation compatibility and garment fit before moving game loaders to the registry. Then add clothing, tools and props through the same library, rather than repeatedly creating whole replacement people.
