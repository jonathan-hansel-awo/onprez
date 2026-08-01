import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import {
  runWorkers,
  summariseScenario,
  timedFetch,
  type RequestSample,
  type ScenarioSummary,
} from './lib'

type LoadTestFixture = {
  handle: string
  businessId: string
  serviceId: string
  bookingDate: string
  bookingStartTime: string
  loginEmail: string
  loginPassword: string
  loginIp: string
  userAgent: string
}

type ScenarioResult = {
  summary: ScenarioSummary
  checks: string[]
  failures: string[]
}

const HANDLE_IP = '198.51.100.10'
const BOOKING_IP = '198.51.100.12'

function requireSafeTarget(baseUrl: URL) {
  if (!['localhost', '127.0.0.1', '::1'].includes(baseUrl.hostname)) {
    throw new Error(
      `Refusing to load test ${baseUrl.hostname}. This suite only targets an isolated local build.`
    )
  }
}

function requestHeaders(ipAddress: string, userAgent: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    'user-agent': userAgent,
    'x-forwarded-for': ipAddress,
  }
}

function addThreshold(failures: string[], condition: boolean, message: string) {
  if (!condition) failures.push(message)
}

function toSample(result: Awaited<ReturnType<typeof timedFetch>>): RequestSample {
  const { body: _body, ...sample } = result
  return sample
}

async function runReadScenario(options: {
  name: string
  concurrency: number
  iterations: number
  url: URL
  p95LimitMs: number
  minimumThroughput: number
}) {
  const run = await runWorkers(options.concurrency, options.iterations, () =>
    timedFetch(options.url, undefined, [200]).then(toSample)
  )
  const summary = summariseScenario(options.name, run.samples, run.durationMs)
  const failures: string[] = []

  addThreshold(failures, summary.errorRate <= 0.01, `${options.name}: error rate exceeded 1%`)
  addThreshold(
    failures,
    summary.latencyMs.p95 <= options.p95LimitMs,
    `${options.name}: p95 ${summary.latencyMs.p95}ms exceeded ${options.p95LimitMs}ms`
  )
  addThreshold(
    failures,
    summary.throughputPerSecond >= options.minimumThroughput,
    `${options.name}: throughput ${summary.throughputPerSecond}/s fell below ${options.minimumThroughput}/s`
  )

  return {
    summary,
    checks: [
      `error rate <= 1%`,
      `p95 <= ${options.p95LimitMs}ms`,
      `throughput >= ${options.minimumThroughput} requests/second`,
    ],
    failures,
  } satisfies ScenarioResult
}

async function runHandleScenario(baseUrl: URL, fixture: LoadTestFixture): Promise<ScenarioResult> {
  const url = new URL('/api/auth/check-handle', baseUrl)
  url.searchParams.set('handle', fixture.handle)
  const startedAt = performance.now()
  const accepted = await Promise.all(
    Array.from({ length: 20 }, () =>
      timedFetch(url, { headers: requestHeaders(HANDLE_IP, fixture.userAgent) }, [200])
    )
  )
  const overflow = await timedFetch(
    url,
    { headers: requestHeaders(HANDLE_IP, fixture.userAgent) },
    [429]
  )
  const samples = [...accepted, overflow].map(toSample)
  const summary = summariseScenario('handle availability', samples, performance.now() - startedAt)
  const failures: string[] = []

  addThreshold(
    failures,
    accepted.every(sample => sample.status === 200),
    'handle availability: the first 20 requests must be accepted'
  )
  addThreshold(
    failures,
    overflow.status === 429,
    'handle availability: request 21 must be rate limited'
  )
  addThreshold(
    failures,
    summary.latencyMs.p95 <= 1_500,
    `handle availability: p95 ${summary.latencyMs.p95}ms exceeded 1500ms`
  )

  return {
    summary,
    checks: ['20 requests accepted per minute', 'request 21 returns 429', 'p95 <= 1500ms'],
    failures,
  }
}

async function runLoginScenario(baseUrl: URL, fixture: LoadTestFixture): Promise<ScenarioResult> {
  const url = new URL('/api/auth/login', baseUrl)
  const init = {
    method: 'POST',
    headers: requestHeaders(fixture.loginIp, fixture.userAgent),
    body: JSON.stringify({
      email: fixture.loginEmail,
      password: fixture.loginPassword,
      rememberMe: false,
    }),
  }
  const startedAt = performance.now()
  const accepted = await Promise.all(Array.from({ length: 5 }, () => timedFetch(url, init, [200])))
  const overflow = await timedFetch(url, init, [429])
  const samples = [...accepted, overflow].map(toSample)
  const summary = summariseScenario('login', samples, performance.now() - startedAt)
  const failures: string[] = []

  addThreshold(
    failures,
    accepted.every(sample => sample.status === 200),
    'login: the first five valid requests must succeed'
  )
  addThreshold(failures, overflow.status === 429, 'login: request six must be rate limited')
  addThreshold(
    failures,
    summary.latencyMs.p95 <= 4_000,
    `login: p95 ${summary.latencyMs.p95}ms exceeded 4000ms`
  )

  return {
    summary,
    checks: ['five concurrent valid logins succeed', 'request six returns 429', 'p95 <= 4000ms'],
    failures,
  }
}

