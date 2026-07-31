# Presence Publication State Acceptance

**Action-plan item:** P2-010 — Clarify Draft vs Published State  
**Implementation date:** 31 July 2026

## Purpose

A business owner must be able to tell, without inference, whether customers can access the presence page and whether the editor contains saved changes that are not on the live page.

## Canonical states

| State | Meaning | Customer view |
| --- | --- | --- |
| Draft — not live | The page is saved privately and is not publicly accessible. | Customers cannot open the page. |
| Live — up to date | The editable draft matches the protected published snapshot. | Customers see the same content shown in the editor. |
| Live with unpublished changes | The saved draft differs from the protected published snapshot. | Customers continue seeing the last published snapshot until the owner publishes again. |
| Live — republish recommended | A legacy published page has no protected snapshot yet. | Customers see the saved content; republishing establishes the separate live snapshot. |

## Acceptance contract

- Publication state is derived from `Page.isPublished`, `Page.content`, `Page.publishedContent`, and `Page.publishedAt`.
- JSON comparison ignores object-key order while preserving array order.
- The presence dashboard and editor state the customer-visible result in plain language.
- A published page displays its last-published date and time.
- Saved edits do not silently imply that the live page changed.
- The editor links directly to the current customer-visible page when it is live.
- Unpublishing removes public access but preserves the historical last-published timestamp and snapshot.
- A never-published draft is distinguishable from a previously published page that is currently offline.

## Safety boundary

The editable `content` remains the draft. Publishing copies it into `publishedContent`; the public route continues to render `publishedContent` when available. Unpublishing changes visibility only and must not erase the last published snapshot or its timestamp.

## Regression coverage

Automated tests protect all canonical states, key-order-independent content comparison, legacy snapshot handling, and timestamp formatting.
