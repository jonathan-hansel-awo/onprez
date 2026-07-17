# FP-003 — Reusable Premium Presence Sections

**Status:** Complete

**Priority:** P0

## Goal

Provide reusable, mobile-first React sections that can be composed into distinctive OnPrez templates without introducing unrestricted custom HTML or a separate presence renderer.

## Delivered variants

| Family | Variant |
| --- | --- |
| Hero | Full-bleed image hero |
| Hero | Split image-and-copy hero |
| About | Editorial introduction |
| About | Founder or practitioner profile |
| Services | Image-led service cards |
| Services | Compact service list |
| Gallery | Full-width gallery |
| Testimonials | Featured testimonial |
| Trust | Trust and credentials strip |
| Contact | Location and opening-hours panel |
| FAQ | Accessible FAQ accordion |
| Booking | Booking CTA banner |
| Booking | Sticky mobile booking CTA |
| Social | Instagram and social-link section |

## Implementation

The reusable component library is located at:

```text
src/components/presence/premium/PremiumSectionVariants.tsx
```

Public exports are provided through:

```text
src/components/presence/premium/index.ts
```

The canonical registry and identifiers are located at:

```text
src/types/premium-section-variants.ts
```

## Design rules

- Components are mobile-first and responsive.
- Booking actions use real links rather than inert preview controls.
- Components accept typed content and business data.
- Visual styling uses theme CSS variables where appropriate.
- Images are passed as content rather than hard-coded to one business.
- No sample uses the project owner's name or personal handle.
- No unrestricted HTML, scripts, or user-provided CSS are introduced.
- The primitives are template-agnostic and can be used by wellness, beauty, fitness, professional, creative, and education templates.

## Accessibility

The initial variants include:

- Semantic headings, sections, articles, figures, lists, and definition lists
- Text alternatives for image-backed content
- Native disclosure behaviour for FAQs
- Minimum-height booking actions suitable for touch
- Safe-area support for the sticky mobile booking CTA
- Visible text labels rather than icon-only primary actions

## Template integration

FP-003 intentionally creates reusable primitives rather than binding them to a single template. FP-007 will compose these sections into the first complete Luxury Wellness template. FP-004 can also use them to render realistic template previews.

Existing published pages continue to use the current `SectionRenderer` without behavioural changes. Premium sections can be introduced through typed template composition and then integrated into the canonical renderer without creating a parallel page system.

## Tests

The registry tests verify that:

- Every required FP-003 variant is registered.
- Variant identifiers are unique.
- Every initial variant is marked as mobile-first.
- Registry lookup returns the expected definition.

Test file:

```text
src/types/__tests__/premium-section-variants.test.ts
```

## Acceptance criteria

- [x] Full-bleed image hero created.
- [x] Split image-and-copy hero created.
- [x] Editorial introduction created.
- [x] Practitioner profile created.
- [x] Image-led service cards created.
- [x] Compact service list created.
- [x] Full-width gallery created.
- [x] Featured testimonial created.
- [x] Trust and credentials strip created.
- [x] Location and opening-hours panel created.
- [x] FAQ accordion created.
- [x] Booking CTA banner created.
- [x] Sticky mobile booking CTA created.
- [x] Instagram and social-link section created.
- [x] Variant registry and tests added.

**FP-003 is complete.**
