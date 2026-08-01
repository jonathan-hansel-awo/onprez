/** @jest-environment node */

import { percentile, runWorkers, summariseScenario } from './lib'

describe('critical-path load test metrics', () => {
  it('calculates nearest-rank percentiles without mutating the input', () => {
    const values = [50, 10, 40, 20, 30]

    expect(percentile(values, 50)).toBe(30)
    expect(percentile(values, 95)).toBe(50)
    expect(values).toEqual([50, 10, 40, 20, 30])
  })

  it('summarises throughput, failures, latency, and status counts', () => {
    const summary = summariseScenario(
      'public presence',
      [
        { durationMs: 10, status: 200, ok: true },
        { durationMs: 20, status: 200, ok: true },
        { durationMs: 30, status: 500, ok: false },
      ],
      1_000
    )

    expect(summary).toMatchObject({
      requests: 3,
      failures: 1,
      errorRate: 0.33,
      throughputPerSecond: 3,
      statusCounts: { '200': 2, '500': 1 },
      latencyMs: { min: 10, p50: 20, p95: 30, p99: 30, max: 30 },
    })
  })

  it('runs the requested number of sequential iterations per worker', async () => {
    const seen: string[] = []
    const result = await runWorkers(3, 2, async (worker, iteration) => {
      seen.push(`${worker}:${iteration}`)
      return { durationMs: 1, status: 200, ok: true }
    })

    expect(result.samples).toHaveLength(6)
    expect(seen).toEqual(expect.arrayContaining(['0:0', '0:1', '1:0', '1:1', '2:0', '2:1']))
  })
})
