# Feedback, bugs and suggestions

**For testers:** open https://github.com/ecbarish/idle-arcade/issues/new/choose and pick *Playtest feedback*,
*Bug report* or *Suggestion*. (A free GitHub account is needed. Testers without one can send Evan notes any way they
like; Evan, or an assistant, files them as issues.) In a game, **⚙ Settings → Tell us** (and the Feedback button in
many top bars) opens the right form with the game, version and place already filled in (F2, AR2.11; `shared/feedback.js`).
A ten-minute playtest script is on Come Play (`playtest.html#script`). Little Ranch has no Tell us on purpose: it is a
toddler toy with no links out. A new game joins by calling `setupFeedback(...)` or `Feedback.register(...)` and adding
its name to the `game` dropdown in `.github/ISSUE_TEMPLATE/*.yml` (the prefill only works for names in that list).

**For assistants:** at the start of a session, check the open issues (`gh issue list` or the Issues tab). Bugs go
first (fix, reply with what changed, close). Feedback becomes small polish tasks or notes in the design docs.
Suggestions: small ones can become projects in `docs/PROJECTS.md` (credit the person); big ones get a proposal in
`docs/proposals/` for Evan. Label what you've triaged.
