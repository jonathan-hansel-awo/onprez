# Marketing Claims Integrity Acceptance

## Purpose

P2-013 removes unsupported popularity, activity, testimonial, and outcome claims from public OnPrez marketing. Until OnPrez has genuine, attributable evidence, the homepage must demonstrate the product rather than imply traction or customer outcomes that have not been verified.

## Removed claims and fixtures

The homepage no longer presents:

- “Join thousands” or equivalent adoption claims;
- a “live” stream of fictional professionals;
- fabricated handle claims, bookings, upgrades, visits, or profile-view counts;
- invented testimonial identities, ratings, or video testimonials;
- unsupported before-and-after metrics;
- claimed booking-rate, time-saving, rating, or revenue improvements.

The source components and fixture data that generated those claims are removed rather than retained behind softer wording.

## Allowed product proof

Public marketing may use evidence that visitors can inspect directly:

- the working homepage product scenario;
- realistic, explicitly fictional example presence pages;
- interactive service-and-time booking demonstrations that create no records;
- feature walkthroughs tied to implemented product behaviour;
- transparent pricing and plan limits;
- screenshots or demonstrations of real OnPrez interfaces;
- genuine testimonials or metrics only after consent, attribution, and supporting evidence are recorded.

## Claims standard

A quantitative or customer-outcome claim must have all of the following before publication:

1. A named owner responsible for the evidence.
2. A durable source such as analytics, billing records, a research log, or written customer consent.
3. A defined measurement window and denominator.
4. Clear wording that does not generalise beyond the evidence.
5. A review date or expiry condition.

Anonymous, illustrative, estimated, or fictional data must never be styled as live customer activity or genuine endorsement.

## Regression protection

`src/components/landing/__tests__/marketing-integrity.test.ts` verifies that:

- the homepage retains demonstrable product proof;
- fabricated activity and testimonial source files remain removed; and
- the known unsupported claims cannot reappear in public landing-page source.

## Future genuine proof

When OnPrez has real customers, new proof should be added through a documented evidence record containing:

- the exact approved quote or metric;
- the customer’s consent and display preference;
- the source and calculation method;
- the applicable date range; and
- a review date for continued accuracy.

Until then, product demonstrations remain the canonical marketing proof.
