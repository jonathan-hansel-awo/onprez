# Presence SEO Acceptance Contract

## Purpose

Each published OnPrez presence page should be understandable to search engines without exposing drafts or taking indexing control away from the business owner. P2-027 therefore treats metadata, crawl visibility, sitemap membership, and structured data as one published-snapshot contract.

Structured data improves machine understanding but does not guarantee a rich result or ranking. Search engines decide which enhancements to display.

## Owner-controlled indexing

The Business Profile settings page exposes **Allow search engines to index this presence page**.

- Only the business owner may change this setting.
- Existing businesses default to enabled when the migration is deployed.
- An enabled business enters the sitemap only when the business is active and published and its home page is published.
- A disabled business remains reachable through its direct link but emits `noindex, nofollow` for general and Google robots and is excluded from the sitemap.
- Search title, description, and optional keywords are edited alongside the visibility control.
- Saving the setting invalidates the cached presence record and rendered route immediately.

Opting out is not an instant removal mechanism for a URL that a search engine already knows. Owners should allow the crawler to revisit the page and use the search provider's removal tools when urgent removal is required.

## Published metadata contract

The server-rendered page and `generateMetadata` share the same handle-scoped published presence cache. Metadata includes:

- a bounded custom or generated title and description;
- the canonical OnPrez handle URL;
- Open Graph and Twitter preview data;
- owner-controlled robot directives;
- `noindex, nofollow` for missing or unpublished handles.

The canonical URL remains present when indexing is disabled so crawlers do not interpret an alternate URL as the preferred version.

## Structured data contract

The server emits one injection-safe JSON-LD graph derived only from the public cached record and the published page snapshot. The graph includes, where data exists:

- the closest conservative `LocalBusiness` subtype;
- a structured postal address and geo coordinates;
- public contact, website, and social-profile URLs;
- open business hours;
- aggregate ratings from published reviews;
- an `OfferCatalog` of up to 20 active services;
- `WebPage` and `BreadcrumbList` entities;
- `FAQPage` questions and answers.

FAQ schema is emitted only for complete question-and-answer pairs in visible FAQ sections of `publishedContent`. Empty entries, duplicates, hidden sections, and draft-only edits are excluded. The former client-component FAQ script was removed so the visible published page and JSON-LD cannot drift or create duplicate `FAQPage` entities.

FAQ markup remains useful to schema-aware consumers, but Google currently limits FAQ rich-result visibility. OnPrez must not promise a FAQ rich result to businesses.

## Automated validation

`npm run seo:validate` runs in the pull-request quality gate. It validates two realistic published-business fixtures:

1. an indexable Cambridge spa with a full address, geo coordinates, hours, rating, service, and visible FAQ;
2. an opted-out Ely consultancy with sparse location data, no rating, and no FAQ.

Focused Jest coverage additionally verifies metadata opt-in/opt-out behaviour, sitemap filtering, FAQ completeness and draft exclusion, category mapping, offers, ratings, opening hours, safe social URLs, and JSON-LD script escaping.

## Release verification

After deploying migration `20260801180000_presence_seo_controls`:

1. Open a realistic published business in Business Profile and save its search title and description.
2. Confirm its canonical, Open Graph, and robot metadata in page source.
3. Confirm it appears in `/sitemap.xml` when indexing is enabled.
4. Disable indexing as the owner and confirm `noindex, nofollow` and sitemap removal after cache invalidation.
5. Confirm a non-owner cannot change the visibility control or bypass it through the API.
6. Validate an opted-in production URL with Google's Rich Results Test and Schema.org validator; fix critical parse errors.
7. Inspect the URL in Google Search Console after deployment to confirm the rendered metadata and request recrawling if appropriate.
8. Publish an FAQ change and confirm source contains only the visible, complete published questions once.

## Ongoing rules

- Any field added to the structured-data builder must be public and documented in the presence cache boundary.
- New structured-data properties must describe content actually visible or verifiable on the page.
- A new presence publication or mutation path must invalidate the cached handle.
- Rich-result eligibility must never be represented as guaranteed search placement.
