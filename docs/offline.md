# Install and offline play (L5)

One installable arcade starts at the hub and includes Primordial, Starfall Guild, Realmbound and Wildbond. Visit
the hub online and wait for **Ready for offline play** before disconnecting. Use **Install arcade** when the
browser offers it, or its install / Add to Home Screen menu. Installation is optional; offline browser tabs work too.
HTTPS is needed on a hosted site; localhost works for development. The manifest and worker paths are relative,
including GitHub Pages' `/generations/` scope. The cabinet icon is original procedural artwork.

The hub prepares one complete release of local pages, scripts and styles. Dependencies come from those pages,
so a newly split script is picked up automatically. Credits and license links are followed when present. Tests,
Studio and arbitrary links are excluded. External Google fonts use system fallbacks offline. Wildbond's external
three.js library is not cached: a fresh offline Diorama session falls back to the existing HD-2D renderer.

No saves, hub progress, sound choices or other localStorage keys are changed by installation. Saves still belong
to the same browser profile and origin. There is no account, cloud sync or cross-device transfer in this feature.

## Updates (online first)

Nothing to do at release. With internet, the worker asks the site for every page, script and style first (past the
browser's HTTP cache) and keeps a copy of each good answer, so a new release shows up on the next reload, the same as
without the worker. Without internet, or when an answer takes longer than 4 seconds, the kept copy is used (a slow
answer still refreshes it for next time). The hub prepares a complete copy of all four games on its first visit, so
they work offline even before you have opened them. A new worker takes over at once; that is safe because it never
pins old files while you are online. `CACHE_VERSION` only changes if the worker's own storage format changes.

Claude changed this on 2026-10-07 from Codex's first design (cache first, bump `CACHE_VERSION` on every release,
update only after every tab closes): with several assistants pushing many times a day, one forgotten bump would have
left players on an old version without anyone noticing.

## Checks

Run `serve.ps1`, open `tests/offline.html` and click **Run checks**. The page runs the real worker source
against isolated memory fixtures, without registering it or changing browser caches or saves. Also run the four
existing game/sound pages. Actual worker integration was checked in a fresh Chrome profile: all four games offline,
the GitHub Pages subpath, directory/query navigation, a waiting update, activation and a deliberately failed update.
Hub layouts were checked at 375, 1366, 1920 and 3440 px. Browser-managed native installation was not automated.

Lifecycle references: [MDN service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers),
[service worker lifecycle](https://web.dev/articles/service-worker-lifecycle).