async function runBookingConflictScenario(
  baseUrl: URL,
  fixture: LoadTestFixture
): Promise<ScenarioResult> {
  const url = new URL('/api/bookings', baseUrl)
  const startedAt = performance.now()
  const responses = await Promise.all(
    Array.from({ length: 5 }, (_, index) =>
      timedFetch(
        url,
        {
          method: 'POST',
          headers: {
            ...requestHeaders(BOOKING_IP, fixture.userAgent),
            'idempotency-key': `loadtestbooking${Date.now()}${index}`,
          },
          body: JSON.stringify({
            businessId: fixture.businessId,
            serviceId: fixture.serviceId,
            date: fixture.bookingDate,
            startTime: fixture.bookingStartTime,
            customerName: `Load Test Customer ${index + 1}`,
            customerEmail: `load-test-customer-${index + 1}@example.invalid`,
          }),
        },
        [201, 409]
      )
    )
  )
  const summary = summariseScenario(
    'concurrent booking conflict',
    responses.map(toSample),
    performance.now() - startedAt
  )
  const winners = responses.filter(response => response.status === 201).length
  const conflicts = responses.filter(response => response.status === 409).length
  const failures: string[] = []

  addThreshold(
    failures,
    winners === 1,
    `booking conflict: expected one winner, received ${winners}`
  )
  addThreshold(
    failures,
    conflicts === 4,
    `booking conflict: expected four conflict responses, received ${conflicts}`
  )
  addThreshold(
    failures,
    responses.every(response => [201, 409].includes(response.status)),
    'booking conflict: every response must be 201 or 409'
  )
  addThreshold(
    failures,
    summary.latencyMs.p95 <= 4_000,
    `booking conflict: p95 ${summary.latencyMs.p95}ms exceeded 4000ms`
  )

  return {
    summary,
    checks: [
      'exactly one concurrent request creates the slot',
      'all four competing requests return 409',
      'p95 <= 4000ms',
    ],
    failures,
  }
}

function renderMarkdown(report: {
  generatedAt: string
  baseline: string
  scenarios: ScenarioResult[]
  failures: string[]
}) {
  const rows = report.scenarios
    .map(
      ({ summary }) =>
        `| ${summary.name} | ${summary.requests} | ${summary.failures} | ${summary.throughputPerSecond} | ${summary.latencyMs.p50} | ${summary.latencyMs.p95} | ${summary.latencyMs.p99} | ${Object.entries(
          summary.statusCounts
        )
          .map(([status, count]) => `${status}: ${count}`)
          .join(', ')} |`
    )
    .join('\n')

  return `# P2-020 Critical Path Load Test Report

- Generated: ${report.generatedAt}
- Baseline: ${report.baseline}
- Result: ${report.failures.length ? 'FAILED' : 'PASSED'}

| Scenario | Requests | Request failures | Throughput/s | p50 ms | p95 ms | p99 ms | HTTP statuses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${rows}

## Threshold failures

${report.failures.length ? report.failures.map(failure => `- ${failure}`).join('\n') : '- None'}
`
}

async function main() {
  const baseUrl = new URL(process.env.LOAD_TEST_BASE_URL || 'http://127.0.0.1:3000')
  requireSafeTarget(baseUrl)

  const fixturePath = resolve(process.env.LOAD_TEST_FIXTURE_PATH || 'load-test-fixture.json')
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8')) as LoadTestFixture
  const reportPath = resolve(
    process.env.LOAD_TEST_REPORT_PATH || 'artifacts/load-tests/critical-path-baseline.json'
  )

  const warmup = await timedFetch(new URL(`/${fixture.handle}`, baseUrl), undefined, [200])
  if (!warmup.ok) throw new Error(`Public presence warm-up failed with HTTP ${warmup.status}`)

  const availabilityUrl = new URL('/api/availability', baseUrl)
  availabilityUrl.searchParams.set('slug', fixture.handle)
  availabilityUrl.searchParams.set('serviceId', fixture.serviceId)
  availabilityUrl.searchParams.set('date', fixture.bookingDate)

  const scenarios: ScenarioResult[] = []
  scenarios.push(
    await runReadScenario({
      name: 'cached public presence',
      concurrency: 12,
      iterations: 8,
      url: new URL(`/${fixture.handle}`, baseUrl),
      p95LimitMs: 1_000,
      minimumThroughput: 8,
    })
  )
  scenarios.push(
    await runReadScenario({
      name: 'availability calculation',
      concurrency: 8,
      iterations: 5,
      url: availabilityUrl,
      p95LimitMs: 1_500,
      minimumThroughput: 4,
    })
  )
  scenarios.push(await runHandleScenario(baseUrl, fixture))
  scenarios.push(await runLoginScenario(baseUrl, fixture))
  scenarios.push(await runBookingConflictScenario(baseUrl, fixture))

  const failures = scenarios.flatMap(scenario => scenario.failures)
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseline: 'isolated GitHub runner, production Next.js build, PostgreSQL 16',
    target: {
      origin: baseUrl.origin,
      handle: fixture.handle,
      bookingDate: fixture.bookingDate,
    },
    scenarios,
    failures,
  }

  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  await writeFile(reportPath.replace(/\.json$/, '.md'), renderMarkdown(report))

  process.stdout.write(renderMarkdown(report))
  if (failures.length) process.exitCode = 1
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
