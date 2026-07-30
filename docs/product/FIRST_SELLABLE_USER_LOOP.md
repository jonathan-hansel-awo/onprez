# OnPrez First Sellable User Loop

**Status:** Canonical MVP product contract  
**Owner:** Product and engineering  
**Action-plan item:** P2-001  
**Target:** Complete the measurable loop in less than 10 minutes

## Product promise

The first sellable version of OnPrez must let a service professional create a credible, bookable online presence, share one link, receive a real booking, and take the first operational action on that booking.

The core loop is:

```text
Claim handle → add service → set availability → publish page → share link → receive booking → manage booking
```

This loop is the MVP acceptance test. A feature is core only when it is required to complete or protect this journey.

## Minimum sellable version

| Step             | Minimum version                                                                                       | Durable completion signal                                   | Analytics event                                  | Target       |
| ---------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ | -----------: |
| Claim handle     | Create an account and claim one unique, valid public handle.                                          | Business creation timestamp                                 | `first_sellable_loop.claim_handle.completed`     |       45 sec |
| Add service      | Create one active service with a name, price, and duration.                                           | Earliest active service creation timestamp                  | `first_sellable_loop.add_service.completed`      |        2 min |
| Set availability | Configure at least one open bookable period.                                                          | Earliest non-closed business-hours record                   | `first_sellable_loop.set_availability.completed` | 1 min 30 sec |
| Publish presence | Publish one public page that passes the existing readiness rules.                                     | Business/page publication timestamp                         | `first_sellable_loop.publish_presence.completed` |        1 min |
| Share link       | Copy or share the live `onprez.com/[handle]` link.                                                    | Existing onboarding `sharedAt` timestamp                    | `first_sellable_loop.share_link.completed`       |       30 sec |
| Receive booking  | A customer completes the first valid booking from the public page.                                    | Earliest appointment creation timestamp                     | `first_sellable_loop.receive_booking.completed`  |        2 min |
| Manage booking   | The professional performs the first booking status action. Automatic system transitions do not count. | Earliest appointment transition with `changedByType = USER` | `first_sellable_loop.manage_booking.completed`   |        1 min |

**Total acceptance budget:** 8 minutes 45 seconds.  
**Safety margin:** 1 minute 15 seconds beneath the 10-minute limit.

Business name, useful public copy, contact details, and publish-readiness checks remain required supporting inputs. They are deliberately not separate funnel milestones because they support publication rather than representing a distinct sellable outcome.

## Instrumentation contract

The authenticated endpoint below provides tenant-scoped completion analytics without sending customer PII to a third-party analytics provider:

```text
GET /api/dashboard/first-sellable-loop
```

It returns:

- every canonical step in order;
- the stable analytics event name for each step;
- the first durable completion timestamp available in OnPrez data;
- completed and total step counts;
- funnel percentage;
- the next incomplete step;
- elapsed time from handle claim to first owner-managed booking;
- whether the completed loop met the 525-second target.

The endpoint derives progress from existing authoritative records. It must remain business-scoped and server-authenticated. A booking is considered managed only after a `USER` appointment transition, so an automatic confirmation does not falsely complete the final milestone.

### Example response shape

```json
{
  "success": true,
  "data": {
    "firstSellableLoop": {
      "targetSeconds": 525,
      "completedCount": 7,
      "totalCount": 7,
      "percent": 100,
      "isComplete": true,
      "elapsedSeconds": 510,
      "withinTarget": true,
      "nextStep": null,
      "steps": []
    }
  }
}
```

## MVP acceptance session

Run the test on a small mobile viewport or physical phone. Use a fresh professional account and a separate customer browser or private window. Do not seed or manually edit database records.

### Rules

1. Start the timer when the professional begins claiming a handle.
2. The professional must complete the journey without spoken instructions. The observer may only say, “Please create a page that a customer can book from, share it, then manage the booking.”
3. Use realistic text, price, duration, and availability rather than placeholder values.
4. The customer must find the shared page through the link and complete the booking through the public flow.
5. The professional must take a real dashboard action on that booking, such as confirm, cancel, complete, mark no-show, or reschedule where valid.
6. Stop the timer when the owner-generated appointment transition succeeds.
7. Record confusion, backtracking, errors, and assistance requests even when the session finishes within the target.
8. A session fails if it needs database edits, staff intervention, a workaround not visible to normal users, or more than 10 minutes.

### Evidence log

Do not mark the human-validation acceptance criterion complete until at least three observed sessions are recorded.

| Session | Date | Participant/niche | Device | Completion time | Assistance required | Outcome  | Main friction |
| ------- | ---- | ----------------- | ------ | --------------: | ------------------- | -------- | ------------- |
| 1       |      |                   |        |                 |                     | Pending  |               |
| 2       |      |                   |        |                 |                     | Pending  |               |
| 3       |      |                   |        |                 |                     | Pending  |               |
| 4       |      |                   |        |                 |                     | Optional |               |
| 5       |      |                   |        |                 |                     | Optional |               |

### Acceptance decision

P2-001 is operationally validated when:

- three consecutive fresh-account sessions complete without assistance;
- each session completes in less than 10 minutes;
- all seven milestones appear as completed in the funnel endpoint;
- the endpoint reports `withinTarget: true` for each session;
- no critical mobile, booking, authorization, or data-integrity defect is observed.

## Scope guardrail

Before adding or prioritising a feature, ask:

1. Does it help a professional reach one of the seven milestones faster?
2. Does it help a customer complete the first booking safely?
3. Does it help the professional act on that booking reliably?
4. Does it protect trust, security, privacy, payment correctness, or data integrity within this loop?

If every answer is no, capture the feature for later rather than expanding the first sellable scope.
