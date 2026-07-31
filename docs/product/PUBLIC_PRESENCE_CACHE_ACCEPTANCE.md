# Public Presence Cache Acceptance Contract

## Purpose

Public OnPrez presence pages are read far more often than they are published. The customer-facing `/{handle}` route therefore caches the published page shell by normalised business handle instead of querying the database for the same business, page snapshot, SEO fields, and review summary on every visit.

## Cached data

The handle cache contains only public, published data required to render the presence shell:

- business name, handle, description, contact and location fields;
- public branding, social links, theme and booking-policy display settings;
- SEO title, description, keywords, logo, and cover image;
- the protected `publishedContent` snapshot for the home page;
- the aggregate rating and count of published reviews.

An unpublished business or unpublished home page resolves to no cached public record and the route returns `404`.

## Data that remains live

Services and next availability continue to load through their existing public APIs in the browser. The cache does not store appointment slots, customer details, booking records, inquiry submissions, private drafts, or dashboard data.

This boundary means a cached presence shell cannot expose stale appointment availability or private operational records.

## Cache identity and lifetime

- Cache key: `public-presence-by-handle` plus the normalised handle.
- Cache tag: `public-presence:{handle}`.
- Full-route and data-cache fallback lifetime: five minutes.
- Handle normalisation trims whitespace and uses lowercase.

The short fallback lifetime bounds staleness if a new mutation path is introduced before its explicit invalidation is added. Normal product writes use immediate invalidation and should not wait for the fallback. Published-review aggregate changes are also bounded by this fallback until a dedicated review-moderation write path calls the shared invalidation helper.

## Explicit invalidation matrix

The shared `invalidatePublicPresence(handle)` operation expires both the handle data tag and the rendered route. It runs after:

| Mutation                                                               | Invalidation behaviour                                                        |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Owner publishes or republishes                                         | Expire the handle immediately                                                 |
| Owner unpublishes                                                      | Expire the handle immediately so the next request returns `404`               |
| Platform admin publishes or unpublishes                                | Expire the handle immediately                                                 |
| Platform admin saves an already-live snapshot                          | Expire the handle immediately                                                 |
| Platform admin changes public profile content                          | Expire the handle immediately                                                 |
| Owner or manager changes profile, branding, social, or public settings | Expire the old handle and, defensively, a new handle if it differs            |
| Owner or manager changes the public theme                              | Expire the handle immediately                                                 |
| Ordinary editor auto-save or draft save                                | Do not invalidate; customers must continue seeing the last published snapshot |

Any future mutation that changes a field read by the cached loader must call the same invalidation helper in the successful write path.

## Metadata and indexing

The rendered page and `generateMetadata` use the same cached loader. This prevents duplicate database work and ensures an unpublished business does not retain indexable metadata. Missing or unpublished handles return a not-found title and `noindex, nofollow` metadata.

## Operational verification

After deployment:

1. Open a published handle twice and confirm the page renders normally.
2. Publish a visible copy change and confirm a fresh request shows it immediately.
3. Unpublish the page and confirm the public handle returns `404` immediately.
4. Republish and confirm the page returns without waiting for the five-minute fallback.
5. Change the theme or business contact data and confirm the public page and metadata refresh.
6. Save an unpublished draft change without publishing and confirm the live page still shows the previous snapshot.
7. Confirm service pricing and next availability continue to update through their public APIs.

## Acceptance criteria

- The public route no longer uses `force-dynamic` or direct Prisma reads.
- The page body and metadata share one handle-scoped cached loader.
- Only published business/page data can enter the cache.
- Publication, assisted live saves, profile/settings, and theme mutations invalidate the handle.
- Draft-only saves do not disturb the live snapshot.
- Real-time service and availability data remain outside the cache.
- Automated tests cover key construction, TTL, publication filtering, invalidation, and architectural mutation coverage.

No database migration or new environment variable is required.
