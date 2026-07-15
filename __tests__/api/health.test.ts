/** @jest-environment node */

import { GET } from '@/app/api/health/route'
import { logApiError } from '@/lib/api/error-response'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

jest.mock('@/lib/api/error-response', () => ({
  logApiError: jest.fn(),
}))

const queryRawMock = prisma.$queryRaw as jest.Mock
const logApiErrorMock = logApiError as jest.Mock

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reports healthy when the database is reachable', async () => {
    queryRawMock.mockResolvedValueOnce([{ result: 1 }])

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0')
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('returns a safe unavailable response when the database check fails', async () => {
    const databaseError = new Error('database secret and connection details')
    queryRawMock.mockRejectedValueOnce(databaseError)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0')
    expect(body).toEqual({ ok: false })
    expect(JSON.stringify(body)).not.toContain(databaseError.message)
    expect(logApiErrorMock).toHaveBeenCalledWith('health-check', databaseError)
  })
})
