from pathlib import Path

path = Path('docs/CRITICAL_ACTION_PLAN_PROGRESS.md')
text = path.read_text()
original = text

replacements = {
    '**Audit baseline:** `f9a495a`': '**Audit baseline:** `d381169`',
    '**Next planned item:** P2-011 — Add Better Preview Workflows': '**Next planned item:** P2-012 — Simplify Dashboard Navigation',
    '| Phase 7 — Dashboard UX                                |        2 |       2 |           0 |      4 |': '| Phase 7 — Dashboard UX                                |        3 |       1 |           0 |      4 |',
    '| **Total**                                             |   **42** |  **11** |       **8** | **61** |': '| **Total**                                             |   **43** |  **10** |       **8** | **61** |',
    '**Strict completion:** 42 of 61 items — approximately **69%**.': '**Strict completion:** 43 of 61 items — approximately **70%**.',
    '1. Complete **P2-011** and **P2-012** to finish Phase 7. Continue the P2-001 and P2-003 real-user sessions as launch validation.': '1. Complete **P2-012** to finish Phase 7. Continue the P2-001 and P2-003 real-user sessions as launch validation.',
}

for old, new in replacements.items():
    text = text.replace(old, new)

old_p2011 = '''- [ ] **P2-011 — Add Better Preview Workflows** — **Partial — implementation awaiting merge**
  - The editor includes real mobile and desktop rendering modes, and the same canonical renderer is reused across examples, editor previews, saved drafts, and public pages.
  - [PR #124](https://github.com/jonathan-hansel-awo/onprez/pull/124) adds an authenticated copy-preview-link action and a private route that renders the latest saved draft through the canonical renderer.
  - Preview links are signed to one business, page, and publication version, expire after 24 hours, become invalid after publishing, and receive no-cache, no-index, and no-referrer controls.
  - The private route carries explicit draft metadata and disables booking and inquiry creation while preserving genuine services, theme, contact data, and trust signals.
  - Mark Complete after PR #124 merges successfully into `main`.
'''
new_p2011 = '''- [x] **P2-011 — Add Better Preview Workflows** — **Complete**
  - Merged [PR #124](https://github.com/jonathan-hansel-awo/onprez/pull/124) adds an authenticated copy-preview-link action and a private route that renders the latest saved draft through the canonical presence renderer.
  - Preview links are signed to one business, page, and publication version, expire after 24 hours, and become invalid automatically when publishing increments the page version.
  - The private preview preserves real services, theme, contact data, and genuine trust signals while disabling booking and inquiry creation.
  - Private responses use no-cache, no-index, and no-referrer controls, and focused tests cover authorization, expiry, invalidation, and response headers.
  - `docs/product/PRIVATE_DRAFT_PREVIEW_ACCEPTANCE.md` distinguishes immediate editor preview, shareable saved-draft preview, and the live customer snapshot.
'''
text = text.replace(old_p2011, new_p2011)

old_p2012 = '''- [ ] **P2-012 — Simplify Dashboard Navigation** — **Partial**
  - Mobile and desktop navigation, collapsible sidebar behaviour, accessible touch targets, and breadcrumbs are implemented.
  - The current top-level navigation still exposes Overview, Presence, Services, Bookings, Customers, Inquiries, Analytics, Sharing, and Settings as one flat list.
  - Remaining: group routes by intent, reduce the primary list, and move advanced/low-frequency destinations deeper without breaking discoverability.
'''
new_p2012 = '''- [ ] **P2-012 — Simplify Dashboard Navigation** — **Partial — implementation awaiting merge**
  - [PR #125](https://github.com/jonathan-hansel-awo/onprez/pull/125) reduces the always-visible navigation to five core destinations grouped under Daily work and Your presence.
  - Inquiries, Analytics, Sharing, and Settings remain available behind one accessible More tools disclosure that automatically opens for an active advanced route.
  - The mobile drawer, desktop collapse behaviour, breadcrumbs, 44-pixel touch targets, `aria-current`, and disclosure semantics remain intact.
  - Exact route matching also prevents Overview from appearing active on every nested dashboard route while preserving nested ownership for routes such as Settings and Presence.
  - `docs/product/DASHBOARD_NAVIGATION_ACCEPTANCE.md` and focused tests protect the information architecture, route preservation, and active-route rules.
  - Mark Complete after PR #125 merges successfully into `main`.
'''
text = text.replace(old_p2012, new_p2012)

marker = '| 31 July 2026 | Marked merged P2-010 complete and recorded P2-011 private, expiring, non-indexed draft-preview implementation pending PR #124 merge.'
row = '| 31 July 2026 | Marked merged P2-011 complete and recorded the grouped, reduced, accessible P2-012 dashboard navigation implementation pending PR #125 merge. | [#124](https://github.com/jonathan-hansel-awo/onprez/pull/124) / [#125](https://github.com/jonathan-hansel-awo/onprez/pull/125) |\n'
if row not in text:
    text = text.replace(marker, row + marker)

if text == original:
    raise SystemExit('Tracker replacements did not apply')

path.write_text(text)
