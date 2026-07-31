# OnPrez MVP Scope Lock

**Action-plan item:** P2-002 — Ruthlessly Defer Non-Core Features  
**Decision date:** 30 July 2026  
**Source roadmap:** `OnPrez - Complete Micro-Milestone Roadmap (Updated)`  
**Scope owner:** Product owner

## Product promise being protected

The launch product must let a service business create a credible, website-like presence, publish bookable services, share its OnPrez handle, receive bookings, and manage those bookings reliably on mobile.

A launch-ready business may be run by one person **or by a team**. Team members are therefore not deferred.

## Classification rules

| Class       | Meaning                                                                                                                    | Scheduling rule                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Core**    | Required to deliver, secure, or operate the first sellable presence-and-booking loop for solo and multi-member businesses. | May enter active work when it closes a verified launch gap.                                                        |
| **Support** | Useful around the core loop, but not a reason to delay first customer proof.                                               | Maintain existing behaviour; expand only with measured user friction, safety, compliance, or reliability evidence. |
| **Later**   | Valuable after launch proof, but not required for the first repeatable sale or real-user test.                             | Capture in [`LATER.md`](./LATER.md); do not schedule until its revisit trigger is met.                             |

Security, data-integrity, privacy, and production-incident work may interrupt the queue regardless of classification.

## Explicit team-members decision

The following are **Core** and remain in launch scope:

- team invitations;
- secure invitation acceptance;
- member listing and removal;
- owner, admin, and staff roles;
- tenant-safe permissions for team members;
- the ability for a multi-member business to complete the same publish, booking, and management loop as a solo operator.

This decision keeps salons, spas, barber shops, clinics, studios, agencies, and other multi-practitioner businesses within OnPrez's launch and testing market.

Advanced workforce management is different. Payroll, commissions, rota optimisation, performance scoring, time tracking, and similar HR features belong in `LATER.md`.

## Scope guardrails

1. New product ideas are added to `LATER.md` before they are considered for implementation.
2. An idea may bypass Later only when it:
   - fixes a security, privacy, tenancy, booking-correctness, or production-reliability issue;
   - removes a measured blocker in the first sellable loop;
   - is necessary for a solo or team-based launch business to complete that loop; or
   - is legally or operationally required for launch.
3. Existing non-core features are not removed merely because they are classified Later. They remain stable, but expansion stops.
4. A Later item returns to active consideration only when its documented evidence trigger is met.
5. Every pull request that adds product scope should name the affected Core outcome or link to the Later entry and its satisfied trigger.

## Next ten focused work sessions

These sessions are the scope commitment required by P2-002. Reordering is allowed only for production incidents, security/privacy work, or a directly observed blocker.

| Session | Focus                                                           | Completion evidence                                                                                         |
| ------: | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
|       1 | Merge the P2-002 scope lock and update the action-plan tracker. | Scope matrix and Later queue are in `main`.                                                                 |
|       2 | Audit the existing team-member loop end to end.                 | Owner invite, acceptance, role change, member listing, and removal are verified with tenant-boundary tests. |
|       3 | Harden team-member launch UX on mobile.                         | A multi-member business can understand roles and complete setup without hidden or clipped controls.         |
|       4 | Complete P2-003 and choose the first launch niche.              | Niche, assumptions, interview script, and validation sample are documented.                                 |
|       5 | Complete P2-010 draft-versus-live clarity.                      | Last-published time and draft/live differences are explicit.                                                |
|       6 | Complete P2-011 private preview workflow.                       | Safe, non-indexed preview links can be copied and reviewed.                                                 |
|       7 | Complete P2-012 dashboard information architecture.             | Core setup and booking actions are prominent; Team remains clearly discoverable.                            |
|       8 | Complete P2-013 marketing-claim verification.                   | Unsupported metrics and fabricated activity are removed or clearly labelled.                                |
|       9 | Complete P2-014 homepage positioning.                           | Homepage copy reflects the chosen niche and the presence-plus-booking promise.                              |
|      10 | Run a mobile launch smoke test for solo and team businesses.    | Both business types complete publish, share, book, and manage flows without assistance.                     |

## Full micro-milestone classification

The source roadmap currently contains **141 micro-milestones**. Every item is classified below. Classification controls future expansion; it does not erase already shipped functionality.

### Milestone 2

| ID   | Roadmap item              | Class       | Launch rule                                                                  |
| ---- | ------------------------- | ----------- | ---------------------------------------------------------------------------- |
| 2.1  | Neon Database Setup       | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 2.2  | Prisma Configuration      | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 2.3  | User & Business Models    | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 2.4  | Service Model             | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 2.5  | Customer Model            | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 2.6  | Appointment Model         | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 2.7  | Session & Security Models | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 2.8  | FAQ & Inquiry Models      | **Support** | FAQ support may continue; inquiry-thread expansion is frozen.                |
| 2.9  | Rate Limiting Schema      | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 2.10 | Initial Migration         | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 2.11 | Seed Data Script          | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 2.12 | Prisma Client Singleton   | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 2.13 | Repository Pattern Setup  | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |

