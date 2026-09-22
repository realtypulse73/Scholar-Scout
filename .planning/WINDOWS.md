---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-09-22T20:59:05.494Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 09 | deviation | apps/web/lib/catalogue-contract.ts |  | Added the missing great-circle angle conversion helper after the tracer exposed it. | open |  | 2026-09-22T20:59:05.494Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "09",
    "file": "apps/web/lib/catalogue-contract.ts",
    "line": null,
    "description": "Added the missing great-circle angle conversion helper after the tracer exposed it.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-22T20:59:05.494Z",
    "resolved_at": null
  }
]
````
