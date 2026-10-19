# Unsaved native Mosshog cleanup comparison

[Report, controls, provenance and review boundaries](../../../docs/art/mosshog-cleanup/README.md).

Launch play.tscn with the Wildbond Godot project or use Play Clean Mosshog.bat. C compares original/clean art. This preview never writes player saves or adds evolved runtime identities.

The baseline and assets folders retain before/after atlas PNGs, measured manifests and editable workbench sessions. frames.json combines the final four appearances for the workbench. Dedicated checks: Godot --path wildbond-godot --script res://tests/mosshog_clean/checks.gd -- --private. Use an external absolute --capture folder for private screenshots.
