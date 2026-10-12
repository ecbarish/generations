## Change

Describe the problem, resulting behavior and task ID.

## Validation

Record checks, old-save compatibility and visual evidence where applicable. Follow docs/PROCESS.md before merge.

## Control Tower

Keep this block current at claim, status change, handoff, blocker, review, merge and publication. Fill actual values; null means unknown. GitHub usernames are not AI identities. Merge is not proof of publication. Full reporting guidance: docs/COMMS.md, TOWER-COMMS (2026-10-12).

```json
{
  "tower": {
    "task_id": null,
    "project": null,
    "agent": null,
    "operator": null,
    "lane": null,
    "status": "claimed",
    "summary": null,
    "updated_at": null,
    "depends_on": [],
    "files": [],
    "blocker": null,
    "next_action": null,
    "checks": {"state": "unknown", "summary": null, "evidence_url": null},
    "release": {"state": "unknown", "url": null, "commit": null}
  }
}
```

Allowed status: queued / claimed / building / blocked / review / merged / published / cancelled. Use ISO-8601 UTC for updated_at; PR numbers for depends_on; intended owned paths for files. checks.state: pending / passed / failed / unknown. release.state: unpublished / publishing / published / unknown. A published release needs its verified URL and full matching commit SHA. No secrets or personal emails.
