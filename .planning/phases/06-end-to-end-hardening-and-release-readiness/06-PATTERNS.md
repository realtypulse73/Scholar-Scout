# Phase 6: End-to-End Hardening and Release Readiness - Pattern Map

**Mapped:** 2026-09-18  
**Scope:** Targeted remediation for the two unresolved Preview-release review findings.  
**Files analyzed:** 11 current seams plus the recommended attestation module/test.  
**Analogs found:** 10 / 12 (there is no existing trusted GitHub Deployment attestation helper).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/preview-deployment-attestation.mjs` (new) | utility/service | request-response | `scripts/preview-deployment-protection.mjs` | partial; no existing GitHub Deployment client |
| `scripts/preview-deployment-attestation.test.mjs` (new) | test | request-response | `scripts/preview-deployment-protection.test.mjs` | role/data-flow match |
| `scripts/preview-deployment-protection.mjs` | utility/guard | request-response | itself, `validatePreviewDeployment` | exact extension seam |
| `scripts/run-preview-release-tracer.mjs` | controller/supervisor | event-driven + request-response | itself, `runPreviewReleaseTracer` | exact extension seam |
| `scripts/run-preview-outage-rehearsal.mjs` | controller/supervisor | event-driven + request-response | itself, `runPreviewOutageRehearsal` | exact extension seam |
| `scripts/provision-preview-rehearsal.mjs` | provisioning utility | file-I/O | itself, `provisionPreviewRehearsal` | exact extension seam |
| `scripts/test-production-tooling.mjs` | operational integration test | file-I/O + transform | provisioning/rehearsal tests | exact extension seam |
| `apps/web/lib/server/e2e-programme-fixture.ts` | server-only service | CRUD + configuration guard | `requireConfiguredFixtureId` | exact extension seam |
| `apps/web/__tests__/lib/server/e2e-programme-fixture.test.ts` | test | CRUD + configuration guard | existing fixture tests | exact extension seam |
| `.github/workflows/prelaunch-rehearsal.yml` | CI configuration | event-driven | existing ordered Preview lanes | exact extension seam |
| `docs/production-release-runbook.md` | operational runbook | human handoff | Candidate Preview Rehearsal section | exact extension seam |
| `docs/prelaunch-evidence-template.md` | evidence template | transform | Browser and Preview Validation table | exact extension seam |

## Pattern Assignments

### `scripts/preview-deployment-attestation.mjs` (new utility/service, request-response)

**Purpose:** Query a GitHub Deployment/status created by the approved Vercel integration, independently of runner-supplied metadata, and return only a scrubbed attestation (`environment`, normalized Preview URL, and the actual candidate SHA) when it exactly matches the requested candidate.

**Closest analog:** No local GitHub Deployment lookup exists. Use the injected-transport shape from the existing Preview supervisor and the GitHub bearer-fetch convention in `services/codex-webhook-runner/src/server.mjs:213-231`.

**Recommended seam:** Keep this external lookup in a small Node module, not in `createPreviewMetadata` or the browser path. It should receive `owner`, `repo`, `candidateCommit`, and an injected `fetchImpl` (or injected GitHub client); it must fail closed on missing, ambiguous, wrong-environment, wrong-creator/integration, non-success, wrong-SHA, or non-HTTPS target results. The caller may compare the attested URL to the maintainer-selected URL, but must never accept an input/secret metadata `commit` as proof of the deployment's SHA.

**Auth/transport pattern** (`services/codex-webhook-runner/src/server.mjs:213-221`):

```javascript
const response = await fetchImpl(endpoint, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  },
});
```

For this read-only lookup, use the same injected transport and `Accept` header but `GET`; obtain the runner token from the ephemeral GitHub Actions token, grant only the required `deployments: read` permission, and never serialize it in outcome records.

**Error-handling pattern** (`scripts/preview-deployment-protection.mjs:6-27`):

```javascript
if (!metadata || metadata.environment !== 'preview' || metadata.commit !== candidateCommit) {
  throw new Error('Preview tracer requires metadata for the selected Preview candidate.');
}

