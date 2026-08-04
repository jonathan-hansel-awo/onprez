# ADR-0005: Store and deliver tenant media through Cloudinary

- **Status:** Accepted
- **Date:** 2026-08-04

## Context

Business logos, cover images, service images, galleries, and user profile images are not suitable for
database byte storage or ephemeral serverless filesystems. Uploads must be validated and sanitised,
isolated by tenant and purpose, deduplicated, transformable for responsive delivery, and recoverable
independently from the relational database.

## Decision

Use Cloudinary as the media byte store and delivery CDN. Upload only server-sanitised supported image
formats through authenticated OnPrez routes. Place assets under user- or immutable-business-ID scoped
folders, derive stable content fingerprints for deduplication, request Cloudinary backups, and store
only provider references and metadata in PostgreSQL.

All tenant authorisation is resolved before storage lookup so media reuse cannot reveal another
business's assets. Delivery helpers may request responsive Cloudinary transformations rather than
creating application-owned image copies.

## Consequences

- Media delivery, transformations, CDN caching, and duplicate reuse do not burden the application
  database or serverless filesystem.
- Cloudinary cost, quota, retention, backup settings, deletion, and restore drills require explicit
  operational monitoring.
- A database restore can reintroduce stale provider references, so database and media recovery need
  reconciliation.
- Provider identifiers and URLs become part of persisted application data; migration to another
  media provider requires an asset-copy and reference-update plan.

## Alternatives considered

- **PostgreSQL byte storage:** keeps one backup domain but increases database size and makes media
  transformation/delivery inefficient.
- **Vercel's ephemeral filesystem:** rejected because it is not durable across invocations or
  deployments.
- **Generic object storage with a custom image pipeline:** offers control but requires building the
  upload, transformation, CDN, and lifecycle surface already supplied by Cloudinary.
- **Client-direct unsigned uploads:** reduces server work but weakens sanitisation, tenant
  authorisation, and consistent metadata enforcement.

## Implementation evidence

- [`src/app/api/upload/image/route.ts`](../../src/app/api/upload/image/route.ts)
- [`src/lib/uploads/image-security.ts`](../../src/lib/uploads/image-security.ts)
- [`src/lib/utils/image-optimizer.ts`](../../src/lib/utils/image-optimizer.ts)
- [`docs/product/IMAGE_DELIVERY_ACCEPTANCE.md`](../product/IMAGE_DELIVERY_ACCEPTANCE.md)
- [`docs/operations/BACKUP_RESTORE.md`](../operations/BACKUP_RESTORE.md)
