# Brisket's Crossing

AC3: an original frontier cabinet, in the shape of the road-and-river crossing games. Pell's mule Brisket carries lanterns from the near bank to five posts on the far bank. Wagon roads run one way or the other; a cart that touches Brisket costs a life. The river only holds logs, and a log carries whoever stands on it. Open water, a hedge between the posts, or a post that already has its lantern also costs a life. Each step toward the far bank scores 10. A delivery scores 100 plus the time left on the lantern clock. Filling every post clears the run, pays 200, and the next run is faster. A life comes back every second clear, up to three. When the clock or the lives run out, the turn ends. Two players each take a whole turn.

Arrows or W/A/S/D hop. Space hops toward the lanterns. P pauses. On-screen buttons hop. Tap the screen on the side Brisket should move. A standard USB gamepad hops with the left stick or D-pad, hops forward with A, and Start pauses. The title screen runs a demonstration; it never saves scores. Finished runs enter three initials on a five-entry local board (`briskets-crossing-save-v1`). Runs themselves are not saved.

Built like the other cabinets: shared arcade sound, text size and reduced-motion settings, optional scanlines. Art and tune are original code; no third-party assets. Does not read or change other games' saves. Ember Bricks is the next cabinet, not this one.

Checks: `node tools/brisket-model-checks.cjs` and `node tools/run-all-checks.cjs briskets-crossing`. The issue forms quote the cabinet name so the apostrophe stays intact.

## v0.1.1

A hit gives Brisket a three-quarter-second recovery beat. Release held movement before hopping again; the lantern clock waits too. Space or any arrow starts from Get ready. Brisket is drawn 50% larger, with the same collision rules. High-score save format unchanged.

Responsive follow-up: the world fills its cabinet while mule/detail proportions stay uniform. Recovery/release guidance is readable at 16–20 CSS pixels; logical movement, collision widths, recovery and score saves are unchanged.


## v0.1.2: easier opening (AC3.2)

The first crossings give Brisket wider wagon gaps, wider logs and more time. The first step starts in a clear gap; later runs return to the original challenge from run 4. Old scores and controls are unchanged. [Measurements and phone review](../../docs/playtests/brisket-ac3-2/README.md).
