# OnPrez Testing Strategy

- **Policy owner:** Engineering
- **Applies to:** every pull request, release and production regression
- **Machine-readable policy:** `config/test-pyramid.json`
- **Enforcement command:** `npm run test:pyramid`

This is the canonical testing strategy for OnPrez. It defines which test layer proves each kind of
change, who owns that evidence, when a real database is permitted, and which gates must pass before
merge or release. The machine-readable policy classifies every automated test file and prevents a
new test, source change or release workflow from silently bypassing the strategy.

## Pyramid layers

The pyramid is intentionally weighted toward fast, deterministic tests. File counts are a shape
guard, not a substitute for useful assertions or a coverage percentage.

| Layer       | Purpose                                                                                                         | Current boundary                                                                        | Required characteristics                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Pure domain rules, utilities, validation, formatting, security helpers and service decisions                    | `src/lib`, `src/types`, `src/data`, focused service tests and testable script libraries | No network; no production provider; mock only the boundary outside the unit                                                 |
| Component   | User-visible rendering, interaction, feedback, responsive behaviour and accessible semantics                    | React tests under component/app test paths                                              | Query by role/label where practical; exercise loading, success, empty, validation and failure states relevant to the change |
| Integration | Route and workflow contracts across authentication, authorisation, tenancy, validation and persistence adapters | API route tests under `__tests__/api` and `src/app/api`                                 | Prove anonymous and cross-tenant rejection, stable status/body contracts, and side-effect boundaries                        |
| Contract    | Database constraints, schema/migration expectations, privacy, security, deployment and cross-cutting invariants | Database and repository-wide regression tests                                           | Fail closed when a protected invariant, workflow command or documented boundary disappears                                  |
| Browser E2E | Real browser proof of the claim-to-publish-to-book-to-manage loop                                               | Planned in P2-030                                                                       | Runs against an isolated deployed-like system; never against production                                                     |
| Capacity    | Concurrency correctness and launch baseline for critical paths                                                  | `.github/workflows/load-testing.yml`                                                    | Fresh PostgreSQL, local production build, retained redacted report, exactly one concurrent booking winner                   |

Every Jest test file must match exactly one configured unit, component, integration or contract
layer. Unclassified or multiply classified files fail `npm run test:pyramid`. Committed focused
tests such as `test.only` also fail the gate. The combined unit and component foundation must not be
smaller than the integration layer.

Browser E2E remains deliberately marked `planned` until P2-030. Adding an E2E directory without
updating this policy fails validation rather than creating an unowned shadow suite.

## Ownership

- The feature author owns the smallest useful unit tests, the relevant component or route tests,
  deterministic fixtures, and a regression for every defect fixed.
- The subsystem owner owns cross-cutting contracts for authentication, booking correctness,
  tenancy, privacy, payments, notifications, migrations and provider boundaries.
- The reviewer owns test adequacy: assertions must prove behaviour and failure modes, not merely
  execute lines. The reviewer also checks that mocks end at a real architectural boundary.
- The release owner owns the final GitHub status, retained load report, preview smoke test and any
  provider or production-only verification called out by the change.
- A failing or flaky test is owned by the author of the change that exposed it until it is repaired
  or a named subsystem owner accepts it. Rerunning until green is not a resolution.

## Required layers by change type

| Change                                                              | Minimum automated evidence in the same PR                                                                                                     |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure domain, validation, transformation or service logic            | Unit test; add a contract test when a repository-wide invariant changes                                                                       |
| React component or page behaviour                                   | Component test for the changed user state; unit test for extracted logic                                                                      |
| API route or webhook                                                | Integration test covering success, malformed input, unauthenticated access, unauthorised/cross-tenant access and idempotency where applicable |
| Prisma schema, migration, query or critical constraint              | Contract/integration regression plus fresh migration replay and schema-drift check                                                            |
| Booking, payment, authentication, privacy or notification lifecycle | Unit coverage for state decisions and integration coverage for the external boundary; retain existing security/privacy gates                  |
| Public critical-path performance or concurrency                     | Normal correctness tests plus the isolated capacity workflow and report review                                                                |
| Defect fix                                                          | A regression that fails before the fix and passes after it at the lowest layer capable of proving the defect                                  |
| Documentation-only or non-behavioural metadata                      | No new behavioural test, but all existing release gates remain required                                                                       |

On pull requests and pushes, the validator compares the branch with the event base SHA. Governed
changes in domain logic, API routes, user interface, database contracts or application boundaries
must include a test change in one of the permitted layers. GitHub uses a full checkout so the
comparison covers the complete pull request, not only its last commit.

## Database-test policy

Jest tests must not connect to production, a shared preview database or a developer's persistent
database. Fast tests use mocks/fakes at the Prisma or provider boundary and must preserve realistic
return shapes, errors and transaction behaviour.

A real PostgreSQL database is required when proving migration order, PostgreSQL-specific
constraints, advisory locks, concurrent writes, schema drift or query behaviour that a mock cannot
represent. Those tests must:

1. use an isolated disposable PostgreSQL instance created by CI or an explicitly isolated local
   database;
2. set both `DATABASE_URL` and `DIRECT_URL` to that instance;
3. replay migrations from an empty database with `prisma migrate deploy`;
4. compare the migrated schema with `schema.prisma` where the workflow supports it;
5. seed only synthetic fixtures and suppress external email, push, calendar, upload and payment
   delivery;
6. destroy or discard the database after the run; and
7. never copy production personal data into a fixture or retained artifact.

An isolated database failure is a release blocker. Changing a migration that has already reached
production is prohibited; add a forward reconciliation migration instead.

## Release gates

Every pull request and `main` push must pass the quality workflow:

1. dependency installation;
2. test-pyramid validation and changed-file policy;
3. formatting, lint and TypeScript;
4. Prisma schema validation;
5. privacy and presence-SEO contracts;
6. the complete Jest suite; and
7. a production build.

Security scanning and Vercel preview status remain separate required checks. Changes covered by the
critical-load path must also pass fresh migration replay, schema comparison, production startup and
the capacity scenarios. Releases stop on any substantive failure; required checks are never
weakened merely to merge a feature.

Production-only verification—such as provider dashboards, OAuth consent, live webhook delivery or
a designated low-value payment—must be recorded as an operational follow-up. It complements the
automated pyramid and does not replace a failing gate.

## Exceptions and regression fixes

There is no blanket “small change” exception for governed production source. If a change cannot be
tested at the layer selected by `config/test-pyramid.json`, the PR must either refactor toward a
testable boundary or update this strategy and machine-readable policy with a concrete, reviewed
reason and an alternative gate.

Do not commit `test.only`, weaken an assertion, add an unconditional skip, replace a realistic
fixture with a happy-path stub, or remove a release command to obtain green CI. Quarantining a truly
environmental test requires a tracked owner, evidence, expiry date and replacement coverage; no
current suite is permanently quarantined.

For a production regression:

1. reproduce it at the lowest faithful layer;
2. add a test that fails for the observed behaviour;
3. implement the fix;
4. run the affected suite, the full quality gate and any relevant database/load workflow; and
5. record operational recovery separately from the permanent regression evidence.
