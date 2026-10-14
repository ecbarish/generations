## Title

Write the pull request title as a clear full phrase, never a fragment. Generations Reviewer sends the pull request back when the title is a fragment, or when the sections below are a one-line body.

## What changed for the player

Write full sentences. Say what the player can see or do now, and why this change was made. A one-line body is not allowed.

## How it was tested

Write full sentences. Name the checks you ran, whether old saves still load, and where the screenshots are when the screen changed.

## Checklist items

Write full sentences. Name the checklist rows this pull request ticks. If it ticks none, say that in a full sentence.

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
