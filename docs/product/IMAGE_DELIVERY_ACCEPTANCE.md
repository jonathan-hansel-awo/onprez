# Image Delivery Acceptance

## Purpose

P2-019 keeps uploaded media visually useful while limiting storage, transformation, and mobile delivery overhead. It also prevents a user from storing the exact same source image more than once within the same authorised media scope.

## Upload policies

| Purpose | Maximum stored dimensions | Re-encoding quality |
| --- | ---: | ---: |
| Profile image | 1024 × 1024 | 82 |
| Business logo | 1200 × 1200 | 82 |
| Business cover | 1920 × 1080 | 82 |
| Service image | 1600 × 1600 | 82 |
| Gallery image | 1600 × 1600 | 82 |

Uploads retain their aspect ratio, are never enlarged, are auto-rotated, and are re-encoded without EXIF, XMP, or IPTC metadata. The existing 4 MB source and sanitised-output limits remain in force.

## Duplicate prevention

1. Authenticate the user and resolve business access before inspecting tenant storage.
2. Validate the source envelope and compute a SHA-256 fingerprint from the original bytes.
3. Scope the fingerprint to the authorised user/business folder and upload purpose.
4. Ask Cloudinary for that deterministic public ID before Sharp compression runs.
5. When the asset exists, return its stored URL and metadata with `reused: true`; do not call Sharp or `upload_stream`.
6. When it does not exist, resize and re-encode according to the purpose policy, then upload with `overwrite: false` and `unique_filename: false`.
7. If two identical requests race, retrieve and reuse the asset created by the winner.

The browser and assisted-admin upload experiences must display **Existing image reused** (or equivalent explicit wording) when `reused` is true.

### Scope and rollout note

Duplicate identity is intentionally tenant- and purpose-scoped. OnPrez does not reveal or reuse another business's private media merely because the bytes match. Assets uploaded before this content-addressed scheme used random public IDs and require a separate metadata backfill before they can participate in exact pre-upload lookup; all assets uploaded after this release participate automatically.

## Responsive delivery contract

- Uploaded-image previews use `next/image` with an explicit `sizes` value and must not opt out through `unoptimized`.
- Customer-facing responsive images must declare realistic `sizes` values so the browser does not fetch desktop-width media for narrow screens.
- Cloudinary remains the source store; automatic modern-format and quality negotiation is applied by the configured delivery layer.
- Booking availability and other live data are unrelated to image caching and must remain live.

## Delivery budgets

These are review thresholds rather than hard upload limits:

- Logo/avatar candidate at mobile width: target at or below 100 KB.
- Service/gallery card candidate at mobile width: target at or below 180 KB.
- Full-width mobile cover candidate: target at or below 300 KB.
- Initial above-the-fold image transfer on a realistic presence page: target at or below 600 KB.
- Off-screen gallery images must remain lazy-loaded and must not block first interaction.

A budget breach requires either a documented visual-quality exception or a change to dimensions, quality, responsive sizing, or page composition.

## Slow-mobile verification

Before marking a major gallery or presence-page redesign complete:

1. Publish a realistic business with a logo, cover, at least six services, and at least eight gallery images.
2. Test a cold load in mobile emulation using a slow 4G profile and disabled cache.
3. Confirm the correct mobile candidates are requested, off-screen images are deferred, layout does not shift as images arrive, and controls remain usable during loading.
4. Record transferred image bytes, LCP, CLS, viewport, network profile, commit/release, and any accepted exception.
5. Repeat after material image-rendering changes and compare against the previous release.

## Regression coverage

Automated tests protect fingerprint stability, purpose-specific resizing, invalid file rejection, lookup-before-compression ordering, deterministic non-overwriting IDs, API reuse responses, user notification, assisted-admin notification, and responsive preview sizing.
