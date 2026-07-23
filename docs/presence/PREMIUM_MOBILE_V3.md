# Premium presence mobile correction

## Purpose

This correction restores mobile-first behaviour to the canonical premium presence renderer without creating a second preview-only implementation.

## What changed

- Premium section spacing now starts smaller on phones and scales through tablet and desktop breakpoints.
- Hero and section headings use guarded fluid sizing on narrow viewports.
- Hero booking actions become full-width and easier to tap on phones.
- Decorative floating hero cards and secondary collage images no longer overlap core content on narrow screens.
- Premium templates keep their own composition instead of receiving generic white conversion strips after Services and FAQ.
- The sticky mobile action uses the customer-facing label **Book an appointment**.
- Persisted variants of **Try Booking** are normalised at render time so existing draft and published snapshots are corrected without a database rewrite.
- Editorial Beauty returns to its original full-bleed, image-led hero direction with a dark editorial overlay rather than compressing a desktop collage into a phone viewport.

## Rendering contract

The same `SectionRenderer` continues to power template previews, account drafts, editor previews and published presence pages. Runtime art-direction repair is presentation-only and does not rewrite services, bookings, availability, business records or saved page content.

## Manual viewport checks

Check each premium template at:

- 320 × 568
- 375 × 667
- 390 × 844
- 430 × 932
- 768 × 1024
- 1024 × 768
- 1440 × 900

Confirm:

- no horizontal scrolling
- no overlapping decorative cards or secondary images
- readable headings without single-letter wrapping
- primary booking actions remain visible and tappable
- the sticky mobile booking action respects the device safe area
- desktop composition remains unchanged outside the mobile guardrails
