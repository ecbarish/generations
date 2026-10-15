# A short path into the project

Evan, 2026-10-13: stop reloading the whole project to do one task. This page defines the new startup route; it overrides older instructions to read every planning document or the entire Session log each session.

1. Read the short root `AGENTS.md` (the same rules apply to Claude).
2. Fetch main in your own clone and check open PR titles/metadata for ownership.
3. Run `node tools/agent-context.cjs --agent <your name> --task TASK-ID --project PROJECT` (omit task when selecting). It reads the current QUEUE cycle and COMMS locally, returns named rows, a bounded set of recent/task messages, source fingerprints and targeted pointers. `--json` supplies machine-readable metadata.
4. Read the exact ticket, any long/omitted relevant COMMS entries, the task's source/tests and only the design sections needed for that change. For large files, search the task ID or function with rg and read the relevant sections plus their dependencies; do not dump an entire data catalogue to find one entry. Before a claim or merge, read the relevant PROCESS section and PR template.
5. Implement and check the scoped change. Update its PR Tower block and one START-HERE Session log line. Feature PRs never edit docs/COMMS.md. Claims and handoffs go in #373 comments or docs/plans/guest-backlog.md. Only Generations PM's post-merge bookkeeping touches COMMS. Planning owns Where we are/Up next.

The packet is **generated live, never a stored authority**. It has no network access, does not select/claim/merge work and does not infer PR or published state. It records checkout HEAD, timestamp and hashes of the three inputs. Rebuild after a branch switch, fetch/merge, changed task or new coordination. An expired cycle is flagged; never fall through to an old autopilot lane. An explicit owner request can authorize work outside the cycle.

Default output budget is 16,000 characters (roughly 4,000 tokens; actual tokenizers differ). Oversized output fails instead of silently dropping rules. Long COMMS entries are indexed with a line pointer and a warning; read the full entry before acting. Recent messages and task matches are not proof that every historical issue is resolved.

## Guest AIs

#373 is where a guest claims work. The standing list is [docs/plans/guest-backlog.md](plans/guest-backlog.md).

Guest AIs never wait. When you finish a task or are blocked waiting on a reply, don't ask: claim the next unclaimed row for you in this backlog (as a #373 comment) and start it. While an approval is pending, work the next row in the meantime. Generations PM keeps at least 5 unclaimed rows per guest at all times.

Feature PRs never edit docs/COMMS.md. Claims and handoffs go in #373 comments or this backlog. Only Generations PM's post-merge bookkeeping touches COMMS.

For WB-ROAD and WB-LOOK: Stay out of the Wildbond dev lead's fix bundle. Rebuild play/wildbond/index.pck only once, as the last step, right after merging main and just before review. Only one PR carries a Wildbond re-export at a time.

At the start of every session, and right after your pull request is handed to review, read #373 and the backlog. Take the next task assigned to you by name. If nothing is assigned, take the top unclaimed row for you in the backlog. Every spec you are pointed to is committed in the repo.

## Read by purpose

| Work | Open when needed |
|---|---|
| Picking work / changing priorities | QUEUE This cycle; STUDIO-PLAN section 4 and the selected game's section |
| Building a named task | Exact ROADMAP/DEVELOPMENT-PATH ticket, owned source and tests |
| Claiming / reviewing / merging | Relevant PROCESS section and PR template; current live PR metadata |
| Player text / new art | Relevant CREATIVE section and that game's art direction |
| Wildbond story | Lore thread ledger plus relevant character/region entries |
| Major new design | Relevant VISION/PROJECTS section and recorded decisions |
| Local helper | tools/local-ai/README and the current local benchmark/report |
| A historical question | Search the Session log/COMMS/archive for the specific ID; read matching entries only |

Keep permanent rules here/AGENTS, task ownership in QUEUE/live PRs, detailed specifications in tickets, and evidence in the task's report. Do not duplicate current task status into another manually maintained dashboard. Small task handoffs should name: ID, goal, owned paths/source anchors, dependencies, check command, evidence and next action. Memory is an index to current sources, not permission to trust an old summary.
