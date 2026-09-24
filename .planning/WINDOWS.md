---
schema_version: 1
open_count: 4
waived_count: 0
fixed_count: 0
total_count: 4
last_updated: 2026-09-24T15:43:19.371Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 09 | deviation | apps/web/lib/catalogue-contract.ts |  | Added the missing great-circle angle conversion helper after the tracer exposed it. | open |  | 2026-09-22T20:59:05.494Z |  |
| 2 | 09 | deviation | apps/web/__tests__/lib/catalogue-contract.test.ts | 646 | Corrected the isolated documented-source chronology regression setup so it tests the required later source date. | open |  | 2026-09-22T22:15:36.081Z |  |
| 3 | 09 | deviation | apps/web/lib/catalogue-contract.ts |  | Narrowed source-date guard to a type predicate for the chronology validation. | open |  | 2026-09-22T23:02:16.769Z |  |
| 4 | quick | deviation | apps/web/__tests__/api/register.test.ts |  | Corrected the registration test environment fixture so strict TypeScript accepts the planned local and Vercel cases. | open |  | 2026-09-24T15:43:19.371Z |  |

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
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "09",
    "file": "apps/web/__tests__/lib/catalogue-contract.test.ts",
    "line": 646,
    "description": "Corrected the isolated documented-source chronology regression setup so it tests the required later source date.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-22T22:15:36.081Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "09",
    "file": "apps/web/lib/catalogue-contract.ts",
    "line": null,
    "description": "Narrowed source-date guard to a type predicate for the chronology validation.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-22T23:02:16.769Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "quick",
    "file": "apps/web/__tests__/api/register.test.ts",
    "line": null,
    "description": "Corrected the registration test environment fixture so strict TypeScript accepts the planned local and Vercel cases.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-24T15:43:19.371Z",
    "resolved_at": null
  }
]
````
