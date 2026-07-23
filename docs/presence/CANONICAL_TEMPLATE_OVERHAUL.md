# Canonical Presence Template Overhaul

The presence fidelity command supports two deliberately different migration modes.

## Modes

### `overhaul` — default

Replaces the complete page-owned presence definition with the canonical public template mirror:

- section types and ordering
- section visibility
- template text and headings
- template imagery
- layouts, colours, spacing, cards, overlays, and gallery composition
- template-owned reviews and FAQs

It does **not** replace database-backed operational data. Services, prices, durations, service images, categories, bookings, availability, appointments, customers, business contact fields, SEO fields, social links, and non-template settings remain in their existing tables/settings and continue to be rendered dynamically.

The default overhaul targets are intentionally limited to the two approved demonstration businesses:

- `heavenlypamperpalace` → `heavenly-pamper-palace`
- `hanselisky` → `editorial-beauty`

For another business, overhaul mode requires the explicit acknowledgement flag `--allow-template-demo-content=true`, because the mirrored template may contain example reviews and FAQs.

### `repair`

Retains the earlier preservation-heavy behaviour. Existing meaningful hero, about, gallery, FAQ, testimonial, navbar, services-section, and contact-section content is merged into the canonical template presentation.

Use this mode when the account belongs to a real customer whose existing page-owned copy and media must be retained.

## Recommended production workflow

Always inspect the dry-run report first:

```bash
npm run presence:repair-template-fidelity -- --dry-run=true
```

The command now defaults to `overhaul`, so this reports the complete replacement for both approved demo businesses without changing the database.

Apply the overhaul to draft content only:

```bash
npm run presence:repair-template-fidelity
```

Apply it to draft content and also replace live `publishedContent` for pages that are already published:

```bash
npm run presence:repair-template-fidelity -- --publish=true
```

The command preserves the current publication state. `--publish=true` does not publish a draft page; it only updates the live snapshot when the page is already published.

## Target one approved demo business

```bash
npm run presence:repair-template-fidelity -- \
  --business=heavenlypamperpalace \
  --template=heavenly-pamper-palace \
  --mode=overhaul \
  --dry-run=true
```

Then apply it:

```bash
npm run presence:repair-template-fidelity -- \
  --business=heavenlypamperpalace \
  --template=heavenly-pamper-palace \
  --mode=overhaul \
  --publish=true
```

## Use the legacy repair policy

```bash
npm run presence:repair-template-fidelity -- \
  --business=heavenlypamperpalace \
  --template=heavenly-pamper-palace \
  --mode=repair \
  --dry-run=true
```

## Overhaul another business

This is intentionally explicit because it can introduce template example reviews and FAQs:

```bash
npm run presence:repair-template-fidelity -- \
  --business=my-business-handle \
  --template=editorial-beauty \
  --mode=overhaul \
  --allow-template-demo-content=true \
  --dry-run=true
```

Review the JSON report before rerunning without `--dry-run=true`.

## Dry-run report

The report includes:

- source and target section counts
- section types being added
- section types being removed
- overlapping sections being replaced
- whether template example content is included
- whether draft content will change
- whether live published content will change
- operational data sources deliberately left untouched
- warnings about destructive replacement or draft publication state

The migration is idempotent: rerunning it recreates the same canonical target for the same template and business name.
