# Phase 13 Browser UAT

Run this against the local development app or a non-production preview that contains safe reviewed-media fixtures. Do not add provider media or change production data for this check.

**Result:** [ ] PASS  [ ] FAIL  
**Reviewer:** ____________________  
**Date/time:** ____________________  
**Environment/URL:** ____________________

## 1. Bounded local-preview motion

1. Open `/programmes` with a safe fixture that shows at least two reviewed local-preview cards in **Optional visual explorer**.
2. Scroll until one visual card is nearest the center of the viewport.
3. Confirm that only that card plays, muted, and that it exposes a **Pause preview** button.
4. Click **Pause preview**, then confirm playback stops and the control changes to **Play preview**. Click it once more to resume.
5. Scroll until another visual card becomes nearest the viewport center; confirm the first card stops and no more than one card moves.
6. Enable the browser or operating-system **Reduce motion** setting, reload the page, and repeat the scroll.

**Expected:** Exactly one nearest visible local preview may loop muted; it stops on manual pause, scroll-away, or center transfer. With reduced motion, all previews remain still and state that motion is paused.

**Evidence / notes:** ________________________________________________

## 2. Provider detail, disclosure, and rights fallback

1. From a visual card, click **View details in Scholar Scout**.
2. Confirm the visual appears before **Facts and sources** and that factual source links remain available below it.
3. Tab to **About this media**, press Enter, and confirm the dialog identifies source, permission basis, reviewed month/year, and attribution when supplied. Close it with Escape or **Close**; focus should return to the trigger.
4. Confirm **Compare this option** and **Visit the official provider site (opens a new tab)** are both visible, similarly styled, and that the official link opens in a separate tab.
5. Open a fixture with an approved-but-unrenderable embed and eligible illustration. Confirm the visible item is labelled **Scholar Scout illustration**, not presented as campus/provider evidence, and no embedded third-party surface appears.
6. Open a fixture whose media rights are invalid, revoked, expired, stale, or unsupported.

**Expected:** Safe media remains supplementary to facts; the disclosure is keyboard usable and clear. Illustration is visibly labelled and non-affiliating. Invalid media shows the factual **Visual media needs rights review** fallback with no iframe, remote media, or missing factual sources.

**Evidence / notes:** ________________________________________________

## 3. Public Stories route

1. Open `/stories` in a narrow phone-width viewport.
2. Starting at the page top, use Tab and Enter to reach **Skip to factual opportunities** and then each story destination.
3. Confirm there are six concise Scholar Scout context records, each with visible language that it is not provider affiliation, attendance, placement, endorsement, or outcome evidence.
4. Open one story destination and confirm it reaches a factual `/programmes` browse URL for an approved region/pathway.
5. Confirm the page shows no upload, form, sign-in, profile, testimonial, provider-specific story, audio, video, or autoplay control.

**Expected:** Stories are optional, text-first orientation only; keyboard navigation is clear at narrow width, every exit leads to controlled factual browsing, and nothing reads as personal/provider testimony.

**Evidence / notes:** ________________________________________________

## Completion

- [ ] All three checks passed
- [ ] A failure was captured above with URL, browser/device, and a screenshot or concise reproduction note

If any check fails, do not mark Phase 13 complete; return the evidence to the GSD workflow for repair and re-verification.
