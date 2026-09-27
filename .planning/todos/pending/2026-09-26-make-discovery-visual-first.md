---
created: 2026-09-27T00:22:02.527Z
title: Make discovery visual-first
area: ui
severity: major
files:
  - apps/web/components/catalogue/CatalogueDiscoveryOverview.tsx
  - apps/web/components/catalogue/DiscoveryPreviewSlot.tsx
  - apps/web/components/catalogue/CatalogueFocusView.tsx
  - apps/web/app/globals.css
  - apps/web/lib/catalogue-publication.ts
---

## Problem

The current Phase 13 media-safety fallback correctly hides the optional visual explorer when the reviewed catalogue contains no safe media fixture. That makes the catalogue feel visually flat: after a student provides information or opens discovery, no visual layer automatically welcomes them into the space. The desired product experience is visually enticing from the first discovery result onward, including calm background activity on ordinary catalogue pages, rather than treating imagery as a separate optional destination.

## Solution

Design and implement a visual-first discovery system that automatically supplies an accessible, non-distracting visual layer after the student enters information and across key browse screens. Preserve the locked media-safety order: approved local/provider/Scholar Scout visual; separately approved Maps/StreetView only if later authorized; clearly labelled Scholar Scout-generated illustration; then factual source-first fallback. Never invent provider evidence, render third-party embeds, infer student attributes, or autoplay except under the existing narrow center-card, muted, pauseable, scroll-bounded, reduced-motion-safe exception. Include reviewed local fixtures or safe illustrative fallback states so the experience is demonstrable in normal local UAT.
