# FP-002 — Presence Template Data Model

**Status:** Complete  
**Priority:** P0

## Decision

Templates are versioned catalogue definitions that contain metadata, theme defaults, standard `PageSection[]` content, and explicit customisation boundaries.

Applying a template creates an independent snapshot for the business. Existing pages therefore remain unchanged when the catalogue template is improved later.

## Canonical code model

The model is defined in:

```text
src/types/presence-template.ts
```

It contains:

- `PresenceTemplateMetadata`
- `PresenceTemplateTheme`
- `PresenceTemplateCustomisationPolicy`
- `PresenceTemplateDefinition`
- `AppliedPresenceTemplateSnapshot`
- `applyPresenceTemplate()`
- `validatePresenceTemplate()`

## Identity and versioning

Each template has:

- a stable internal `id`
- a human-readable unique `slug`
- an incrementing template `version`
- a schema version
- lifecycle status: `DRAFT`, `PUBLISHED`, or `ARCHIVED`

A material catalogue change should increment the template version. Applying a template records the exact template ID, slug, and version used.

## Metadata

Template metadata includes:

- category
- name
- description
- thumbnail
- preview images
- tags
- featured status
- creation and update timestamps

Initial categories are:

- Wellness
- Beauty
- Fitness
- Professional
- Creative
- Education

## Theme defaults

The theme stores renderer-compatible design defaults:

- primary, secondary, and accent colours
- background, text, and muted-text colours
- heading and body font families
- border radius
- section-spacing density

These are defaults, not a permanent link to the catalogue template.

## Page composition

Templates contain standard `PageSection[]` values from `src/types/page-sections.ts`.

This ensures template previews and published pages remain compatible with `SectionRenderer`. FP-003 may extend section data with controlled variants, but it should not introduce a separate template-only renderer.

## Customisation policy

Each template declares what a user may customise, including:

- business identity
- logo and imagery
- colours and typography
- section order and visibility
- section content
- services
- contact details and social links
- policies and FAQs

The policy also defines:

- required section types
- section types that require a warning before hiding
- protected capabilities such as booking entry, service discovery, and contact fallback

A template may therefore remain flexible without allowing ordinary customisation to silently remove its core conversion path.

## Copy-on-apply behaviour

`applyPresenceTemplate()` deep-copies the theme and sections into an `AppliedPresenceTemplateSnapshot`.

Consequences:

1. The business receives an independently editable page.
2. Future template changes do not mutate existing business pages.
3. The applied template version remains available for support, analytics, and optional future migrations.
4. A future explicit “update to latest template” feature can be designed separately rather than happening automatically.

## Validation rules

The initial validator checks that:

- the template version is valid
- at least one section exists
- required section types are visible
- a template protecting booking entry includes a visible services section

FP-003 and later implementation can add stronger validation as section variants and booking CTA capabilities are introduced.

## Persistence decision

FP-002 defines the canonical application model but does not add a Prisma table yet.

The first templates can live as typed code definitions because they are product-owned, version-controlled assets. Database persistence should be introduced only when OnPrez needs non-developer template publishing, marketplace templates, or runtime template administration.

Business pages continue to persist copied theme and section data using the existing business and page records.

## Compatibility and evolution

- Published business pages are never automatically changed by template catalogue updates.
- Template definitions must use the standard presence renderer.
- Breaking model changes increment `PRESENCE_TEMPLATE_SCHEMA_VERSION` and require an explicit migration strategy.
- Archived templates remain identifiable for businesses that previously applied them.

## Tests

The model tests verify that:

- applying a template produces an independent copy
- source template data is not mutated by business customisation
- valid conversion-safe templates pass validation
- hidden required sections fail validation

Test file:

```text
src/types/__tests__/presence-template.test.ts
```

## Acceptance-criteria result

- [x] Template identity and metadata structure defined.
- [x] Category, name, description, thumbnail, and previews defined.
- [x] Typography, colours, spacing, and section order represented.
- [x] Customisable properties declared explicitly.
- [x] Required conversion elements can be protected.
- [x] Copy-on-apply behaviour implemented.
- [x] Later template edits do not unexpectedly alter existing pages.
- [x] Model remains compatible with `PageSection[]` and `SectionRenderer`.

**FP-002 is complete.**
