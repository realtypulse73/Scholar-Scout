---
quick_id: 261026-um8
status: complete
description: Move shared Scholar Scout wordmark accents to an outline around a bright chrome fill for Preview comparison.
commit: 7302d88
---

## Completed

- Kept the all-caps wordmark's letter fill bright chrome/silver and moved blue and red to the surrounding outline treatment.
- Made the shared inline variant an in-flow, baseline-aligned, no-underline treatment so body-copy references wrap safely without overlap; every default product-name use inherits it.
- Added a stable high-contrast home navigation surface plus readable default, hover, and keyboard-focus link states that do not depend on the decorative backdrop.
- Restored the exact visible `Private Contributor Pilot` heading and gave each private signer/attestation control a shrinking-safe, wrapped text layout.

## Verification

- Focused wordmark and contributor-intake Jest tests passed (11 tests), including inline-layout, top-navigation boundary, visible contributor heading, and signer-layout coverage.
- Web lint passed with zero warnings.
- Local Next production build completed and produced `.next/BUILD_ID` under the available Node 20 runtime; the project warns that its configured runtime is Node 24.x.

## Release boundary

This is a Preview-only visual comparison on `codex/phase13-visual-first`. No Production, Vercel configuration, contributor workflow/data behavior, accounts, authentication, media governance, release schedule, or motion behavior changed.
