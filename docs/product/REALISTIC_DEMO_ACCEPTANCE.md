# Realistic Demo Presence Acceptance

**Action-plan item:** P2-005 — Create a Realistic Demo Presence Page  
**Original deliveries:** [PR #51](https://github.com/jonathan-hansel-awo/onprez/pull/51) and [PR #52](https://github.com/jonathan-hansel-awo/onprez/pull/52)  
**Revalidation date:** 31 July 2026

## Purpose

A realistic OnPrez demo must behave like a credible service business page rather than a decorative template mock-up. It should expose long-copy, service-card, mobile, operational-detail, and booking-flow weaknesses before customers encounter them.

The demo data remains code-backed and explicitly fictional. It must not create fake production businesses, customers, reviews, or appointments.

## Canonical demos

| Demo | Sector | Route |
| --- | --- | --- |
| Heavenly Pamper Palace | Private wellness and beauty studio | `/templates/heavenly-pamper-palace?businessName=Heavenly%20Pamper%20Palace&view=client` |
| Crown & Canvas Studio | Textured hair and makeup studio | `/templates/editorial-beauty?businessName=Crown%20%26%20Canvas%20Studio&view=client` |

## Acceptance contract

A full realistic demo must provide and visibly exercise:

- a credible business name, niche, positioning statement, owner biography, credentials, contact details, and location;
- at least five realistically named services with production-length descriptions, prices, durations, and suitable imagery;
- a complete seven-day opening-hours schedule;
- realistic appointment examples that can be selected in an interactive booking journey;
- policies or preparation guidance that affect a booking decision;
- realistic FAQs and clearly fictional testimonial content;
- a direct path from homepage and examples pages;
- the same canonical template engine and section renderer used by account previews and published pages;
- a client-view route suitable for screenshots and onboarding demonstrations;
- mobile-safe controls and no collection of personal information in the booking simulation.

## Booking-demo safety

The interactive booking example intentionally stops before customer details or confirmation. It demonstrates service and time selection, presents a booking summary, and then routes the visitor to template signup. No database record, email, payment, or analytics event representing a real booking is created.

All Book actions on the two canonical realistic previews resolve to `#demo-booking`. Ordinary template previews continue to route their actions directly to signup.

## Regression coverage

Automated tests protect:

- fixture depth: services, opening hours, policies, FAQs, reviews, credentials, images, and sample slots;
- secure image URLs and stable client-view routes;
- rendering of opening hours and policies in both realistic sectors;
- service and appointment-time selection;
- the review summary and signup handoff;
- exclusion of demo-only operational content from ordinary templates.

## Manual review

Before using a demo in screenshots or onboarding:

1. Open the client-view route at 375px width and on a desktop viewport.
2. Confirm long business and service copy does not overflow.
3. Use a hero, service, or sticky Book action and confirm it reaches the interactive demo.
4. Select a non-default service and appointment time, then review the summary.
5. Confirm opening hours, location, contact details, and policies are readable.
6. Confirm the final action routes to signup and that no personal details are requested.
7. Confirm the page identifies its content as fictional demonstration content outside client view.
