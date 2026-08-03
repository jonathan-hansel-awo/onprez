# Accessibility Testing

- **Standard:** WCAG 2.2 Level AA
- **Automated owner:** feature author and release owner
- **Assistive-technology owner:** release owner
- **CI command:** `npm run test:a11y`

Accessibility is a launch-blocking quality attribute for OnPrez. Automated checks cover the public
homepage, signup and login, an authenticated dashboard form, a published business presence, and the
service, date, time, and customer-details stages of booking. The journey runs in Chromium against a
production build and disposable PostgreSQL in `.github/workflows/e2e.yml`.

## Automated release gate

The Playwright journey uses `@axe-core/playwright` with WCAG A and AA tags, including the colour
contrast rule. Every audited state must return no violations. A failure blocks merge; exclusions,
disabled rules, unconditional skips, and impact-level filtering require a documented replacement
test and review.

The same journey also verifies that:

- the sign-in flow is reachable and submittable with the keyboard alone;
- keyboard focus has a visible indicator;
- validation marks fields invalid and associates each field with an announced alert;
- shared inputs, selects, and text areas preserve helper and error descriptions; and
- reduced-motion preferences remove smooth scrolling and reduce animations and transitions.

Every axe result is attached as JSON to Playwright output. GitHub retains that output together with
screenshots, traces, video, the HTML report, and the application log for 30 days. Review the named
page-state attachment first, then repair the underlying component rather than excluding its selector.

## Local execution

Use the isolated database and runtime-secret setup in `docs/testing/CORE_LOOP_E2E.md`, then run:

```bash
npm run test:a11y
```

The test refuses a non-loopback database. Synthetic `.invalid` identities and loopback-only provider
suppression prevent customer data or real email delivery from entering the journey.

## VoiceOver and NVDA smoke check

Automation cannot reproduce how a person understands a flow through a screen reader. Before a paid
launch, after a navigation redesign, and after a material booking or authentication change, complete
one pass with **VoiceOver + Safari** and one with **NVDA + Firefox or Chrome**.

For each pass:

1. Navigate landmarks and headings without using the pointer; confirm the page purpose and hierarchy
   are understandable.
2. Complete signup/login validation; confirm labels, required state, invalid state, instructions, and
   error recovery are announced once and in context.
3. Navigate the dashboard service form; confirm control names, values, groups, help text, and focus
   order remain meaningful.
4. Navigate a published presence and start booking; confirm the selected service, date, time, progress,
   loading feedback, and confirmation are announced.
5. At 200% browser zoom and with reduced motion enabled, confirm content remains operable, focus never
   disappears, and meaning does not depend on colour, animation, hover, or spatial position alone.

Record the browser, assistive-technology version, flow, date, result, and issue link in the release
notes. A critical blocker, keyboard trap, inaccessible validation path, or unannounced booking state
blocks release even when axe is green.
