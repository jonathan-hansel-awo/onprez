import { NextResponse } from 'next/server'
import { platformAdminErrorResponse, requirePlatformAdminApi } from '@/lib/admin/access'
import { getPlatformUsageReport } from '@/lib/usage/business-usage'

export async function GET() {
  try {
    await requirePlatformAdminApi()
    const report = await getPlatformUsageReport()

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    const authResponse = platformAdminErrorResponse(error)
    if (authResponse) return authResponse

    return NextResponse.json(
      { success: false, error: 'Failed to load platform usage' },
      { status: 500 }
    )
  }
}