let target;
try {
  target = new URL(metadata.url);
} catch {
  throw new Error('Preview tracer requires a valid HTTPS Preview URL.');
}
```

Keep the same fail-before-traffic rule, but replace the self-asserted `metadata.commit` input with the trusted deployment/status result. Only return a safe fixed error category from the calling supervisor; do not put API response text, deployment payloads, URLs with credentials, or token-bearing headers in evidence.

**Required tests:** fake a paginated/selected deployment-status client and prove no lifecycle/browser call occurs for: no deployment, more than one valid candidate, not Preview, creator/integration not approved, status not successful, SHA mismatch, and invalid URL. Prove the one exact eligible record permits downstream work and that no auth material/payload body enters the returned safe outcome.

---

### `scripts/preview-deployment-protection.mjs` (utility/guard, request-response)

**Analog:** `validatePreviewDeployment` at lines 6-27 and `createProtectedPreviewContextOptions` at lines 33-45.

**Current guard pattern:**

```javascript
export function createProtectedPreviewContextOptions({ metadata, candidateCommit, env = process.env }) {
  const baseURL = validatePreviewDeployment(metadata, candidateCommit);
  const bypass = normalizeRunnerHeaderValue(env[BYPASS_ENV]);
  if (!bypass) {
    throw new Error('Preview tracer requires runner-only protection material.');
  }
  return {
    baseURL,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': bypass,
      'x-vercel-set-bypass-cookie': 'true',
    },
  };
}
```

**Repair assignment:** Preserve this module as the sole in-memory Vercel-protection boundary. Change its input contract to require an already-attested deployment object (or retain a narrow `validateAttestedPreviewDeployment` helper) rather than accepting arbitrary runner metadata with a commit field. Do not move protection headers, bypass normalization, or lifecycle-header stripping into the new attestation helper.

**Tests to extend:** `scripts/preview-deployment-protection.test.mjs:16-63` already proves reject-before-traffic preconditions and no bypass cookie on direct lifecycle transport. Replace the current self-supplied metadata fixture with a trusted-attestation-shaped fixture; add a regression that a candidate echo cannot pass attestation.

---

### `scripts/run-preview-release-tracer.mjs` (controller/supervisor, event-driven + request-response)

**Analog:** `runPreviewReleaseTracer` at lines 53-111.

**Core ordering pattern:**

```javascript
const protectedOptions = createProtectedPreviewContextOptions({ metadata, candidateCommit, env });
const capability = getLifecycleCapability(env);
const request = createLifecycleRequest(
  protectedOptions.baseURL,
  capability,
  createLifecycleProtectionHeaders(protectedOptions.extraHTTPHeaders),
);

return await runFixtureLifecycle({
  request,
  run: async () => {
    browser = await createBrowser({ ...protectedOptions, ignoreHTTPSErrors: false });
    await runStudentSpec({ browser, baseURL: protectedOptions.baseURL, childEnv: {}, diagnostics: { trace: 'off', screenshot: 'off', video: 'off' } });
  },
});
```

**Repair assignment:** Insert `await attestPreviewDeployment(...)` as the first awaited operation, before `createProtectedPreviewContextOptions`, capability use, lifecycle creation, Playwright launch, or any lifecycle/browser traffic. Inject it as an argument with a safe default so `scripts/run-preview-release-tracer.test.mjs:12-146` remains deterministic. Safe records should continue to be produced with `createSafeOutcome` at lines 28-35 and must not contain attestation payloads.

**Tests to extend:** retain the order assertions at `run-preview-release-tracer.test.mjs:12-70` and the no-traffic loop at lines 72-94. Add an attestation spy and assert it happens first; on rejection, verify `createLifecycleRequest`, `createBrowser`, and `runStudentSpec` remain uncalled.

---

### `scripts/run-preview-outage-rehearsal.mjs` (controller/supervisor, event-driven + request-response)

**Analog:** `runPreviewOutageRehearsal` at lines 36-79.

**Core shared-guard pattern:**

```javascript
const options = createProtectedPreviewContextOptions({ metadata, candidateCommit, env });
const lifecycle = createLifecycle(
  options.baseURL,
  getCapability(env),
  createLifecycleProtectionHeaders(options.extraHTTPHeaders),
);
```

**Repair assignment:** Use the same attestation-before-traffic seam as the baseline tracer; do not have outage proof trust a separate mutable `SCHOLARSCOUT_PREVIEW_OUTAGE_METADATA` commit value. The outage Preview must independently attest its own exact Vercel/GitHub deployment before POSTing `/api/campus-notes`.

**Tests to extend:** follow `scripts/run-preview-outage-rehearsal.test.mjs:12-44` for lifecycle/order assertions and lines 62-90 for scrubbed cleanup failure. Add a rejected-attestation case proving no lifecycle or outage POST occurs.

---

### `scripts/provision-preview-rehearsal.mjs` (provisioning utility, file-I/O)

**Analog:** `provisionPreviewRehearsal` at lines 8-62.

**Current safe-handoff pattern:**

```javascript
const baselineFixtureId = randomUUID();
const outageFixtureId = randomUUID();
const baselineCapability = token(32);
const outageCapability = token(32);

