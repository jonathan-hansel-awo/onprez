# Public Presence Page Conversion Acceptance

**Action-plan item:** P2-004 — Optimise Public Pages for Conversion, Not Just Beauty  
**Original delivery:** [PR #50](https://github.com/jonathan-hansel-awo/onprez/pull/50)  
**Revalidation date:** 31 July 2026

## Purpose

A public OnPrez presence page must help a visitor understand the business quickly, trust what is shown, and begin a real booking without searching for the next action. Visual quality supports that goal, but it does not replace it.

## Repository acceptance matrix

| Requirement                               | Repository evidence                                                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sticky mobile booking action              | `StickyMobileBookingCta` remains fixed to the bottom edge, uses a safe-area-aware inset, links directly to `/{handle}/book`, and is hidden on desktop.                                                           |
| Booking action does not cover content     | `SectionRenderer` reserves mobile bottom space using the same safe-area boundary as the fixed action. The outer public-page shell does not add a second competing offset.                                        |
| Clear service decision information        | `ServicesSection` displays the service name, description, price type and currency, duration, next live availability, and a service-specific booking link.                                                        |
| Booking action after high-intent sections | Desktop conversion prompts follow Services, Testimonials, and FAQ sections while the mobile action remains continuously available.                                                                               |
| Genuine trust markers                     | The page derives published review count and average, configured location, credentials, cancellation notice, and response-time claims from stored business data. Missing claims are omitted rather than invented. |
| Direct booking routes                     | Hero, navigation, service, section, contact, and sticky booking actions resolve to the real public booking flow.                                                                                                 |
| Reduced first-decision clutter            | The hero leads with the business promise and primary action; compact trust signals follow it; secondary sections load below the initial decision area.                                                           |
| Theme compatibility                       | Persistent and repeated conversion controls use the business theme surface and text variables rather than assuming a white page.                                                                                 |

## Automated regression contract

The focused conversion tests must continue to prove that:

- only genuine configured trust signals render;
- repeated and persistent calls to action use the public booking route;
- the default hero booking action does not fall back to a contact anchor;
- service cards expose price, duration, live availability, and a direct service route;
- the mobile booking shortcut is fixed, mobile-only, safe-area aware, and has a minimum accessible touch height;
- the renderer reserves sufficient bottom space for the fixed mobile action.

## Manual comprehension check

Use a published standard template and a published premium template. Test at 320 px, 375 px, 430 px, and a desktop width of at least 1280 px.

Give the tester no explanation beyond: **“You are considering booking this business. Tell me what it offers and begin booking the service you would choose.”**

Record:

| Field                           | Evidence                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Business and device             | Handle, template, viewport, browser                                           |
| Time to describe the offer      | Target: under 10 seconds                                                      |
| First booking action used       | Hero, navbar, service card, repeated prompt, contact, or sticky mobile action |
| Taps or clicks to enter booking | Target: one from the current public-page position                             |
| Content obstruction             | None; especially above the mobile safe area                                   |
| Trust information noticed       | Only claims genuinely present on the page                                     |
| Confusion or hesitation         | Exact words and page position                                                 |

Do not fabricate participant results. Record genuine sessions as ongoing launch evidence and turn repeated friction from three independent businesses into a Core improvement under the MVP scope rules.

## Change-control rule

Any future public-page redesign must preserve the conversion contract above. A visually stronger template is not acceptable if it hides live service information, removes direct booking routes, covers content with the mobile action, or introduces unsupported trust claims.
