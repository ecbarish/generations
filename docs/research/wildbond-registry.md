# WB-REGISTRY: validated species registry

Claimed by Codex for Evan on 2026-10-17, following the explicit request to continue the Wildbond implementation plan in #543.

Scope: a read-only legacy-data adapter, stable namespaced IDs and transactional validation for additional species definitions, with meaningful Godot checks against all 189 existing species. Existing combat, startup, saves, art and exports stay unchanged. The module will be integration-ready; it will not compete with #491's main/battle/input work or #475's art/export work.

Owned paths: `wildbond-godot/scripts/species_registry.gd`, `wildbond-godot/tests/species_registry.gd`, its call in `tests/run_tests.gd`, this report, the Godot README changelog and project/session bookkeeping.

No private sprites, copied Pokémon data, runtime pack picker, battle replacement or save migration in this increment. Validation results follow before handoff.
