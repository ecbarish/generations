# Party summaries for the native chapter

WB-PARTY-SUMMARY · Codex / Evan · 2026-10-18.

Claimed under Evan's request to continue the playable Pokemon chapter. Stacks on #556. Add a readable, in-game party summary showing current HP/status, types, calculated stats, supported moves/PP and level progress, while retaining the existing lead/storage actions. Reuse existing catalogue and optional private sprites; no new assets, story, mechanics or save fields.

Owned paths: this report, opening summary UI/check/capture scripts, opening scene integration, opening README and README changelog. Done when keyboard/pointer access works, values reflect actual battle records, six-member party navigation fits, existing actions/saves remain valid, native captures are inspected and repository checks pass. Public evidence must use fallback artwork; imported-art captures stay external.

## Implemented

Select a partner in Menu → Party to open a full in-game summary. It shows calculated Attack, Defense, Special Attack, Special Defense and Speed, correctly capitalised types, current HP and condition, and experience remaining with a progress bar. At level 100 it displays Maximum level. Installed private battle fronts supply portraits; absent packs use a text fallback without downloading artwork.

Each supported move shows current/max PP. Selecting it reveals its type, physical/special/status category, base power, accuracy and actual supported effect. Exhausted moves remain inspectable. Previous/Next wraps through up to six partners; Back restores the party list and menu. Keyboard focus and pointer input both work. Lead/Store reuse existing chapter actions and prevent leading with a fainted partner or storing the last healthy partner. World movement pauses while inspecting the summary. Browsing does not mutate party records.

No species, move, battle, story or save schema changes. The existing separate chapter writer and original adventure isolation remain intact. This does not add abilities, evolution, move forgetting or the rest of the regional roster. It remains native/export-excluded and is not published.

## Verification

The focused suite passes **88 checks**, including catalogue values at levels 1/5/12/36/100, partial experience, faint/burn display, depleted PP, support effects, keyboard opening, pointer move selection, all controls within the panel, paused walking, six-partner navigation/wrapping, record immutability, Lead/Store restrictions and actions, Escape/Back and an existing-schema save/reopen. Fixtures use only a process-specific profile and remove it; captures never use the player's profile.

Forward+ with public fallback and Compatibility with installed private portraits both pass all 88 checks and were visually inspected. [Public fallback capture](captures/party-summary.png) contains no imported Pokémon art. Actual private evidence is external at `C:/Users/evanb/AppData/Local/Temp/wildbond-summary-private/party-summary.png`. The connected opening's existing 50 checks also pass in private mode. Full aggregate verification is recorded at handoff; human feel and mobile acceptance remain unverified.

Commands from repository root:

```text
Godot --headless --path wildbond-godot --script res://tests/opening/summary_checks.gd [-- --private]
Godot --path wildbond-godot --rendering-method forward_plus --script res://tests/opening/summary_checks.gd -- --capture ABSOLUTE_OUTPUT
Godot --path wildbond-godot --rendering-method gl_compatibility --script res://tests/opening/summary_checks.gd -- --private --capture ABSOLUTE_EXTERNAL_OUTPUT
```

Next gameplay expansion should extend the connected Thornwood expedition using the measured regional plan, with a return loop and meaningful reward. Independent review remains separate from local implementation.
