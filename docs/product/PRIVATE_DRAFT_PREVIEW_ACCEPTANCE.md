# Private Draft Preview Acceptance

**Action-plan item:** P2-011 — Add Better Preview Workflows  
**Date:** 31 July 2026

## Purpose

OnPrez business owners need three clearly different ways to inspect a presence page:

1. **Editor preview** — an immediate mobile or desktop rendering of unsaved local edits.
2. **Private draft preview** — a shareable rendering of the latest saved draft.
3. **Live customer page** — the last published snapshot available from the public business handle.

The private preview must never require publishing unfinished work or expose a permanent public draft route.

## User workflow

The publication-status panel provides **Copy draft preview link** on both the Presence dashboard and editor.

Creating a link:

- requires an authenticated owner or manager with access to the business;
- creates a signed bearer URL rather than a database-backed public page;
- copies the URL when clipboard access is available;
- always leaves an **Open draft preview** action available as a fallback;
- explains the expiry and publish-invalidation rules before the link is shared.

The preview itself displays a persistent **Private draft preview** banner with:

- an explicit statement that the page is the latest saved draft, not the live customer page;
- the draft's last-saved timestamp;
- the link expiry timestamp;
- confirmation that booking and inquiry actions are disabled;
- confirmation that publishing invalidates the link.

## Access and expiry contract

Each preview token is:

- signed with the server-side JWT secret using HS256;
- limited to the dedicated draft-preview issuer/audience contract;
- bound to one business ID, one page ID, and one page publication version;
- valid for no more than 24 hours;
- rejected if modified or expired;
- rejected when the page or business no longer exists;
- rejected when the business is inactive;
- rejected after the page is published again, because publishing increments the page version.

Saving further draft edits does not invalidate the link. Recipients continue to see the latest saved draft until the link expires or the page is published.

A preview URL is a bearer secret. Owners should share it only with intended reviewers and create a new link when needed.

## Rendering and privacy contract

The private route:

- renders `Page.content`, never `publishedContent`;
- uses the same canonical `SectionRenderer`, theme, service data, and responsive behaviour as public pages;
- does not emit public structured business data;
- carries explicit `noindex`, `nofollow`, and no-cache metadata;
- receives `X-Robots-Tag`, `Cache-Control: private, no-store`, and `Referrer-Policy: no-referrer` response headers;
- disables inquiry submission;
- redirects all booking calls to the preview-information banner rather than a booking flow;
- creates no appointment, inquiry, customer, email, payment, or analytics record.

## Regression coverage

Automated tests protect:

- business/page/version claim binding;
- 24-hour expiry;
- tamper rejection;
- expired-token rejection;
- publication-version invalidation;
- no-cache, no-index, and no-referrer proxy headers.

## Manual acceptance

1. Save a visible change in the presence editor.
2. Select **Copy draft preview link**.
3. Open the link in a signed-out/private browser window.
4. Confirm the saved change is visible and the private-preview banner remains readable on mobile and desktop.
5. Confirm booking and inquiry actions cannot create records.
6. Publish the page.
7. Reload the old preview URL and confirm it no longer resolves.
8. Create another preview link, advance beyond its expiry in a controlled test, and confirm it no longer resolves.
