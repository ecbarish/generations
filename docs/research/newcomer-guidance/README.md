# ONBOARD-KIT1: a small shared browser guidance kit

## Contract

`shared/onboarding.js` exposes `ArcadeOnboarding.create({element,onDismiss,onAction,onInputChange})`.
The returned controller has `update(modelOrNull)`, `getInputMode()` and idempotent `destroy()`.
A model contains `id`, `title`, `goal`, `text`, `inputs: {keyboard,touch}`, optional
`orientation: {portrait,landscape}`, `actions: [{id,label}]`, and optional `dismissLabel`.
Empty content is hidden. Content is text, never HTML. Action IDs are passed back to the game.

The presenter does not read saves, choose goals, progress a quest, pause gameplay, capture movement,
create an overlay, or install a global shortcut. It observes the latest real keyboard/pointer input
and window resizing, and renders in the element the consumer already owns. Coarse pointer is an
initial default only. Touch or pen selects touch advice; mouse or keyboard selects keyboard advice.
Repeated updates reuse buttons so normal refreshes do not steal focus. Destroy removes its listeners.
Consumers are responsible for focus after dismissal and for any scrolling/container placement.

`shared/onboarding.css` provides flow layout, wrapping and 44-pixel minimum button height. Games
supply their own palette. No orientation is required; the consumer supplies optional advice.
This is browser reuse, not a shared Godot system or an engine abstraction.

## Realmbound adapter

`games/realmbound/js/26-onboarding.js` retains `roadHint()`, every existing hint ID/text and all
existing arrival/dismissal/reset/save behavior. The adapter supplies short next steps and input hints,
then delegates rendering to the shared presenter in the existing Road note notebook. The existing
Road note dock button shows the short next step while guidance is available. There is no new
world-space overlay or menu. Quest/Satchel actions use the existing notebook routing.

Heroes without onboarding state still get no unsolicited guidance. Road help remains the explicit
opt-in/reset. Existing arrival replay, `onboarding.hints` and `realmbound-save-v1` stay authoritative.
The presenter has no persistence API and does not add a save field or key.

`tests/onboarding-reference.html` is a second, neutral consumer with in-memory state, two sample
goals and callbacks. It does not adapt another production game or write any storage.

## Verification

- `node --check shared/onboarding.js` and `node --check games/realmbound/js/26-onboarding.js`
- `node tools/run-all-checks.cjs`: unchanged current aggregate, including all existing Realmbound
  arrival, migration, quest, UI and regression checks.
- `node tests/onboarding-browser.cjs . <evidence-directory>`: focused actual Chromium keyboard/touch,
  layout, rotation, large-text, dismissal, repeated opening, saved/legacy progress, fixture and lifecycle checks.
- Additive `Onboarding kit review` Actions workflow retains screenshots and a machine-readable report.

Evidence/results will be recorded after the final implementation passes. Local Chromium launch failed
in the cloud sandbox; Actions must supply actual browser evidence. Automated checks are not a fresh
newcomer playtest or evidence of human enjoyment. No merge or publication has been approved.
