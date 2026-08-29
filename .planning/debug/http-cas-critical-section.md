---
status: awaiting_human_verify
trigger: "Canonical verification reports that HTTP conditional PUT validates ETag before awaited backup/write/rename, allowing simultaneous handlers to both validate and lose an update."
created: 2026-08-29T00:00:00-04:00
updated: 2026-08-29T02:00:00-04:00
---

## Current Focus

bug_class: concurrency
reasoning_checkpoint:
  hypothesis: "The per-service promise queue protects only requests entering one server object; two service instances or processes that share dataFile own independent queues, so their ETag check and rename are not one shared critical section."
  confirming_evidence:
    - "Commit 36e22b1 and current source place writeQueue inside createScholarScoutDataService, while dataFile is an externally supplied shared filesystem path."
    - "The plan requires provider-level CAS; its research explicitly rejects process-local mutexes as insufficient coordination."
  falsification_test: "If conditional PUT coordination is keyed at the shared filesystem path across independent service instances/processes, the hypothesis is false."
  fix_rationale: "An exclusive sibling lock acquired before the current-file read and held through backup/write/rename makes the filesystem itself the shared critical-section authority; independent service objects and processes then cannot both validate one version."
  blind_spots: "The fixture lock is host-filesystem coordination, not a distributed lock for separate hosts mounting storage with non-atomic exclusive create semantics. The fixture is documented as local/non-production."
  candidate_causes:
    - "code: writeQueue is scoped to a server instance rather than the shared dataFile resource"
    - "environment: multiple local fixture processes or service objects can target the same path"
    - "data: the race requires both writers to carry the same current ETag or absent precondition"
  and_gate: "yes — silent overwrite requires the instance-scoped queue plus two independently scheduled handlers sharing one file and one expected version"
next_action: Canonical Phase 4 verifier must confirm the corrected HTTP evidence closes DATA-01 and the phase goal.

## Symptoms

expected: HTTP conditional PUT validation, backup, write, and rename form one atomic critical section for the supported local fixture contract.
actual: Current source has a per-service promise queue, while canonical verification claims there is no serialization; cross-service and cross-process behavior is not established.
errors: Canonical Phase 4 verification reports DATA-01 failed due to an unguarded asynchronous check-then-write.
reproduction: Submit two PUT requests with the same ETag to competing service handlers sharing one data file.
started: Found during canonical Phase 4 verification on 2026-08-29.

## Eliminated

## Evidence

- timestamp: 2026-08-29T00:00:00-04:00
  checked: Current services/http-data-service/src/server.mjs
  found: Each service instance owns writeQueue and routes every PUT through writeQueue.then(() => handleWrite(...)); handleWrite includes body parsing, ETag validation, backup, temp write, and rename.
  implication: The verifier's claim that simultaneous handlers on one server can both validate is contradicted by source; the unresolved boundary is multiple service instances/processes sharing the same file.

- timestamp: 2026-08-29T00:00:00-04:00
  checked: Current service tests and runbook
  found: Promise.all tests prove one observed winner but contain no deterministic barrier and do not cover separate service instances or processes. The runbook says the local fixture serializes competing writes without stating the single-process scope.
  implication: Existing evidence is insufficient even if the single-instance implementation is correct.

- timestamp: 2026-08-29T01:00:00-04:00
  checked: Commit 36e22b1 and Phase 4 plan/research
  found: The queue was introduced with HTTP CAS and does serialize one server instance. Phase 4 research says a process-local mutex cannot coordinate independent processes; JSON therefore uses an OS-exclusive sibling lock, while the HTTP fixture had no equivalent shared-file coordination.
  implication: The verifier's exact premise is false, but a cross-instance/cross-process filesystem race remains within the local fixture's configurable shared-file contract.

- timestamp: 2026-08-29T01:30:00-04:00
  checked: Implemented sibling-lock critical section and first deterministic contention test
  found: The HTTP suite passed 11/11, including explicit evidence that a second independent service instance observes lock contention before it can enter the conditional critical section; the winner returns 200 and the loser 412 with winner data preserved.
  implication: Shared-file coordination closes the cross-instance check-then-act race without changing the HTTP response contract.

- timestamp: 2026-08-29T02:00:00-04:00
  checked: Deterministic update and first-create contention tests
  found: Both tests explicitly observed the second independent service instance contend while only one critical section was acquired; after releasing the winner, responses were 200/412 and the winner remained stored. HTTP suite passed 12/12.
  implication: The exact stale-update and absent-create equivalence classes are protected at the shared local-file boundary.

- timestamp: 2026-08-29T02:00:00-04:00
  checked: Mutation/revert-and-reconfirm guardrail
  found: Replacing exclusive `open(lockPath, 'wx')` with non-exclusive `open(lockPath, 'w')` made both deterministic contention tests time out/fail; restoring `wx` returned the suite to 12/12 green.
  implication: The new tests kill loss of exclusive lock semantics and the behavioral fix—not incidental scheduling—causes the pass.

- timestamp: 2026-08-29T02:00:00-04:00
  checked: Adjacent adapter and Phase 3 recovery regression
  found: The clean focused rerun passed 3 suites / 54 tests. An earlier combined run had one Windows temp-file EPERM in the pre-existing independent JSON-process test; the immediate isolated rerun passed without code changes.
  implication: HTTP coordination does not regress web adapters or signed recovery behavior; the one transient host permission failure is not attributable to the change.

## Resolution

root_cause: "The HTTP fixture's write queue is scoped to each server object instead of the shared data file; independent service instances/processes can therefore check and replace the same file concurrently."
fix: "Acquire an exclusive sibling-file lock before reading the current document and hold it through precondition validation, backup, temp write, and atomic rename; add deterministic lifecycle-hook contention tests and document the local filesystem scope."
verification:
  target_test: { result: pass, suites: "HTTP fixture 12/12" }
  mutation_check: { result: pass, mutant_killed: "exclusive wx changed to non-exclusive w caused both contention tests to fail" }
  no_op_deletion: { result: pass, deletion_justified_by_rca: false }
  adjacent_tests: { result: pass, suites_run: ["data-store", "data-recovery", "admin-data-routes", "HTTP fixture build"] }
  revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true }
  guardrail_verdict: accepted
files_changed:
  - services/http-data-service/src/server.mjs
  - services/http-data-service/test/server.test.mjs
  - docs/http-data-adapter-runbook.md
verification:
files_changed: []