### Milestone 3

| ID   | Roadmap item                   | Class       | Launch rule                                                                  |
| ---- | ------------------------------ | ----------- | ---------------------------------------------------------------------------- |
| 3.1  | Password Hashing Utilities     | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.2  | JWT Token Management           | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.3  | Session Management Service     | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.4  | Rate Limiting Service          | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.5  | Brute Force Protection Service | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.6  | Email Service with Resend      | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.7  | Sign Up Flow - Backend         | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.8  | Sign Up Flow - Frontend        | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.9  | Handle Availability API        | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.10 | Email Verification Flow        | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.11 | Login Flow - Backend           | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.12 | Login Flow - Frontend          | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.13 | Password Reset - Request Flow  | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.14 | Password Reset - Complete Flow | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.15 | MFA Setup - TOTP Generation    | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 3.16 | MFA Login Challenge            | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 3.17 | MFA Management                 | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 3.18 | Auth Middleware                | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.19 | Session Management Dashboard   | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 3.20 | Security Audit Log             | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 3.21 | Logout Functionality           | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 3.22 | Auth Context Provider          | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |

### Milestone 4

| ID   | Roadmap item                       | Class       | Launch rule                                                                  |
| ---- | ---------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| 4.1  | Business Settings Schema Extension | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 4.2  | Profile Dashboard Layout           | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 4.3  | Business Profile Settings Page     | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 4.4  | Business Branding Settings         | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 4.5  | Business Hours Configuration       | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 4.6  | Team Management - Invitations      | **Core**    | Launch core: owners must be able to invite staff before broad testing.       |
| 4.7  | Team Management - Acceptance       | **Core**    | Launch core: invited staff must be able to join safely.                      |
| 4.8  | Team Management - List             | **Core**    | Launch core: owners must be able to see and manage their team.               |
| 4.9  | Dashboard Overview Page            | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 4.10 | Business Feature Settings          | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |

### Milestone 5

| ID   | Roadmap item                 | Class       | Launch rule                                                                  |
| ---- | ---------------------------- | ----------- | ---------------------------------------------------------------------------- |
| 5.1  | Page Schema Design           | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 5.2  | Content Section Types        | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 5.3  | Template System              | **Core**    | Core only as a curated template path; a complex free-form editor is Later.   |
| 5.4  | Presence Editor Layout       | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 5.5  | Hero Section Editor          | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 5.6  | About Section Editor         | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 5.7  | Services Section Editor      | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 5.8  | Gallery Section Editor       | **Core**    | A basic gallery is core to the website-like branding promise.                |
| 5.9  | Contact Section Editor       | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 5.10 | FAQ Section Editor           | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 5.11 | FAQ Public Display Component | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 5.12 | FAQ API Endpoints            | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 5.13 | Inquiry Form Component       | **Later**   | Existing inquiry capture may remain, but further inbox work is deferred.     |
| 5.14 | Theme Customization          | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 5.15 | Live Preview Component       | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 5.16 | Save & Publish Flow          | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 5.17 | Public Presence Route        | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 5.18 | SEO Optimization             | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |

### Milestone 6

| ID   | Roadmap item           | Class     | Launch rule                                                                 |
| ---- | ---------------------- | --------- | --------------------------------------------------------------------------- |
| 6.1  | Services List Page     | **Core**  | May be scheduled when it directly completes or protects the sellable loop.  |
| 6.2  | Add Service Form       | **Core**  | May be scheduled when it directly completes or protects the sellable loop.  |
| 6.3  | Edit Service Form      | **Core**  | May be scheduled when it directly completes or protects the sellable loop.  |
| 6.4  | Service Categories     | **Core**  | May be scheduled when it directly completes or protects the sellable loop.  |
| 6.5  | Service Variants       | **Later** | Existing variants remain supported; new variant/add-on expansion is frozen. |
| 6.6  | Service Ordering       | **Core**  | May be scheduled when it directly completes or protects the sellable loop.  |
| 6.7  | Service Availability   | **Core**  | May be scheduled when it directly completes or protects the sellable loop.  |
| 6.8  | Active/Inactive Toggle | **Core**  | May be scheduled when it directly completes or protects the sellable loop.  |
| 6.9  | Service Images         | **Core**  | May be scheduled when it directly completes or protects the sellable loop.  |
| 6.10 | Service API Endpoints  | **Core**  | May be scheduled when it directly completes or protects the sellable loop.  |

### Milestone 7

| ID   | Roadmap item           | Class       | Launch rule                                                                  |
| ---- | ---------------------- | ----------- | ---------------------------------------------------------------------------- |
| 7.1  | Business Hours UI      | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 7.2  | Special Dates          | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 7.3  | Time Slot Generation   | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 7.4  | Booking Conflicts      | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 7.5  | Calendar Component     | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 7.6  | Availability API       | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 7.7  | Buffer Time Settings   | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 7.8  | Advance Booking Limits | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 7.9  | Same-Day Booking       | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 7.10 | Multi-Day Appointments | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |

### Milestone 8

