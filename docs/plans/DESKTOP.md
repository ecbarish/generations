# Tonight's desktop pickup

Prepared 2026-10-06. Start with source continuity and saves, then choose one next feature. There is no game build step and no need to buy an engine or set up VR.

## What Codex needs from Evan

| Needed | What to provide/do | Why |
|---|---|---|
| The actual project folder | Open the checkout in the desktop coding app and start the assistant session there; provide its folder path and current branch | A signed-in browser does not automatically give a remote assistant access to local PC files |
| Claude's latest work | Bring over any unpushed branch/files and the latest handoff notes; report what was last merged | Avoid replacing newer Wildbond/pacing work with our older review baseline |
| Publishing access | Use Git authenticated on the desktop or your already-installed GitHub client; verify a feature branch can be pushed | This session's terminal could read GitHub but not push; do not paste passwords or tokens into chat |
| Progress to preserve | Export the saves you care about from their current browser/site before importing or clearing anything | Git tracks source, not browser progress; localhost and GitHub Pages have different saves |
| One next choice | Pick the next active feature; confirm any change to the parked-games priority | Planning six projects does not mean building six concurrently |
| Control preference | Say whether full Auto must be available immediately or may be unlocked through progression | Existing manual-specific unlocks need an explicit decision |
| Sports preference | Pick the sport after baseball, and whether home/car benefits should be mostly personal collection or also bounded gameplay effects | Makes the contract/lifestyle prototype concrete |

Device target is already clear: desktop and phone. Confirm the browser you use on each and whether you normally play with the phone folded or unfolded/landscape. We do not need a headset. Session length/tone choices for Primordial and Otherworld can wait until they are unparked.

## Source pickup options

**Existing checkout:** begin with `git status` and preserve any uncommitted edits. Fetch remote updates before deciding which branch to use. Do not force-reset or copy the supplied ZIP over a working Claude checkout.

**Supplied Git bundle:** retains the local commits, including merged T12 lore, Winter Road, shared notes and these plans. Clone it into a new folder:

```sh
git clone --branch codex/arcade-development-plan idle-arcade-development-plan.bundle idle-arcade
cd idle-arcade
git remote set-url origin https://github.com/ecbarish/generations.git
git config user.email "206636510+ecbarish@users.noreply.github.com"
git fetch origin
```

Inspect the refreshed remote and Claude's files before publishing. The bundle is a snapshot, not a replacement for later remote work. The supplied source ZIP is an alternative for immediate play/testing; it does not retain commit history. The notes-only ZIP is suitable for reading the plans without installing the project.

## Local play

From the repository root on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

Alternatively, if Python is installed:

```sh
python -m http.server 8765
```

Open http://localhost:8765/ for the arcade, or http://localhost:8765/tests/run.html for Realmbound's checks.
The supplied Winter Road branch previously passed 231 browser scenarios; rerun after the latest main integration (temporary browser tools were unavailable here). Main's older runner has 118 checks; a different
count can indicate a different branch, not a test failure. Close other Realmbound tabs during the test.

## Saves and devices

Realmbound: Journal → Export. Primordial: Field notebook → Export. Starfall Guild: Ledger → Export. Keep each exported block in its own named text file, including date and source site. Import a copy locally and verify the expected progress before relying on the new version.

Wildbond's reviewed source has no Export/Import interface. Keep its current browser/site data intact. On a desktop browser, we can help back up `wildbond-save-v1` from that origin before a migration; if the save is only on a phone, bring that up before moving progress. Adding a supported backup/restore interface is a good bounded ticket. Do not assume transferring the game folder transfers any save.

Source in GitHub and source on the PC do not automatically synchronize phone progress. For now use explicit save export/import where supported. A future cloud-save feature needs an approved conflict/backup plan; it is not required to host files tonight.

## Publication and branch dependencies

1. T12 PR #6 is merged. Latest reviewed main is `e4c10f6`; fetch again before publishing.
2. `codex/realmbound-winter-road` includes that lore, refreshed main and the previous shared-notes commit. It remains local, unpublished.
3. `codex/arcade-development-plan` adds only documentation on top of Winter Road.

If publication is still pending, push the feature branches from the authenticated desktop. Open Winter Road against main and the planning PR against `codex/realmbound-winter-road`. After Winter Road merges, retarget the planning PR to main and inspect the diff. Do not merge automatically.

```sh
git push origin codex/realmbound-winter-road
git push -u origin codex/arcade-development-plan
```

The local branch history uses the required noreply author email. Keep it configured for future commits. This session did not retry or bypass the website upload action previously blocked by browser URL policy. Opening a normal desktop Git session is the intended publishing path.

## A useful first desktop message

> The project folder is __. Current branch is __. Claude's latest work is __ and its status is __. I backed up __ saves. Git push works/doesn't work. Full Auto should be available from the start/unlocked. Our next active ticket is __. For sports, the next sport is __ and home/car benefits should be __.

No need to answer every future design question tonight. The first useful result is a shared up-to-date checkout, preserved progress, the pending PRs visible for review and one agreed next ticket.
