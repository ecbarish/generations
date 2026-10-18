# Stand with it: Wildbond's Mega-style transformations

Direction recorded from Evan on 2026-10-18. This replaces the old hidden near-defeat activation direction for future implementation. It does not claim the current chapter has transformations.

## What Evan chose, and what remains proposed

**User direction:** make Stand with it Wildbond's signature through Mega Evolutions; reuse existing forms where useful, design forms for creatures without them over time, and use clear trigger points instead of demanding a contrived battle state. Keep the original world, story and bond identity.

**Recommended implementation defaults, not separately approved tuning:** a guaranteed main-story awakening, followed by deliberate player activation once per battle for one eligible partner. Temporary creature transformation lasts until battle end or fainting; switching preserves that individual's form and does not refund the activation. No low-HP, last-survivor, maximum-friendship, opponent-level or real-day condition. No species-stone scavenger hunt in the first implementation. Other pacing/limits can be tuned after playtesting. These are Wildbond rules, not a claim of cartridge parity.

A signature system does not require hundreds of new forms. Reuse a small supported existing Mega first; add a few distinctive original/custom forms once the whole activation/reversion loop is enjoyable. Long-term design eligibility does not make every owned species immediately transformable. Original starters keep their approved identities and normal evolution lines; final forms/evolution readiness must be settled before choosing their Mega designs.

## Approved coverage policy (Evan, 2026-10-18)

Evan accepted selective coverage rather than a form for every species. Guarantee a signature transformation for the fully evolved lines of Mosshog, Ripplet and Cindercub once their ordinary final evolutions are settled and implemented. This is a design coverage commitment, not permission to transform unevolved starters immediately or invent their final designs.

Prioritize existing official Megas as their base species become supported; standout Wildbond originals and important story partners; selected strong Pokemon/favorites with a compelling design opportunity; and a few overlooked creatures that gain a useful niche. Bogsnap's eventual final evolution is a candidate, with its evolutionary placement still unresolved. Not every strong creature is automatically promised a form.

Ordinary creatures must remain useful. The goal is that players can build varied teams with a transformation they are excited about, not that only transformed partners matter. Ship one excellent complete transformation before expanding the set; no universal-roster art project or fixed form-count target is approved.

## Reliable first awakening

Separate **unlocking the ability** from **activating it in a battle**.

1. The player reaches a mandatory story milestone. Preserve the existing fourth-badge progression boundary as the initial placement recommendation; exact event/location and any earlier introduction remain open story-design choices, not approved new canon.
2. An authored bond encounter offers a healthy compatible partner and a clear Stand with it prompt at a fixed event beat. Do not force allies to faint, inflict artificial low HP, demand hidden grinding or punish someone who arrived overleveled. The moment comes from the story, not manipulated damage arithmetic.
3. The player chooses when to confirm. Declining leaves the event available. Losing/reloading permits a safe retry. Skipping the presentation still records completion and explains the new command. The event is not missable and does not require one particular starter or party order.
4. If the current team lacks a ready form, offer an explicitly temporary, clearly identified demonstration partner, or defer the demonstration safely while keeping the unlock obtainable. Never rewrite the player's creature into another species or grant an unearned permanent party member. The first shipped milestone must have at least one complete compatible option.
5. Save the permanent unlock once through the normal story checkpoint. Existing saves past the milestone need a visible catch-up scene/notification at a reachable hub, not a forced replay or reset. Do not add profile fields or migrations in this planning PR.

The old first Wildbond is also tied to late depth/first-person restoration. Preserve that story boundary while placing the awakening. A development preview's modern renderer is not permission to restore the world early. Mega-style combat forms and world visual-era milestones are separate systems.

## Repeat activation after unlocking

Show a readable **Stand with it** toggle beside a selected move for a living, eligible active partner. Explain unavailable cases plainly (not unlocked, this partner has no supported form, already used this battle). Keep Run/Bag/party actions intact; do not replace Run with a hidden opportunity. Confirmation queues the transformation before that partner's selected move, without a separate free extra turn. Invalid/canceled choices do not spend the activation.

One team activation per battle, attached to a stable individual ID. It cannot transfer to a second partner after switching, fainting or reviving. No automatic HP/PP/status restoration and no multiplying already transformed stats on repeated presses. Recommended first pass keeps max HP unchanged, transforms supported non-HP stats/types through one battle-local overlay, and reverts on battle end/fainting. Party/storage retain the base species, level, XP, moves/PP, condition and individual identity. Ordinary evolution stays permanent and separate.

