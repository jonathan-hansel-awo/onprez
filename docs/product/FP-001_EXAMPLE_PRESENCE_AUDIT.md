# FP-001 — Existing Example Presence Experience Audit

**Status:** Complete  
**Priority:** P0  
**Scope:** Homepage examples, the public presence route, the shared renderer, mobile behaviour, and template-preview readiness.

## Executive finding

OnPrez does not currently have a functioning example presence-page route.

The homepage examples are animated profile and statistics cards rather than rendered presence pages. The visible **View Live Page** button does not navigate anywhere, and the carousel imports `Link` from `lucide-react` instead of `next/link` for its signup CTA.

The canonical published presence path is `src/app/[handle]/page.tsx`. It renders database-backed business and page data through `ThemeProvider` and `SectionRenderer`. Template previews should use this same rendering path rather than introducing a parallel visual system.

## Current implementation

### Homepage entry point

- `src/app/page.tsx`
- `src/components/landing/examples-carousel.tsx`
- `src/components/landing/example-card.tsx`
- `src/data/examples.ts`

Current flow:

```text
Homepage
→ ExamplesCarousel
→ ExampleCard
→ “View Live Page” button
→ no navigation
```

### Published presence path

```text
/[handle]
→ fetch published Business
→ fetch published home Page
→ use publishedContent or content
→ ThemeProvider
→ SectionRenderer
```

## Key defects and limitations

1. **No working example-page navigation**
   - The centre-card button has no route or handler.
   - Side-card clicks only rotate the carousel.

2. **Incorrect signup-link implementation**
   - `examples-carousel.tsx` imports the Lucide `Link` icon.
   - It attempts to use that icon as a link wrapper with `href="/signup"`.

3. **Examples are not presence pages**
   - They do not render services, availability, booking, gallery, contact, FAQs, or real page sections.

4. **The current data model is unsuitable for templates**
   - It contains names, professions, emoji, gradients, and fabricated-looking statistics.
   - It has no template metadata, theme defaults, section definitions, customisation rules, services, or booking configuration.

5. **Unverified social-proof claims**
   - The copy describes the examples as real professionals.
   - Booking, view, and rating figures appear to be sample values but are not labelled as such.

6. **Limited visual variation**
   - Templates cannot currently select controlled section variants.
   - Examples do not demonstrate typography pairings, editorial hierarchy, image treatment, or distinctive service layouts.

7. **Weak mobile presentation**
   - Cards use fixed dimensions and absolute positioning.
   - Mobile navigation relies on progress dots and auto-rotation.
   - The experience does not resemble a realistic mobile presence-page preview.

## Reuse decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Homepage examples position | Reuse | It is a suitable entry point into templates. |
| Current carousel | Replace | It is not suitable as the primary mobile-first gallery. |
| `ExampleCard` | Replace | It represents statistics rather than a template. |
| `src/data/examples.ts` | Retire gradually | It must not become the canonical template model. |
| `src/app/[handle]/page.tsx` | Reuse architecture | It is the canonical published-page path. |
| `ThemeProvider` | Reuse | Preview and published themes must behave consistently. |
| `SectionRenderer` | Reuse and extend | Templates should render through the standard section system. |
| Existing section components | Reuse and extend | Premium variants should be added rather than duplicated. |
| Booking and service components | Reuse | Previewed booking entry must match the real product. |
| Unrestricted custom HTML | Do not expand | Controlled React variants are safer and maintainable. |
| Example traction claims | Remove or relabel | Demo content must be explicit and honest. |

## Target architecture

```text
Template catalogue
→ immutable versioned template definition
→ demo business data + PageSection[]
→ shared presence shell
→ ThemeProvider
→ SectionRenderer
→ standard service and booking components
```

Published pages should continue to use:

```text
Database business + published page
→ shared presence shell
→ ThemeProvider
→ SectionRenderer
```

This prevents template previews from drifting away from the pages users ultimately publish.

## Follow-on requirements

### FP-002

Define the canonical template model, including metadata, versioning, theme defaults, page sections, customisation boundaries, protected conversion elements, and copy-on-apply behaviour.

### FP-003

Create reusable premium variants for hero, services, practitioner profile, trust content, location and hours, booking CTA, and mobile booking entry.

### FP-004

Replace the current carousel with a template gallery and a working preview route. Correct the broken link behaviour during that implementation.

## Acceptance-criteria result

- [x] Homepage entry point, components, route assumptions, and data source identified.
- [x] Canonical published rendering path documented.
- [x] Reusable components and replacement candidates identified.
- [x] Visual, content, booking, trust, and mobile limitations documented.
- [x] A shared preview and published-page architecture defined.

**FP-001 is complete.**
