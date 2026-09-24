# Phase 12: Qualification Lens and Explanation Governance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-24
**Phase:** 12-qualification-lens-and-explanation-governance
**Areas discussed:** qualification record, result ordering, uncertainty states, source-backed support, plain-language explanations

---

## Qualification record and private note

| Option | Description | Selected |
|--------|-------------|----------|
| Session-only qualifications | Discard the lens when the browser session ends. | |
| Account-held, editable qualifications | Retain student-controlled ordinary qualifications and let the student update them. | ✓ |
| Staff-visible administrative note | Share a student note with staff. | |

**User's choice:** Retain qualifications in the student's account, make them editable, and offer both account and programmes-page entry points.

**Notes:** Structured diploma/credits, degree, licence, prior-work, and voluntary-military-history choices are required. An optional free-text note remains private. A student may explicitly select note words as visible qualification keywords; the app must not silently interpret prose.

---

## Qualification-first ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Keep catalogue order | Highlight requirements without changing order. | |
| Reorder with declared qualifications | Put the most checked published requirements first while retaining every option. | ✓ |
| Hide lower connections | Remove options without enough matching information. | |

**User's choice:** Provide a toggle between normal order and Qualifications first. In Qualifications first, show the greatest number of checked published requirements first, then keyword-connected options, then remaining opportunities.

**Notes:** Examples discussed: an option with six checked requirements out of seven appears before one with five. The app must never make an official eligibility judgment or remove other opportunities.

---

## Uncertainty and support guidance

| Option | Description | Selected |
|--------|-------------|----------|
| Count unknown requirements as a poor match | Lower a card because a requirement is missing or dated. | |
| Needs-verification state | Keep the card visible with a dated source and a clear verification action. | ✓ |
| Omit incomplete requirements | Do not show uncertainty. | |

**User's choice:** Use a blue, clearly labeled Needs verification state for dated, missing, or incomplete requirement information.

**Notes:** Color supplements plain text, source date, and a verification action. Show reviewed documented support when it is available beside a not-yet-checked or needs-verification item; otherwise guide the student to verify with the programme.

---

## Plain-language explanation

| Option | Description | Selected |
|--------|-------------|----------|
| Technical explanations by default | Present detailed requirement language first. | |
| Plain language first | Use short, approximately sixth-grade-reading-level explanations with optional detail. | ✓ |
| Infer reading ability | Adapt language based on an inferred comprehension level. | |

**User's choice:** Use plain language first for every student, with non-distracting optional detail.

**Notes:** Reading level is a content-accessibility rule, never a profile or ranking signal.

---

## the agent's Discretion

- Choose exact labels, bounded note/keyword controls, deterministic tie-breaks, responsive layout, and the most natural placement within the existing Scholar Scout page.

## Deferred Ideas

- Staff/provider-visible notes and messaging are deferred; Phase 12 keeps qualification notes private.
- Automated free-text interpretation and formal eligibility decisions remain outside the phase boundary.
