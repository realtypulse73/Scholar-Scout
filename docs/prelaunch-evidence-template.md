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
- Candidate-quality record (commit and artifact/link only):
- High-risk record (commit and artifact/link only):

## Candidate Quality

Record each result against the same immutable candidate commit:

| Command | Outcome | Approved artifact/deployment ID or link |
| --- | --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | | |
| `pnpm test` | | |
| `pnpm run lint` | | |
| `pnpm run typecheck` | | |
| `pnpm run build` | | |

## Browser and Preview Validation

| Lane | Candidate commit | Preview URL/ID | UTC | Command | Outcome | Safe category | Approved artifact/deployment ID or link |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Local browser | | | | | | | |
| Protected Preview browser | | | | | | | |
| Preview outage/restoration | | | | | | | |

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
Do not record fixture IDs, capabilities, storage details, student content, or environment values.
If `.env.prelaunch.local` was used, mark the evidence as a local rehearsal only, not a production launch rehearsal.
These Preview results supplement, and never replace, protected-main CI, a production deployment/build log, and post-deploy smoke evidence.
