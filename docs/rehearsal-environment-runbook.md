# Scholar Scout Rehearsal Environments

These two permanent Vercel projects are test equipment. They must never share the production project’s Blob store, OAuth credentials, domains, or environment variables.

| Project | Purpose | Required Preview-only setting |
|---|---|---|
| `scholar-scout-rehearsal-baseline` | Student journey works normally | No outage flag |
| `scholar-scout-rehearsal-outage` | Community submission safely reports an outage | `SCHOLARSCOUT_PREVIEW_COMMUNITY_RATE_LIMIT_OUTAGE=1` |

## One-time Vercel setup

For each project, connect `realtypulse73/Scholar-Scout`, use Root Directory `apps/web`, Node 24.x, and the committed install/build commands. Set its Production Branch to a protected unused branch such as `rehearsal/disabled`; the projects are used only for pull-request Preview deployments. Do not add a custom domain or production data.

Create one separate Vercel Blob store for each project. In that project’s **Preview** environment add:

```text
SCHOLARSCOUT_REHEARSAL_MODE=true
SCHOLARSCOUT_E2E_FIXTURE=true
SCHOLARSCOUT_E2E_FIXTURE_ID=<unique fixed UUID>
SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY=<unique random secret>
SCHOLARSCOUT_DATA_ADAPTER=vercel-blob
SCHOLARSCOUT_BLOB_READ_WRITE_TOKEN=<that project’s Blob token>
NEXTAUTH_SECRET=<unique non-production secret>
```

Do not set `SCHOLARSCOUT_BLOB_DATA_PATH` in either rehearsal project. The application derives the only allowed object path from the fixture ID: `scholarscout/rehearsal/<fixture-id>/data.json`.

Keep OAuth provider values absent. The rehearsal journey uses generated fixture state only.

## One-time GitHub setup

Add these repository Action secrets, matching the capabilities in their respective Vercel projects:

```text
SCHOLARSCOUT_REHEARSAL_BASELINE_CAPABILITY
SCHOLARSCOUT_REHEARSAL_OUTAGE_CAPABILITY
```

The workflow owns the two permanent deployment hostname prefixes. Do not add
GitHub variables for them: `scholar-scout-rehearsal-baseline-` and
`scholar-scout-rehearsal-outage-` are committed workflow configuration so a
missing dashboard value cannot stall a rehearsal.

Keep the GitHub deployment environment names created by Vercel unchanged:
`Preview – scholar-scout-rehearsal-baseline` and
`Preview – scholar-scout-rehearsal-outage`. The workflow uses those exact
names, together with the candidate commit and URL, to avoid accepting a
deployment from the main Scholar Scout project.

The workflow confirms the candidate commit's successful GitHub status for each rehearsal project, then reads GitHub's deployment-status records to identify exactly one Ready Preview URL for each matching candidate deployment. The built-in GitHub Actions token has read-only deployment access; the workflow does not call Vercel's REST API, print a credential, accept pasted URLs, or copy a Vercel value into GitHub for an individual rehearsal. Existing Vercel token secrets are no longer used by this workflow. Keep or revoke them only through a separate, explicit maintainer credential-rotation decision.

## Run a rehearsal

1. Open or update a pull request to `main`.
2. Wait for both rehearsal projects to show a ready Preview deployment for the PR head commit.
3. In GitHub Actions, run **ScholarScout Prelaunch Rehearsal** and paste that full commit SHA.
4. Read the uploaded `prelaunch-rehearsal` artifact. A pass means both fixture lifecycles were created, checked, and cleaned; a failure gives a safe category without exposing data or credentials.

The projects and their two fixture capabilities remain in place. No branches, branch-specific variables, generated handoff files, pasted URLs, per-run secret changes, or Vercel access tokens are needed.

## Rotating a fixture capability

If a fixed fixture capability must be replaced, update its matching Vercel
Preview secret and GitHub Preview secret, then push one new candidate commit to
the open pull request. Do not redeploy the previous commit: a redeploy creates
a second Ready URL for the same Git commit, and the rehearsal deliberately
refuses to guess which URL has the new settings. The new commit gives each
rehearsal project one unambiguous, Git-attested Preview deployment.
