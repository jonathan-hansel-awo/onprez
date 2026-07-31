# Core Web Vitals Monitoring

## Purpose

OnPrez measures real-user performance in production so that public presence pages, booking journeys, marketing pages, and the authenticated dashboard can be reviewed against explicit targets after material UI changes.

The implementation reports:

- Largest Contentful Paint (`LCP`)
- Interaction to Next Paint (`INP`)
- Cumulative Layout Shift (`CLS`)
- First Contentful Paint (`FCP`)
- Time to First Byte (`TTFB`)

The browser reporter uses Next.js `useReportWebVitals`. It runs once in the root analytics boundary and sends measurements only after the visitor has enabled optional analytics.

## Privacy boundary

A performance report contains only:

- the metric name, value, delta, and generated metric ID;
- a coarse page group;
- mobile or desktop viewport class;
- navigation type;
- the deployment release recorded server-side.

It does not contain a business handle, customer name, email address, booking ID, query string, full URL, form data, or page content.

Page groups are deliberately coarse:

- `marketing`
- `public_presence`
- `public_booking`
- `dashboard`
- `auth`
- `other`

## Thresholds

Public, booking, marketing, authentication, and other pages use the standard field-performance boundaries. Dashboard pages have explicit, slightly wider application targets because they load authenticated operational UI.

| Metric | Public good | Public poor | Dashboard good | Dashboard poor |
| ------ | ----------: | ----------: | -------------: | -------------: |
| LCP    |  ≤ 2,500 ms |  > 4,000 ms |     ≤ 3,000 ms |     > 4,500 ms |
| INP    |    ≤ 200 ms |    > 500 ms |       ≤ 250 ms |       > 600 ms |
| CLS    |      ≤ 0.10 |      > 0.25 |         ≤ 0.10 |         > 0.25 |
| FCP    |  ≤ 1,800 ms |  > 3,000 ms |     ≤ 2,000 ms |     > 3,500 ms |
| TTFB   |    ≤ 800 ms |  > 1,800 ms |     ≤ 1,000 ms |     > 2,000 ms |

Values between good and poor are classified as `needs-improvement`.

## Destinations

### Structured production logs

Every accepted report emits `web_vital.reported` with the metric, page group, device class, navigation type, rating, thresholds, environment, and release. This is the complete operational record even when Google Analytics is not configured.

### Google Analytics

When `NEXT_PUBLIC_GA_MEASUREMENT_ID` is configured and optional analytics consent is active, the client emits a `web_vital` event with:

- `metric_name`
- `metric_id`
- `metric_value`
- `metric_delta`
- `metric_rating`
- `page_group`
- `device_class`
- `navigation_type`
- `release`

CLS is multiplied by 1,000 for the integer `value` field; the original decimal remains in `metric_value`.

Create an exploration grouped by `metric_name`, `page_group`, `device_class`, and `release`. Review the 75th percentile separately for mobile and desktop rather than averaging the two populations.

### Sentry

A result above the OnPrez poor threshold creates a warning named `Core Web Vital threshold breached`.

Events are grouped by:

- metric name;
- page group;
- device class.

Create an alert for new or regressed occurrences of that message in production. Use the release comparison view before and after a major UI deployment. The event includes the measured value, delta, poor threshold, navigation type, and deployment release without a raw customer route.

## Release review checklist

After every major homepage, public renderer, booking-flow, or dashboard UI change:

1. Allow enough production traffic for a representative field sample.
2. Compare the new release with the previous stable release.
3. Review mobile and desktop independently.
4. Review public presence, public booking, marketing, and dashboard groups independently.
5. Check the 75th percentile for LCP, INP, and CLS first, then use FCP and TTFB to diagnose loading regressions.
6. Investigate any Sentry threshold warning and document whether it is fixed, accepted temporarily, or caused by insufficient sample size.
7. Do not claim an improvement from one device, one page load, or a laboratory-only Lighthouse run.
8. Record the review date, releases compared, sample limitations, and resulting action in the relevant deployment note or issue.

## Operational notes

- The endpoint accepts a small, strict JSON payload and returns `204 No Content` with `no-store` headers.
- The server recomputes the rating and never trusts the browser-provided rating for alerts.
- Unsupported custom Next.js timings are ignored so the production contract remains limited to the five named metrics.
- A first visit made before analytics consent may not report early load metrics. Subsequent consented page loads are measured normally.