await writeFile(resolvedLocalFile, [
  '# One-time ScholarScout Preview rehearsal handoff.',
  '# Generated locally. Do not commit, print, or paste this file.',
  `BASELINE_SCHOLARSCOUT_E2E_FIXTURE_ID=${baselineFixtureId}`,
  `BASELINE_SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY=${baselineCapability}`,
  `OUTAGE_SCHOLARSCOUT_E2E_FIXTURE_ID=${outageFixtureId}`,
  `OUTAGE_SCHOLARSCOUT_E2E_FIXTURE_CAPABILITY=${outageCapability}`,
].join('\n'));
```

**Repair assignment:** Generate two non-secret, fixture-ID-bound paths in the ignored local handoff, for example `scholarscout/preview/<fixture-id>/data.json`, as `BASELINE_SCHOLARSCOUT_BLOB_DATA_PATH` and `OUTAGE_SCHOLARSCOUT_BLOB_DATA_PATH`. Require the Vercel handoff instructions to map each path only to its matching one-off Preview deployment. The scrubbed markdown report must say two isolated paths are required, but must not print either path (storage details are excluded from releasable evidence).

**Tests to extend:** use the temp-directory subprocess pattern in `scripts/test-production-tooling.mjs:615-639`. Assert baseline/outage paths are both present in the local ignored handoff, differ, match the bounded `scholarscout/preview/<fixture-id>/data.json` format, each embeds its own fixture ID, and neither value appears in the report. Preserve the existing no-secret-disclosure assertions.

---

### `apps/web/lib/server/e2e-programme-fixture.ts` (server-only service, CRUD + configuration guard)

**Analog:** `requireConfiguredFixtureId` at lines 108-117 and Blob-store initialization at `apps/web/lib/server/data-store.ts:972-987`.

**Current fail-closed gate:**

```typescript
function requireConfiguredFixtureId(): string {
  const fixtureId = getConfiguredE2eFixtureId();
  if (!fixtureId || process.env.VERCEL_ENV === 'production') {
    throw new Error('E2E fixture lifecycle is unavailable.');
  }
  return fixtureId;
}
```

**Data-path source pattern:**

```typescript
activeDataStore = new VercelBlobScholarScoutDataStore(
  process.env.SCHOLARSCOUT_BLOB_DATA_PATH ?? 'scholarscout/data.json',
  token,
);
```

**Repair assignment:** Extend the existing server-side fixture eligibility check, rather than adding a browser-controlled path parameter or a second persistence adapter. When the active adapter is `vercel-blob`, require a non-default `SCHOLARSCOUT_BLOB_DATA_PATH` that exactly follows the isolated Preview pattern and is bound to the configured fixture ID. Deny lifecycle provisioning/verification/cleanup before data-store access when the path is absent, default, shared, malformed, or associated with another fixture. Retain the current unconditional production denial.

**Tests to extend:** mirror the environment save/restore setup in `apps/web/__tests__/lib/server/e2e-programme-fixture.test.ts:50-64`; cover accepted matching Preview paths and rejected default, shared, wrong-ID, malformed, and production cases. Keep `apps/web/__tests__/app/api/internal/e2e-fixture/route.test.ts:12-84` as the route-level proof that a denied precondition cannot call the fixture operations.

---

### `.github/workflows/prelaunch-rehearsal.yml` (CI configuration, event-driven)

**Analog:** the staged lane order at lines 71-90 and its structural test in `scripts/test-production-tooling.mjs:495-511`.

**Current ordering pattern:**

```yaml
- name: Run candidate quality, high-risk, and local browser proof
  run: pnpm run rehearse:prelaunch -- --release-gate --local-only --candidate-commit "${{ inputs.candidate_commit }}"

