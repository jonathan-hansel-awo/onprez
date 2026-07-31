# Dashboard Navigation Acceptance

## Purpose

P2-012 simplifies the dashboard without removing access to any existing route. The navigation should keep daily work and presence-building obvious while moving lower-frequency destinations behind one clear disclosure.

## Information architecture

### Primary navigation

The sidebar shows five destinations without expansion:

1. **Overview** — dashboard summary and next actions.
2. **Bookings** — appointments and operational booking work.
3. **Customers** — customer records and booking history.
4. **Presence** — page status, templates, preview, and publishing.
5. **Services** — the catalogue customers can book.

These are grouped under two intent labels:

- **Daily work** — Overview, Bookings, Customers.
- **Your presence** — Presence, Services.

### More tools

The lower-frequency destinations remain available under **More tools**:

- Inquiries
- Analytics
- Sharing
- Settings

No route is renamed, redirected, or removed.

## Behaviour contract

- More tools is collapsed by default unless the current route belongs to it.
- Visiting an advanced route automatically reveals its active item.
- Selecting More tools from a collapsed desktop sidebar expands the sidebar before revealing its destinations.
- Selecting any destination closes the mobile drawer.
- Overview is active only at `/dashboard`; it must not remain active on every nested dashboard route.
- Nested routes keep their owning destination active, such as `/dashboard/settings/booking` under Settings.
- Prefix lookalikes such as `/dashboard/bookings-archive` do not activate Bookings.
- Breadcrumbs remain available on non-root dashboard pages.

## Accessibility and mobile acceptance

- The sidebar navigation has an accessible label.
- The More tools control is a native button with `aria-expanded` and `aria-controls`.
- The current route uses `aria-current="page"`.
- Interactive navigation targets remain at least 44 pixels high.
- Group labels remain available to assistive technology when the desktop sidebar is collapsed.
- Mobile users can open, navigate, and close the drawer without hover behaviour.
- The menu remains vertically scrollable on short screens.

## Regression coverage

`src/lib/dashboard/__tests__/navigation.test.ts` protects:

- the five-item primary hierarchy;
- the four advanced destinations;
- preservation and uniqueness of all existing routes;
- exact Overview matching;
- nested-route matching;
- false prefix rejection; and
- automatic More tools activation for advanced routes.

## Manual review

Before merging, verify at common phone and desktop widths:

1. Primary destinations are visible immediately.
2. More tools opens and closes without layout clipping.
3. An advanced route opens with its active destination visible.
4. Desktop collapse and expansion preserve discoverability.
5. Mobile destination selection closes the drawer.
6. Long pages and short-height screens retain access to Help & Support.
