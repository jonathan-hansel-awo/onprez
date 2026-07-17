# FP-001 — Existing Example Presence Experience Audit

**Status:** Complete  
**Priority:** P0  
**Scope:** Homepage examples entry point, example-card implementation, public presence route, shared section renderer, and readiness for a template-preview experience.

## Executive finding

OnPrez does **not currently have a functioning example presence-page route**.

The homepage includes an animated examples carousel, but its cards are presentation-only mockups. The visible “View Live Page” control does not navigate anywhere, and the carousel’s final CTA is wired with the Lucide `Link` icon component rather than Next.js `Link`, so it is not a valid navigation implementation.

The real published presence path is `src/app/[handle]/page.tsx`. It uses database-backed business/page records and the shared `SectionRenderer`. This is the correct rendering path to preserve for future template previews.

The template-gallery work should therefore replace the current mock-card experience with previews that feed template/demo data through the same section renderer used by published pages.

---

## 1. Current homepage entry point

### Location

- `src/app/page.tsx`
- `src/components/landing/examples-carousel.tsx`
- `src/components/landing/example-card.tsx`
- `src/data/examples.ts`

### Current flow

```text
Homepage
→ ExamplesCarousel
→ ExampleCard
→ “View Live Page” button
→ no navigation
```

The carousel is loaded below the fold from `src/app/page.tsx` through a dynamic import.

### Important defects

1. **“View Live Page” is non-functional.**
   - It is rendered as a button with no route or click handler for the centre card.
   - Clicking side cards only rotates the carousel.

2. **The signup CTA uses the wrong `Link`.**
   - `examples-carousel.tsx` imports `Link` from `lucide-react`.
   - It then attempts to use that icon component as a wrapper with `href="/signup"`.
   - This is not a valid Next.js navigation link and should be replaced by `next/link`.

3. **The examples are not presence pages.**
   - They are compact profile/stat cards.
   - They do not render services, availability, booking, gallery, contact, FAQs, or page sections.

4. **The carousel makes unverified traction claims.**
   - The data contains fabricated-looking bookings, views, and ratings.
   - The copy describes the examples as “Real professionals using OnPrez”.
   - This conflicts with the project’s trust and honest-social-proof direction.

---

## 2. Example data source

### Location

`src/data/examples.ts`

### Current model

The `Example` model contains:

- name
- profession
- handle
- category
- emoji image
- bookings/views/rating
- gradient classes

### Limitations

The model cannot describe an actual presence template. It lacks:

- template identity and metadata
- page section definitions
- typography configuration
- layout variants
- theme tokens
- imagery and focal points
- services and service presentation
- availability or booking configuration
- gallery content
- business details
- FAQs, policies, testimonials, and trust content
- template customisation rules

### Conclusion

The existing example data should not be expanded into the canonical template model. It may be retained temporarily for the old carousel, but FP-002 should introduce a dedicated template definition that produces valid `PageSection[]` data for `SectionRenderer`.

---

## 3. Actual published presence route

### Location

`src/app/[handle]/page.tsx`

### Rendering path

```text
/[handle]
→ fetch published Business
→ fetch published home Page
→ choose publishedContent, falling back to content
→ ThemeProvider
→ SectionRenderer
```

### Reusable strengths

- Uses the real business slug/handle.
- Rejects missing or unpublished businesses.
- Separates draft and published page content.
- Uses a shared `ThemeProvider`.
- Uses `SectionRenderer` for page composition.
- Passes business identity and contact data into sections.
- Includes structured data and page-specific SEO metadata.
- Supports dynamic rendering when build-time database access is unavailable.

### Preview implication

Future template previews should not create a second visual rendering system. A preview route should provide demo/template data to the same `ThemeProvider` and `SectionRenderer` composition used here.

A small shared presence-shell abstraction may be useful later so database-backed pages and template previews share the same outer rendering code as well as the same section components.

---

## 4. Shared section renderer

### Location

`src/components/presence/sections/SectionRenderer.tsx`

### Currently supported sections

- Navbar
- Hero
- About
- Services
- Gallery
- Contact
- FAQ
- Testimonials
- Custom HTML
- Inquiry form appended from business settings

### Reusable strengths

- Orders and filters sections consistently.
- Uses the same renderer for all published businesses.
- Lazy-loads below-the-fold sections.
- Already accepts the business handle required by service/booking entry.
- Provides a strong foundation for real template previews.

### Current limitations

1. **Limited section variants**
   - Section type determines one main component.
   - Showcase-grade templates need controlled variants within those section types.

2. **No template metadata awareness**
   - The renderer receives page sections, not template identity or template-level layout rules.

3. **Custom HTML remains in the renderer**
   - The project has decided against unrestricted custom HTML as the template strategy.
   - Its current security and product role should be audited separately before wider use.