- name: Protected Preview browser proof (maintainer-owned runner)
  run: node scripts/run-preview-release-tracer.mjs --output reports/prelaunch-rehearsal/preview-browser.json
```

**Repair assignment:** Add read-only deployment permission and an explicit trusted-attestation step/input transport before either Preview lane. Do not treat `SCHOLARSCOUT_PREVIEW_METADATA` or `SCHOLARSCOUT_PREVIEW_OUTAGE_METADATA` as an authority for a SHA. The workflow should bind each runner to the attested URL/deployment identity, preserve its Preview-only/no-promote/no-alias properties, and ensure the baseline and outage deploys have separately configured isolated Blob paths before the runner starts. Do not put fixture paths, capabilities, bypass material, or full provider responses in artifacts or the summary.

**Tests to extend:** augment the existing workflow structural test with checks for deployment-read permission, attestation before both lanes, and absence of project-level environment mutation/promotion/alias. Add assertions that the workflow cannot run a Preview lane if a distinct path/attestation is absent.

---

### Release runbook and evidence template (operational handoff, transform)

**Analogs:** `docs/production-release-runbook.md:64-96` and `docs/prelaunch-evidence-template.md:34-61`.

**Current rule:** Preview proof is distinct from production and evidence excludes credentials, fixture identifiers, storage details, and student content.

**Repair assignment:** Update only the documented handoff steps to say: generate the local handoff, set each generated Blob path on the matching one-off Preview deployment, verify both paths are different before launch, and allow the workflow to attest the actual Vercel/GitHub deployment SHA before traffic. Keep paths out of the releasable record; the allowed result is only the existing candidate/URL-or-ID/UTC/command/outcome/safe-category/artifact-or-deployment-link set.

## Shared Patterns

### Fail closed before side effects

**Sources:** `scripts/run-preview-release-tracer.mjs:61-75`, `scripts/run-preview-outage-rehearsal.mjs:43-51`, `apps/web/lib/server/e2e-programme-fixture.ts:108-113`.

Both repairs must validate their trust/configuration boundary before fixture provisioning, browser traffic, persistence access, or outage POSTs. A failed attestation or path check is a release-gate failure, not a warning or a reason to fall back to metadata/default storage.

### Inject external clients in Node operational tests

**Sources:** `scripts/run-preview-release-tracer.mjs:53-60`, `scripts/run-preview-outage-rehearsal.mjs:36-42`.

Pass `fetchImpl`, an attestation function/client, browser factory, and lifecycle factory as injectable dependencies. This enables exact ordering/no-traffic tests without Vercel, GitHub, browser, or network access.

### Scrubbed evidence only

**Sources:** `scripts/run-preview-release-tracer.mjs:28-35`, `scripts/run-preview-outage-rehearsal.mjs:59-77`, `docs/prelaunch-evidence-template.md:57-62`.

Safe records contain stable outcome/category plus the already-approved target and candidate fields. They must not contain GitHub Deployment response data, raw API errors, tokens, bypass material, fixture capabilities/IDs, Blob paths, cookies, student content, or environment values.

### Isolate through configuration, never browser input

**Sources:** `apps/web/lib/server/data-store.ts:972-987`, `apps/web/lib/server/e2e-programme-fixture.ts:74-113`, `apps/web/app/api/internal/e2e-fixture/route.ts:29-40`.

Blob path selection remains server deployment configuration. The lifecycle protocol continues to take no body/query/path selector, so the browser cannot choose a persistence target. The server binds the configured isolated path to the configured fixture ID before data operations.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `scripts/preview-deployment-attestation.mjs` | utility/service | request-response | The repository has no existing client that reads GitHub Deployments/statuses and verifies a Vercel-created Preview against an immutable SHA. Reuse the injected fetch/error conventions above, but add this trust boundary as a small dedicated module. |

## Metadata

**Analog search scope:** `scripts/`, `.github/workflows/`, `apps/web/lib/server/`, `apps/web/__tests__/`, `services/codex-webhook-runner/`, and release documentation.  
**Files scanned:** 18.  
**Pattern extraction date:** 2026-09-18.
