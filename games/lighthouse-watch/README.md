# Lighthouse Watch

AC2: an original Saltmarsh lighthouse cabinet, in the shape of the 1980 missile-defence games. Storm sparks fall from the clouds toward four harbour boats. Aim the lighthouse beam and fire: the beam travels to the aim and bursts, and any spark inside the burst pops for 25 points. Each boat still afloat at dawn scores 100. Nights get faster and busier, sparks start splitting in two from night 3, and a lost boat is rebuilt every third night. Up to three beams or bursts at once. When all four boats sink, the turn ends; two-player mode gives each player a complete turn and an independent score.

Tap or click the sky to fire there. Arrows or W/A/S/D aim, Space fires, P pauses. On-screen buttons aim and fire. A standard USB gamepad aims with the left stick or D-pad, fires with A or the right trigger, and Start pauses. The title screen runs a demonstration; it never saves scores. Finished runs enter three initials on a five-entry local board (`lighthouse-watch-save-v1`). Runs themselves are not saved.

Built like Storm Front (AC1): same cabinet layout, shared arcade sound, text size and reduced-motion settings, optional scanlines. Art and tune are original code; no third-party assets. Does not read or change other games' saves.

Checks: `node tools/run-all-checks.cjs lighthouse-watch` (tests/lighthouse-watch.html): real controls, tap-to-fire, scoring, turns, score saving, phone and desktop layouts, gamepad.

## Changelog

- v0.1.1 (2026-10-10, AC2.1): the harbour keeps its proportions on rectangular screens; taps match the fitted sky after resize and rotation. Cabinet margins ignore taps. Verified pause/controls and unchanged v1 scores; 87 checks and nine touch/DPR cases. [Before/after evidence](../../docs/playtests/lighthouse-watch-display/README.md).
