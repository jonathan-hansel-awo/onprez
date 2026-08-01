export type RequestSample = {
  durationMs: number
  status: number
  ok: boolean
  error?: string
}

export type ScenarioSummary = {
  name: string
  requests: number
  failures: number
  errorRate: number
  durationMs: number
  throughputPerSecond: number
  latencyMs: {
    min: number
    p50: number
    p95: number
    p99: number
    max: number
  }
  statusCounts: Record<string, number>
}

export function percentile(values: number[], percentileValue: number): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((left, right) => left - right)
  const rank = Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  return sorted[Math.min(rank, sorted.length - 1)]
}

function round(value: number): number {
  return Number(value.toFixed(2))
}

export function summariseScenario(
  name: string,
  samples: RequestSample[],
  durationMs: number
): ScenarioSummary {
  const latencies = samples.map(sample => sample.durationMs)
  const failures = samples.filter(sample => !sample.ok).length
  const statusCounts = samples.reduce<Record<string, number>>((counts, sample) => {
    const status = sample.status > 0 ? String(sample.status) : 'network_error'
    counts[status] = (counts[status] || 0) + 1
    return counts
  }, {})

  return {
    name,
    requests: samples.length,
    failures,
    errorRate: samples.length ? round(failures / samples.length) : 0,
    durationMs: round(durationMs),
    throughputPerSecond: durationMs > 0 ? round(samples.length / (durationMs / 1_000)) : 0,
    latencyMs: {
      min: latencies.length ? round(Math.min(...latencies)) : 0,
      p50: round(percentile(latencies, 50)),
      p95: round(percentile(latencies, 95)),
      p99: round(percentile(latencies, 99)),
      max: latencies.length ? round(Math.max(...latencies)) : 0,
    },
    statusCounts,
  }
}

export async function runWorkers(
  concurrency: number,
  iterationsPerWorker: number,
  request: (worker: number, iteration: number) => Promise<RequestSample>
): Promise<{ samples: RequestSample[]; durationMs: number }> {
  const startedAt = performance.now()
  const workerResults = await Promise.all(
    Array.from({ length: concurrency }, async (_, worker) => {
      const samples: RequestSample[] = []

      for (let iteration = 0; iteration < iterationsPerWorker; iteration += 1) {
        samples.push(await request(worker, iteration))
      }

      return samples
    })
  )

  return {
    samples: workerResults.flat(),
    durationMs: performance.now() - startedAt,
  }
}

export async function timedFetch(
  input: string | URL,
  init: RequestInit | undefined,
  acceptedStatuses: number[]
): Promise<RequestSample & { body: unknown }> {
  const startedAt = performance.now()

  try {
    const response = await fetch(input, init)
    const contentType = response.headers.get('content-type') || ''
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => '')

    return {
      durationMs: performance.now() - startedAt,
      status: response.status,
      ok: acceptedStatuses.includes(response.status),
      body,
      ...(!acceptedStatuses.includes(response.status)
        ? { error: `Unexpected HTTP ${response.status}` }
        : {}),
    }
  } catch (error) {
    return {
      durationMs: performance.now() - startedAt,
      status: 0,
      ok: false,
      body: null,
      error: error instanceof Error ? error.message : 'Request failed',
    }
  }
}
