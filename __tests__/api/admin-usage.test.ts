/** @jest-environment node */

import { GET } from '@/app/api/admin/usage/route'
import { platformAdminErrorResponse, requirePlatformAdminApi } from '@/lib/admin/access'
import { getPlatformUsageReport } from '@/lib/usage/business-usage'

jest.mock('@/lib/admin/access', () => ({
  requirePlatformAdminApi: jest.fn(),
  platformAdminErrorResponse: jest.fn(),
}))
jest.mock('@/lib/usage/business-usage', () => ({ getPlatformUsageReport: jest.fn() }))

const mockedRequireAdmin = jest.mocked(requirePlatformAdminApi)
const mockedAdminErrorResponse = jest.mocked(platformAdminErrorResponse)
const mockedGetReport = jest.mocked(getPlatformUsageReport)

describe('GET /api/admin/usage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedRequireAdmin.mockResolvedValue({ id: 'admin-1' } as never)
    mockedAdminErrorResponse.mockReturnValue(undefined)
    mockedGetReport.mockResolvedValue({ totals: { businesses: 2 } } as never)
  })

  it('returns the operator report only after platform-admin authorisation', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { totals: { businesses: 2 } },
    })
    expect(mockedRequireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
      mockedGetReport.mock.invocationCallOrder[0]
    )
  })

  it('does not calculate usage when the platform-admin guard fails', async () => {
    const accessError = new Error('Forbidden')
    const forbidden = new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
    mockedRequireAdmin.mockRejectedValue(accessError)
    mockedAdminErrorResponse.mockImplementation(error =>
      error === accessError ? (forbidden as never) : undefined
    )

    const response = await GET()

    expect(response.status).toBe(403)
    expect(mockedGetReport).not.toHaveBeenCalled()
  })
})
