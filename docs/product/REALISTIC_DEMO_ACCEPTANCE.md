# Realistic Demo Presence Acceptance

**Action-plan item:** P2-005 — Create a Realistic Demo Presence Page  
**Original deliveries:** [PR #51](https://github.com/jonathan-hansel-awo/onprez/pull/51) and [PR #52](https://github.com/jonathan-hansel-awo/onprez/pull/52)  
**Revalidation date:** 31 July 2026

## Purpose

An OnPrez template preview must behave like a credible service-business page rather than a decorative mock-up. It should expose long-copy, service-card, mobile, operational-detail, and booking-flow weaknesses before customers encounter them.

All preview data remains code-backed and explicitly fictional. It must not create fake production businesses, customers, reviews, appointments, emails, payments, or analytics records. This contract also applies when a visitor enters a template through the homepage or `/examples` gallery.

## Detailed canonical demos

| Demo                   | Sector                             | Route                                                                                   |
| ---------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| Aurelia Wellness House | Private wellness and beauty studio | `/templates/heavenly-pamper-palace?businessName=Aurelia%20Wellness%20House&view=client` |
| Crown & Canvas Studio  | Textured hair and makeup studio    | `/templates/editorial-beauty?businessName=Crown%20%26%20Canvas%20Studio&view=client`    |

The original `heavenly-pamper-palace` route slug remains for backwards compatibility, but the visible template is now named **Golden Serenity** and its fictional business identity is **Aurelia Wellness House**. The real Heavenly Pamper Palace business is not represented as demo content.

## Catalogue-wide booking contract

Every public template must provide and visibly exercise:

- at least one realistically named service with a price and duration;
- sample appointment times that can be selected in an interactive booking journey;
- a complete seven-day opening-hours schedule;
- category-appropriate policies or preparation guidance;
- fictional contact and location details;
- a review step showing the selected business, service, date, duration, and price;
- a direct handoff to signup without collecting personal information;
- mobile-safe controls and accessible pressed-state feedback;
- the same canonical template engine and section renderer used by account previews and published pages.

The two detailed canonical demos additionally include production-length service descriptions, owner biographies, credentials, richer policies, FAQs, reviews, imagery, and sector-specific appointment examples.

## Booking-demo safety

The interactive booking example intentionally stops before customer details or confirmation. It demonstrates service and time selection, presents a booking summary, and then routes the visitor to template signup.

All Book actions across the catalogue resolve to `#demo-booking`. No template preview creates a database record, sends an email, initiates payment, or records a fictional conversion.

## Identity safety

A demo identity must not reuse the name, contact details, reviews, or branding of a real OnPrez business unless that business has explicitly approved a case study. When a fictional demo name becomes a real customer identity, the demo must be renamed while preserving old template links where practical.

## Regression coverage

Automated tests protect:

- fixture depth for the two detailed demos;
- a complete generated booking fixture for every catalogue template;
- secure image URLs and stable client-view routes;
- rendering of opening hours and category-appropriate policies;
- service and appointment-time selection;
- personalised business names in the review summary;
- signup handoff without personal-data collection;
- exclusion of the real Heavenly Pamper Palace name from current demo business identities.

The catalogue-wide test iterates over `presenceTemplateCatalogue`, so adding a new public template without usable services, hours, policies, trust signals, or sample slots fails the regression contract.

## Manual review

Before using any template in screenshots or onboarding:

1. Open its client-view route at 375px width and on a desktop viewport.
2. Confirm long business and service copy does not overflow.
3. Use a hero, service, section, or sticky Book action and confirm it reaches the interactive demo.
4. Select a non-default service and appointment time, then review the summary.
5. Confirm opening hours, location, contact details, and policies are readable.
6. Confirm the final action routes to signup and that no personal details are requested.
7. Confirm the page identifies its content as fictional demonstration content outside client view.
