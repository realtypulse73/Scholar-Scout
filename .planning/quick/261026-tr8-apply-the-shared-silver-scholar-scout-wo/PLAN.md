---
quick_id: 261026-tr8
status: complete
description: Apply the shared silver Scholar Scout wordmark across rendered product-name UI with contrast-safe variants.
---

## Scope

1. Add one semantic `ScholarScoutWordmark` component and route the existing header mark through it.
2. Replace rendered product-name UI references with the shared component, including inline prose and administrative headers, while leaving metadata, accessibility labels, data, auth behavior, and API instructions untouched.
3. Use a contrast-safe silver default with an explicit light-surface treatment and focused tests. Verify the visual branch only.

## Guardrails

- Do not alter ordinary body copy other than an explicit Scholar Scout product-name token.
- Do not change Production, Vercel configuration, user data, media governance, authentication behavior, or release workflow.
