# Premium Canonical Renderer

The canonical presence renderer now supports premium art direction without splitting previews, drafts, and published pages into separate implementations.

## What changed

The shared renderer now supports:

- floating, editorial, and standard navigation treatments
- full-bleed, framed, arched, offset, and collage hero imagery
- template-specific hero typography, metadata chips, decorative display text, and floating information cards
- story, atelier, and credentials-led about sections
- quote treatments, proof statistics, layered secondary imagery, and premium image framing
- panel and immersive contact finales with booking actions, background imagery, contact details, and social links
- template-level pattern and gradient backgrounds through the existing theme provider

These capabilities are stored in canonical section data, so the same components render:

- public template previews
- newly selected account templates
- editor previews
- saved drafts
- published presence pages
- pages rebuilt through the overhaul command

## Template art direction

Each catalogue template has an independent composition profile rather than merely changing colours:

- **Serene Wellness:** arched imagery, soft wave pattern, restorative story layout, immersive booking finale
- **Heavenly Pamper Palace:** cream-and-gold luxury hero, signature experience card, layered spa story, cinematic finale
- **Regent Barber:** charcoal editorial navigation, oversized type, offset imagery, precision-led proof and booking
- **Editorial Beauty:** collage hero, atelier story treatment, portfolio-first rhythm, studio finale
- **Kinetic Fitness:** bold statement hero, programme proof, stacked imagery, action-led booking panel
- **Clear Professional:** restrained framed imagery, confidentiality and clarity proof, consultation-led finale
- **Frame Creative:** collage composition, portfolio storytelling, polaroid details, immersive commission CTA
- **Bright Education:** approachable editorial hero, progress proof, layered learning story, clear next-step panel

## Compatibility and safety

- No new top-level section types were introduced, so the existing editor and persistence model remain compatible.
- Existing section fields continue to work; the new presentation fields are optional.
- Services, prices, durations, availability, bookings, and business contact details remain database-backed.
- The repair and overhaul command modes remain unchanged.
- Canonical template version `2` ensures the upgraded compositions can be identified and reapplied deliberately.

## Updating existing demo presences

After merge and deployment, preview the version-2 overhaul:

```bash
npm run presence:repair-template-fidelity -- --dry-run=true
```

Apply it to draft content and currently published snapshots:

```bash
npm run presence:repair-template-fidelity -- --publish=true
```
