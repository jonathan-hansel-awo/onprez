# FP-001 — Existing Example Presence Experience Audit

**Status:** Complete

**Priority:** P0

**Scope:** Homepage examples, the public presence route, the shared renderer, mobile behaviour, and template-preview readiness.

## Executive finding

OnPrez does not currently have a functioning example presence-page route.

The homepage examples are animated profile and statistics cards rather than rendered presence pages. The visible **View Live Page** button does not navigate anywhere, and the carousel imports `Link` from `lucide-react` instead of `next/link` for its signup CTA.

The canonical published presence path is `src/app/[handle]/page.tsx`. It renders database-backed business and page data through `ThemeProvider` and `SectionRenderer`. Template previews should use this same rendering path so previews accurately represent published pages.

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
→ “View Live Page”
→ no navigation
```

### Published presence path

```text
/[handle]
→ published Business
→ published home Page
→ ThemeProvider
→ SectionRenderer
```

The published route already provides the correct architectural foundation for template previews.

## Key defects and limitations

1. **The example CTA is inert.** The card does not open a preview or published presence page.
2. **The signup link is implemented with the wrong component.** It uses the Lucide icon rather than Next.js navigation.
3. **The examples are not presence pages.** They do not demonstrate services, booking, galleries, FAQs, contact details, or trust content.
4. **The example data implies unsupported traction.** Demo bookings, views, and ratings are presented as though they belong to real OnPrez customers.
5. **The data model is too limited.** It cannot represent template metadata, themes, sections, imagery, services, or customisation boundaries.
6. **The carousel is not mobile-first.** It relies on fixed dimensions, absolute positioning, auto-rotation, and progress dots.

## Reuse decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Homepage examples position | Reuse | It is a suitable entry point for a future template gallery. |
| Existing carousel | Replace | It does not provide a realistic or accessible template-browsing experience. |
| Existing example cards | Replace | They represent statistics rather than complete presence pages. |
| `src/data/examples.ts` | Retire or retain temporarily | It must not become the canonical template model. |
| Published presence architecture | Reuse | It is the canonical business-page path. |
| `ThemeProvider` | Reuse | Preview and published pages should share theme behaviour. |
| `SectionRenderer` | Reuse and extend | Premium templates should use controlled section variants. |
| Existing section components | Reuse and extend | They provide the base for FP-003. |
| Custom HTML | Do not expand | Reusable React sections are safer and maintainable. |
| Unsupported example metrics | Remove | Sample content must be clearly labelled as demo content. |

## Target architecture

```text
Template catalogue
→ versioned template definition
→ demo business data and PageSection[]
→ shared presence shell
→ ThemeProvider
→ SectionRenderer
```

Published pages should continue to use:

```text
Database business and published page
→ shared presence shell
→ ThemeProvider
→ SectionRenderer
```

This prevents visual drift between template previews and the page a user eventually publishes.

## Mobile direction

The replacement template gallery should provide:

- Responsive grid or horizontal snap navigation
- Realistic mobile preview thumbnails
- Explicit **Preview template** and **Use this template** actions
- Keyboard and touch support
- No required auto-rotation
- Clearly labelled sample content
- A real preview route

## Follow-on requirements

### FP-002

Define the canonical, versioned template model with metadata, theme defaults, standard `PageSection[]` content, customisation boundaries, and copy-on-apply behaviour.

### FP-003

Create reusable premium section variants for heroes, introductions, practitioner profiles, services, galleries, testimonials, trust content, contact details, booking calls to action, mobile booking, FAQs, and social links.

### FP-004

Replace the examples carousel with a responsive template gallery and working preview routes.

## Acceptance criteria

- [x] Homepage example components and data sources identified.
- [x] Published presence rendering path documented.
- [x] Reusable and replaceable components identified.
- [x] Layout, typography, imagery, booking, trust, and mobile limitations recorded.
- [x] Shared preview and published-render architecture defined.

**FP-001 is complete.**