Balance around that visible choice: later important opponents can have one declared transformation too, and encounters should remain winnable with varied teams. Do not balance the entire game around intentionally taking damage, preserving a real-day charge or carrying one specific creature. Do not promise a recharge meter, three-turn mode, per-area restrictions or all-species roster in the first build.

## Audit: old implementation versus the current chapter

| Source | What it actually does |
| --- | --- |
| [Legacy battle](../../../wildbond-godot/scripts/battle.gd), `can_join`, `_join`, `JOIN_TIME` | Last surviving ally, maximum bond, HP at or below 30%, qualifying opponent, 14 battle-seconds of joining; the Run slot becomes Stand with it. It heals/clears status as part of joining. This is the older combat engine. |
| [Legacy main](../../../wildbond-godot/scripts/main.gd), `battle.bond_ok`, `bond_day`, `BOND_BADGES` | Four-badge boundary, demo exclusion and once-per-real-day save state. Existing saved `bondDay` must be preserved when a later production migration replaces its gating purpose. |
| [Old proposal section 5](../../proposals/creature-catalogue-and-evolution.md#5-the-wild-bond-fusing-with-a-creature-evans-idea-2026-10-08) and [writer ledger](../../lore/wildbond-threads.md#2-the-wild-bond) | Historical desperation/fusion presentation. This new user direction supersedes activation constraints. Existing witnesses/final truth are not silently rewritten; audit literal fusion wording before writing new scenes. |
| [Native chapter](../../../wildbond-godot/tests/opening/README.md) | Six supported species, bounded turn-based rules and actual original starters. It has no Mega forms, full evolution, abilities, held-item system or full bond/story integration. Production joining code is not a drop-in turn-based transformation implementation. |
| [Private library](../../research/wildbond-private-library/README.md) | Broad base-species battle/world art. Mega/regional/other variants were explicitly excluded. Do not report Mega sprites as already imported or ready. |

Pokémon's classic temporary, one-per-battle Mega Evolution is a useful reference; its Key Stone / species-specific Mega Stone requirements are not automatically Wildbond's unlock rules. See [official Let's Go overview](https://www.pokemon.com/us/pokemon-video-games/pokemon-lets-go-pikachu-and-pokemon-lets-go-eevee) and [official battle explanation](https://www.pokemon.com/us/strategy/prepare-for-battle-in-pokemon-lets-go-pikachu-or-pokemon-lets-go-eevee). Exact Mega rosters change; verify a species' current official form status before calling a design original. Existing official art and custom variants keep explicit private provenance boundaries.

## Data and asset contract to implement next

Keep base identities such as `pokemon:...` and `wildbond:...`. Add a separate stable form ID referencing the base species; never save a temporary form as a captured species or an ordinary evolution result. Each definition needs origin (official Mega / Wildbond custom / original species), supported stat/type/ability changes, eligibility, art references, credits/provenance and separate data/art/runtime readiness flags. Leave unsupported or incomplete forms unavailable with a plain reason.

Battle front/back art and a short transformation effect are required for a first form. A battle-only temporary form need not have a complete overworld walk cycle. Reuse proven private art where present, validate actual dimensions/anchors and keep it outside distributed source. The private importer needs explicit variant IDs and verification; National Dex base IDs alone cannot select Mega variants. Do not mass-generate designs or alias a base sprite as a completed Mega.

## Incremental implementation and acceptance

1. Reconcile the supported final base species/evolution, obtain one complete existing Mega form privately and verify its bounded data needs. A dependency readiness check precedes choosing the first demo partner. No roster expansion is assumed in this plan.
2. Implement a small battle-local form adapter and move-selection UI on the native turn-based engine. Use an isolated fixture to test preview, confirmation, repeated presses, switching, fainting, reviving and reversion. HP/PP/status cannot refill or duplicate, and unsupported abilities must not be silently ignored.
3. Implement the reliable story/catch-up unlock with versioned, independently backed-up saves; test old, future, interrupted and already-completed records. Author the scene only after reconciling its existing depth/fusion lore obligations. This is a required integration step, not a new disconnected game demo.
4. Verify live encounters/trainer rosters, one activation per side and battle-end/defeat/quit/reload cleanup. Our chapter currently commits outcomes on Return; a transformed overlay must not leak into the pre-battle checkpoint or party/storage records.
5. Play the complete first awakening and a later ordinary fight. Only then add one custom Mega for a suitable species without an existing one, or an original final evolution, at the same art/balance quality.

Target outcomes: the first awakening works with a healthy full party; normal play reaches it without grinding or strategic losses; the player understands when Stand with it is available; a repeat activation changes exactly one eligible partner and reliably ends without corrupting their saved identity.
