# FP-007 — Optional Meet the Owner Presence Section

## Goal

Add a reusable **Meet the Owner** section to the OnPrez presence editor so businesses can choose whether to include a personal introduction on their published page.

## Product behaviour

- The section is optional and disabled by default.
- Businesses can add, remove, show, hide, and reorder it like other presence sections.
- Supported fields:
  - Section eyebrow
  - Heading
  - Owner name
  - Role or title
  - Biography
  - Portrait image
  - Image alt text
  - Optional call-to-action label and destination
- Empty optional fields should not render.
- The portrait uses the existing media workflow and can be replaced without rebuilding the page.
- Preview and published views must remain visually consistent.

## Template behaviour

- Templates may recommend the section, but must not require it.
- Heavenly Pamper Palace can include it by default because personal trust is central to the experience.
- The premium barber-shop template should omit it by default.
- A business selecting either template can enable or disable the section later in the editor.

## Validation

- Validate field lengths and image metadata.
- Preserve accessibility requirements for heading order and image alt text.
- Include tests for create, edit, reorder, hide, delete, preview, and published rendering.
