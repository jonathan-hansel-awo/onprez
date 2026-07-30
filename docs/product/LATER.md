# OnPrez Later Queue

**Purpose:** Capture useful ideas without interrupting the launch-critical presence-and-booking work.  
**Related scope decision:** [`MVP_SCOPE.md`](./MVP_SCOPE.md)  
**Decision date:** 30 July 2026

## Important boundary

**Team members are not deferred.** Invitations, acceptance, member management, launch roles, and tenant-safe permissions remain Core because excluding teams would unnecessarily limit launch businesses and real-user testing.

Only workforce features beyond the launch collaboration need are deferred, such as payroll, commissions, rota optimisation, attendance, timesheets, performance scoring, and HR administration.

## How to use this file

Add a new idea here before scheduling implementation. Existing shipped features listed below should remain stable and secure, but receive no material expansion until their evidence trigger is met.

An item can leave Later when:

1. the trigger is supported by observed user behaviour or commercial evidence;
2. the promotion identifies the Core outcome it supports;
3. the scope matrix is updated in the same pull request; and
4. the next-ten-session commitment is not silently displaced.

## Deferred product work

| Area | Deferred scope | What remains allowed now | Evidence required to revisit |
| --- | --- | --- | --- |
| Advanced analytics | Revenue dashboards, service-performance analysis, customer insights, booking trends, inquiry analytics, advanced charts, comparative analytics, and goals. | Maintain basic operational counts and the P2-001 loop analytics. | Three paying businesses make a repeated decision that cannot be made from basic booking data. |
| Customer segmentation | Saved segments, automated cohorts, targeted campaigns, and behavioural scoring. | Basic customer records, booking history, and manual notes/tags may remain stable. | Five active businesses repeatedly request the same segmentation workflow. |
| Service variants and add-ons | New variant models, complex add-on rules, conditional pricing, bundles, and upsell flows. | Preserve existing variant behaviour and fix correctness or security defects. | Three launch businesses lose or cannot accept bookings because the base service model is insufficient. |
| PDF and print tools | PDF business cards, downloadable marketing packs, print layouts, and export styling. | Shareable handle, copy-link, and existing simple sharing remain available. | Measured demand from at least five active businesses or a paid-plan conversion case. |
| QR and social growth tooling | QR campaigns, attribution dashboards, scheduled social publishing, and network-specific integrations. | Existing basic QR or share actions may remain stable. | Repeated acquisition evidence shows these tools would materially increase bookings. |
| Complex template editor | Free-form page building, arbitrary layout controls, deep theme systems, and unlimited design primitives. | Curated templates, essential branding, gallery, and reliable preview/publish remain supported. | Five paying businesses cannot express their brand adequately with the curated system. |
| Inquiry reply inbox | Threaded inbox, assignment, canned replies, SLA tools, priorities, and automation. | Public inquiry capture may remain stable where already shipped. | Three businesses use inquiries weekly and require replies inside OnPrez rather than email. |
| CRM expansion | Customer import/export, communication history, automated follow-ups, pipelines, and bulk actions. | Customer list, booking history, and essential contact context may remain stable. | Repeated migration or retention blockers across three paying businesses. |
| Referral attribution | Source tracking, campaign attribution, referral dashboards, and partner reporting. | Manual referral recording for founding-member operations. | The referral programme is active and attribution errors affect rewards or billing. |
| Workforce management | Payroll, commissions, rotas, shifts, leave, attendance, timesheets, productivity, and HR records. | Core team invitations, roles, permissions, membership, and booking operations remain in scope. | Multi-member businesses complete the core loop but repeatedly identify one workforce feature as a blocker. |
| Marketplace/discovery | Public marketplace ranking, category discovery, promoted listings, reviews marketplace, and lead auctions. | Direct handle sharing and search-engine discoverability. | A stable supply of active businesses and evidence that marketplace discovery is the next acquisition constraint. |
| Native applications | Separate iOS/Android codebases and app-store-only features. | Maintain the installable PWA and push-notification path. | PWA limitations demonstrably block retention or a paid workflow. |

## Implemented-but-frozen rule

Some Later capabilities already exist in partial or usable form. P2-002 does not require deleting them. During the scope-lock period:

- correctness, security, privacy, accessibility, and production bugs may be fixed;
- provider or framework compatibility may be maintained;
- expansion, redesign, new subfeatures, and promotional emphasis are deferred;
- the feature must not displace the next ten Core sessions.

## Idea capture template

Copy this block for each new idea:

```md
### YYYY-MM-DD — Idea name

- **User/problem observed:**
- **Who experienced it:**
- **Evidence count:**
- **Current workaround:**
- **Proposed outcome:**
- **Suggested class:** Later
- **Revisit trigger:**
- **Core work it must not displace:**
```

## Captured ideas

No additional unclassified ideas are pending at the time of this scope lock.
