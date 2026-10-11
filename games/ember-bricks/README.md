# Ember Bricks

AC3: an original frontier cabinet, in the shape of the brick-and-paddle games. The commons kiln has gone patchy. A coal has to stay in the air, off a baker's peel, until every brick is glowing. The darker bricks in the hearth course take two hits. A coal that falls past the peel costs a life. Lighting a brick scores 10 at the bottom row and 10 more for each row above it. A cracked hearth brick pays half, then the rest when it lights. Filling the wall pays 200, and the next firing is faster. A life comes back every second clear, up to three. When the lives run out, the turn ends. Two players each take a whole turn.

Arrows or A/D move the peel. Space or W sends the coal. P pauses. On-screen buttons move and send. Tap the coal to send it, or tap the side the peel should move toward. A standard USB gamepad moves with the left stick or D-pad, sends with A, and Start pauses. The title screen runs a demonstration; it never saves scores. Finished runs enter three initials on a five-entry local board (`ember-bricks-save-v1`). Runs themselves are not saved.

Built like the other cabinets: shared arcade sound, text size and reduced-motion settings, optional scanlines. Art and tune are original code; no third-party assets. Does not read or change other games' saves. Brisket's Crossing is a separate cabinet.

Checks: `node tools/ember-model-checks.cjs` and `node tools/run-all-checks.cjs ember-bricks`. Draft [pull request #185](https://github.com/ecbarish/idle-arcade/pull/185). Not merged.