| ID   | Roadmap item              | Class    | Launch rule                                                                |
| ---- | ------------------------- | -------- | -------------------------------------------------------------------------- |
| 8.1  | Booking Widget Design     | **Core** | May be scheduled when it directly completes or protects the sellable loop. |
| 8.2  | Service Selection Step    | **Core** | May be scheduled when it directly completes or protects the sellable loop. |
| 8.3  | Date Picker Step          | **Core** | May be scheduled when it directly completes or protects the sellable loop. |
| 8.4  | Time Slot Selection       | **Core** | May be scheduled when it directly completes or protects the sellable loop. |
| 8.5  | Customer Information Form | **Core** | May be scheduled when it directly completes or protects the sellable loop. |
| 8.6  | Booking Confirmation      | **Core** | May be scheduled when it directly completes or protects the sellable loop. |
| 8.7  | Create Booking API        | **Core** | May be scheduled when it directly completes or protects the sellable loop. |
| 8.8  | Booking Success Page      | **Core** | May be scheduled when it directly completes or protects the sellable loop. |
| 8.9  | Email Confirmation        | **Core** | May be scheduled when it directly completes or protects the sellable loop. |
| 8.10 | Error Handling            | **Core** | May be scheduled when it directly completes or protects the sellable loop. |
| 8.11 | Mobile Optimization       | **Core** | May be scheduled when it directly completes or protects the sellable loop. |

### Milestone 9

| ID   | Roadmap item             | Class       | Launch rule                                                                  |
| ---- | ------------------------ | ----------- | ---------------------------------------------------------------------------- |
| 9.1  | Bookings List View       | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 9.2  | Booking Detail Modal     | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 9.3  | Status Management        | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 9.4  | Reschedule Functionality | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 9.5  | Cancel Booking           | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 9.6  | Quick Create Booking     | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 9.7  | Booking Notes            | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 9.8  | Calendar Day View        | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 9.9  | Calendar Week View       | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 9.10 | Booking Reminders        | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |

### Milestone 10

| ID    | Roadmap item             | Class       | Launch rule                                                                  |
| ----- | ------------------------ | ----------- | ---------------------------------------------------------------------------- |
| 10.1  | Share Button Component   | **Core**    | May be scheduled when it directly completes or protects the sellable loop.   |
| 10.2  | QR Code Generation       | **Later**   | Existing QR sharing may remain; campaigns and further tooling are deferred.  |
| 10.3  | Business Card Template   | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 10.4  | Social Media Integration | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 10.5  | Open Graph Meta Tags     | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 10.6  | Analytics Tracking Setup | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 10.7  | Analytics Dashboard      | **Later**   | Keep current basic analytics stable; new dashboard expansion is deferred.    |
| 10.8  | Conversion Tracking      | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 10.9  | Referral Sources         | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 10.10 | SEO Tools                | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |

### Milestone 11

| ID    | Roadmap item            | Class       | Launch rule                                                                      |
| ----- | ----------------------- | ----------- | -------------------------------------------------------------------------------- |
| 11.1  | Customers List Page     | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk.     |
| 11.2  | Customer Detail View    | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk.     |
| 11.3  | Customer Notes          | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk.     |
| 11.4  | Customer Tags           | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk.     |
| 11.5  | Booking History         | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk.     |
| 11.6  | Customer Statistics     | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.       |
| 11.7  | Quick Actions           | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk.     |
| 11.8  | Customer Import/Export  | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.       |
| 11.9  | Communication Log       | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.       |
| 11.10 | Inquiry Submission API  | **Support** | Public inquiry submission may remain as support; reply-inbox expansion is Later. |
| 11.11 | Inquiry Inbox Dashboard | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.       |
| 11.12 | Inquiry Detail & Reply  | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.       |
| 11.13 | Inquiry Reply API       | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.       |
| 11.14 | Inquiry Settings        | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.       |
| 11.15 | Customer Segments       | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.       |

### Milestone 12

| ID    | Roadmap item             | Class       | Launch rule                                                                  |
| ----- | ------------------------ | ----------- | ---------------------------------------------------------------------------- |
| 12.1  | Revenue Analytics        | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 12.2  | Service Performance      | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 12.3  | Customer Insights        | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 12.4  | Booking Trends           | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 12.5  | Inquiry Analytics        | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 12.6  | Advanced Charts          | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 12.7  | Export Reports           | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 12.8  | Comparative Analytics    | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 12.9  | Goal Setting             | **Later**   | Capture in `LATER.md`; do not schedule before its evidence trigger is met.   |
| 12.10 | Performance Optimization | **Support** | Maintain; only expand when it measurably removes core-loop friction or risk. |
| 12.11 | Security Hardening       | **Core**    | Security work can interrupt the queue whenever risk requires it.             |
| 12.12 | Final Testing & Polish   | **Core**    | Required before launch and after material core-loop changes.                 |

## Review cadence

Review this scope after either of these triggers:

- five launch businesses have completed the first sellable loop and at least three are actively receiving bookings; or
- a repeated user problem is observed in three independent businesses.

A review may promote a Later item to Support or Core, but it must record the evidence and update both this file and `LATER.md`.
