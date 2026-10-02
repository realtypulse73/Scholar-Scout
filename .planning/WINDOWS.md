---
schema_version: 1
open_count: 5
waived_count: 0
fixed_count: 3
total_count: 8
last_updated: 2026-10-02T14:23:20.114Z
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
| 5 | 13.2 | unrun-verify | apps/web/lib/server/contributor-media.ts |  | pnpm build:vercel is blocked by the existing unresolved mediainfo.js MediaInfoModule.wasm import. | fixed |  | 2026-10-02T13:27:02.512Z | 2026-10-02T14:23:19.027Z |
| 6 | 13.2 | deviation | apps/web/components/catalogue/DiscoveryPreviewSlot.tsx |  | Existing media details were narrowed to local previews because learner-safe illustration DTOs omit review and provenance fields. | open |  | 2026-10-02T13:27:03.026Z |  |
| 7 | 13.2 | deviation | apps/web/lib/server/contributor-media.ts |  | Bound private Blob completion mutation to the current Draft revision to prevent stale callback mutation. | fixed |  | 2026-10-02T14:22:45.847Z | 2026-10-02T14:23:19.583Z |
| 8 | 13.2 | deviation | apps/web/__tests__/lib/server/contributor-media.test.ts |  | Used an isolated worktree-local TEMP directory to complete the full Jest suite after a system-temp EPERM lock. | fixed |  | 2026-10-02T14:22:46.371Z | 2026-10-02T14:23:20.114Z |

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
  },
  {
    "id": 5,
    "kind": "unrun-verify",
    "phase": "13.2",
    "file": "apps/web/lib/server/contributor-media.ts",
    "line": null,
    "description": "pnpm build:vercel is blocked by the existing unresolved mediainfo.js MediaInfoModule.wasm import.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-10-02T13:27:02.512Z",
    "resolved_at": "2026-10-02T14:23:19.027Z"
  },
  {
    "id": 6,
    "kind": "deviation",
    "phase": "13.2",
    "file": "apps/web/components/catalogue/DiscoveryPreviewSlot.tsx",
    "line": null,
    "description": "Existing media details were narrowed to local previews because learner-safe illustration DTOs omit review and provenance fields.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-02T13:27:03.026Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "deviation",
    "phase": "13.2",
    "file": "apps/web/lib/server/contributor-media.ts",
    "line": null,
    "description": "Bound private Blob completion mutation to the current Draft revision to prevent stale callback mutation.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-10-02T14:22:45.847Z",
    "resolved_at": "2026-10-02T14:23:19.583Z"
  },
  {
    "id": 8,
    "kind": "deviation",
    "phase": "13.2",
    "file": "apps/web/__tests__/lib/server/contributor-media.test.ts",
    "line": null,
    "description": "Used an isolated worktree-local TEMP directory to complete the full Jest suite after a system-temp EPERM lock.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-10-02T14:22:46.371Z",
    "resolved_at": "2026-10-02T14:23:20.114Z"
  }
]
````
