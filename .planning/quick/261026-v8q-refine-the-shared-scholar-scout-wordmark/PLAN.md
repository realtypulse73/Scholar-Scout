---
quick_id: 261026-v8q
status: in_progress
description: Refine the shared Scholar Scout wordmark to a bright silver chrome fill with restrained red and blue edge accents, without altering motion, responsive layout, accessibility, or deployment scope.
---

## Scope

- Refine only the shared `brand-wordmark` CSS treatment used by `ScholarScoutWordmark`.
- Keep the fill predominantly bright silver/chrome, with smooth, restrained red and blue edge accents rather than multicolor letter fills.
- Preserve the inline no-overlap contract, accessible labels, visible navigation focus styling, and reduced-motion behavior.
- Add or update focused assertions that prevent the edge accents from regressing into a solid multicolor fill.

## Validation

1. Run the focused wordmark component test.
2. Run web lint and production build.
3. Inspect the existing Preview for a stationary chrome treatment and stable inline layout.

## Exclusions

- No media, account, authentication, persistence, catalogue, release, Vercel Production, or animation behavior changes.
- Do not commit or push this newly scoped refinement until separately confirmed in the repository thread.