4. **Inquiry section is appended outside page ordering**
   - It cannot currently be positioned as part of a template’s deliberate section composition.

5. **No standard sticky mobile booking CTA at renderer level**
   - This is required for the pilot’s conversion-focused public experience.

---

## 5. Visual and UX gap assessment

### Layout

Current example cards are profile summaries, not full-page compositions. They do not communicate what a client will actually experience after opening an OnPrez link.

### Typography

The examples use the shared landing-page typography and gradient treatment. They do not demonstrate template-specific font pairings or editorial hierarchy.

### Imagery

Examples use emoji avatars rather than realistic mobile-first page imagery. They cannot demonstrate image crops, full-bleed heroes, galleries, treatment imagery, or business branding.

### Service presentation

No services, prices, durations, descriptions, or service-level booking actions are shown.

### Booking entry

There is no working route from an example card into a public page or booking flow.

### Trust and contact

The examples show unsupported ratings and activity metrics rather than practical trust information such as location, practitioner details, policies, contact fallback, opening hours, or verified business details.

### Honesty

The heading and copy imply real customer traction. Until this is backed by real users, the gallery must explicitly label all content as sample/demo content.

---

## 6. Mobile behaviour assessment

### Current carousel

- Cards use a fixed `w-80` width.
- The container uses a fixed `h-[600px]`.
- Side cards are positioned approximately 350px from the centre.
- The section hides overflow.
- Arrow controls are hidden below the `md` breakpoint.
- Mobile navigation relies on progress dots and auto-rotation.

### Risks at common phone widths

- Fixed carousel height creates excessive vertical space.
- Side-card positioning offers little mobile value because the section clips overflow.
- Auto-rotation can move content while a user is reading.
- Progress dots are the only explicit mobile navigation control.
- The card demonstrates a desktop carousel concept rather than a mobile presence preview.
- The current UI does not show a realistic phone viewport or actual public-page content.

### Direction for FP-004

The template gallery should be mobile-first:

- responsive grid or horizontal snap list rather than a fixed absolute carousel
- realistic mobile preview thumbnails
- explicit “Preview template” and “Use this template” actions
- no reliance on auto-rotation
- complete keyboard and touch support
- actual preview route rather than inert buttons

---

## 7. Reuse vs replacement matrix

| Area | Decision | Notes |
|---|---|---|
| Homepage examples section position | Reuse | Existing placement can become the entry point to templates. |
| Carousel implementation | Replace | Fixed animated carousel is not suitable as the main gallery. |
| `ExampleCard` | Replace | It represents stats, not a template or public presence. |
| `src/data/examples.ts` | Retire or keep temporarily | Do not use it as the canonical template model. |
| `src/app/[handle]/page.tsx` | Reuse architecture | It is the canonical published-page path. |
| `ThemeProvider` | Reuse | Template previews should use the same theme application. |
| `SectionRenderer` | Reuse and extend | Add controlled visual variants rather than a parallel renderer. |
| Existing section components | Reuse and extend | Add premium variants in FP-003. |
| Booking/service components | Reuse | Preview must demonstrate the actual public booking entry. |
| Custom HTML strategy | Do not expand | Use reusable React section variants instead. |
| Example traction claims | Remove/replace | Label content as demo and avoid fabricated social proof. |

---

## 8. Recommended target architecture

```text
Template catalogue
→ template definition
→ demo business data + PageSection[]
→ shared presence preview shell
→ ThemeProvider
→ SectionRenderer
→ same section and booking components as /[handle]
```

Published pages should continue to use:

```text
Database business + published page
→ shared presence shell
→ ThemeProvider
→ SectionRenderer
```

This keeps template previews visually representative of the page a user will eventually publish.

---

## 9. Follow-on implementation requirements

### FP-002

Define a canonical template model that includes metadata, theme defaults, section definitions, customisation boundaries, and copy-on-apply behaviour.

### FP-003

Add reusable premium variants for the existing section types, including a full-bleed hero, image-led services, editorial about/practitioner section, trust strip, opening-hours/location panel, booking CTA banner, and sticky mobile booking CTA.

### FP-004

Replace the examples carousel with a template gallery and actual preview route. Correct the existing broken link behaviour as part of that implementation.

---

## 10. FP-001 acceptance-criteria result

- [x] The homepage examples entry point, route assumptions, components, and data source are identified.
- [x] The actual published presence rendering path is documented.
- [x] Reusable components and replacement candidates are identified.
- [x] Current limitations in layout, typography, imagery, services, booking, trust, and mobile behaviour are documented.
- [x] The architecture required to prevent preview/published-render drift is defined.

**FP-001 is complete.**
