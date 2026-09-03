# ScholarScout Prelaunch Evidence

Use this template for the launch-readiness note after running a prelaunch rehearsal.

## Release Candidate

- Date:
- Owner:
- Deployment URL:
- Expected adapter:
- Expected OAuth providers:

## Rehearsal Artifacts

- `production-env-readiness.json`:
- `production-tooling-test.txt`:
- `production-smoke-report.json`:
- `prelaunch-summary.md`:

## Candidate Quality

All five outcomes must be `passed` for the same candidate commit and in this
order. A later lane cannot substitute for a missing result.

| Command | Outcome | Artifact or run link |
|---|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` |  |  |
| `pnpm test` |  |  |
| `pnpm run lint` |  |  |
| `pnpm run typecheck` |  |  |
| `pnpm run build` |  |  |

## Candidate-Bound Validation

| Lane | Candidate commit | UTC | Outcome / safe category | Approved artifact or deployment ID/link |
|---|---|---|---|---|
| High-risk API, webhook, and persistence suite |  |  |  |  |
| Local browser journey |  |  |  |  |
| Protected Preview browser journey |  |  |  |  |
| Preview outage and restoration |  |  |  |  |

For the outage row, also record the distinct base and outage deployment IDs,
successful fixture cleanup, and successful restoration confirmation. Never put
the bypass, lifecycle capability, cookies, fixture values, student content,
environment values, or storage details in this note.

## Results

- Production env readiness:
- Production tooling tests:
- Production smoke:
- Staff operations check:
- Backup/export check:

## Decisions

- Launch decision:
- Known risks:
- Follow-up owner:
- Next monitoring check:

## Notes

Do not paste secrets, cookies, exported snapshots, or full data documents here.
If `.env.prelaunch.local` was used, mark the evidence as a local rehearsal only, not a production launch rehearsal.
Candidate and Preview evidence supplements the real release evidence. It does
not replace the protected-main pull request/checks, Vercel Production build,
post-deploy smoke artifact, or incident acknowledgement when smoke fails.
