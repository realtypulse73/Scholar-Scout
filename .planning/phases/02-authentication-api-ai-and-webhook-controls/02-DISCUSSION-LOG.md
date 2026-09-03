# Phase 2: Authentication, API, AI, and Webhook Controls - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves the alternatives considered.

**Date:** 2026-07-26
**Phase:** 2-Authentication, API, AI, and Webhook Controls
**Areas discussed:** Student identity boundaries, staff revocation, advisor cost controls, webhook trust boundary, login and registration abuse controls

---

## Student identity boundaries

| Decision | Alternatives considered | Selected |
|---|---|---|
| Unsigned use | Require sign-in; guest mode then migrate; agent discretion | Guest mode then migrate |
| Guest lifetime | 24 hours; one browser session; seven days | Seven days |
| Trial breadth | Explore/draft only; small AI trial; broad trial | Broad trial |
| Account claim | Same-device seamless claim; choose items; start fresh | Same-device seamless claim |

**Notes:** The user wants a week for relationship-building. Guest access must not grant staff privileges or another student's private data; eligible activity transfers after sign-in and the guest credential is invalidated.

---

## Staff revocation

| Decision | Alternatives considered | Selected |
|---|---|---|
| Active authority | Server allowlist; persisted grants; JWT until expiry | Server allowlist |
| Revocation behavior | Immediate 403; force sign-in; blocking notice | Immediate 403 |
| Audit evidence | Success and denied attempts; success only; none | Success and denied attempts |
| Bad configuration | Fail closed; honor stored role; take admin offline | Fail closed |

**Notes:** Staff members removed from the allowlist remain normal students but lose privileged access immediately.

---

## Advisor cost controls

| Decision | Alternatives considered | Selected |
|---|---|---|
| Daily message allowance | 3/12; 5 for everyone; 10/25 guest/signed-in | 10/25 guest/signed-in |
| Request size | Focused 1,000 characters; extended 3,000 characters; open-ended | Extended 3,000 characters |
| Reply size | 500; 1,000; 1,500 tokens | 1,000 tokens |
| Quota response | Reset guidance; generic unavailable; queue request | Reset guidance |

**Notes:** The server selects supporting context; a guest cannot bypass the current day's guest quota simply by signing in.

---

## Webhook trust boundary

| Decision | Alternatives considered | Selected |
|---|---|---|
| Missing/invalid secret | 503; refuse start; 404 | 503 |
| Qualifying event | Approved repository/labels; repository+actor allowlist; any signed issue | Approved repository/labels |
| Agent authentication | Bearer token; HMAC body; network-only | Bearer token |
| Bounds | 64/16 KiB, 10 seconds; larger; permissive | 64/16 KiB, 10 seconds |

**Notes:** A failed signature/configuration must cause no GitHub comment or agent dispatch.

---

## Login and registration abuse controls

| Decision | Alternatives considered | Selected |
|---|---|---|
| Rate limits | 5 per 15 min / 5 registrations per hour; stricter; forgiving | Balanced protection |
| Login errors | Generic; detailed; support-first | Detailed |
| Password verification | Non-blocking; synchronous; managed authentication | Non-blocking |
| Post-failure lock | No hard lock; temporary lock; manual unlock | No hard lock |

**Notes:** Detailed errors deliberately trade account-enumeration protection for clearer student feedback. Strong per-email/IP throttling remains mandatory.

---

## the agent's Discretion

- Opaque guest-credential format, distributed rate/quota storage, schema-helper design, and test fixtures, provided the locked decisions are enforced.

## Deferred Ideas

- Preserve the full roadmap after the initial security workup.
- Community relationship features remain subject to Phase 5 privacy and moderation controls.
