# Brisket's Crossing

AC3: an original frontier cabinet, in the shape of the road-and-river crossing games. Pell's mule Brisket carries lanterns from the near bank to five posts on the far bank. Wagon roads run one way or the other; a cart that touches Brisket costs a life. The river only holds logs, and a log carries whoever stands on it. Open water, a hedge between the posts, or a post that already has its lantern also costs a life. Each step toward the far bank scores 10. A delivery scores 100 plus the time left on the lantern clock. Filling every post clears the run, pays 200, and the next run is faster. A life comes back every second clear, up to three. When the clock or the lives run out, the turn ends. Two players each take a whole turn.

Arrows or W/A/S/D hop. Space hops toward the lanterns. P pauses. On-screen buttons hop. Tap the screen on the side Brisket should move. A standard USB gamepad hops with the left stick or D-pad, hops forward with A, and Start pauses. The title screen runs a demonstration; it never saves scores. Finished runs enter three initials on a five-entry local board (`briskets-crossing-save-v1`). Runs themselves are not saved.

Built like the other cabinets: shared arcade sound, text size and reduced-motion settings, optional scanlines. Art and tune are original code; no third-party assets. Does not read or change other games' saves. Ember Bricks is the next cabinet, not this one.

Checks: `node tools/brisket-model-checks.cjs` and `node tools/run-all-checks.cjs briskets-crossing`. The branch includes main through the SF2.6 follow-ups (#165 and #166) and Lighthouse Watch v0.1.1. The issue forms quote the cabinet name so the apostrophe stays intact.
