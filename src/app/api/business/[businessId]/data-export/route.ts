import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'
import { recordLifecycleAction } from '@/lib/data-lifecycle/audit'
import { buildBusinessExport, dataExportResponse } from '@/lib/data-lifecycle/export'
import {
  enforceLifecycleRateLimit,
  verifyLifecyclePassword,
} from '@/lib/data-lifecycle/verification'

const requestSchema = z.object({ password: z.string().min(1).max(256) })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const context = await requireBusinessRole(user.id, businessId, [])
    const rateLimitResponse = await enforceLifecycleRateLimit(request, user.id, 'business-export')
    if (rateLimitResponse) return rateLimitResponse

    const validation = requestSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Password is required' }, { status: 400 })
    }

    if (!(await verifyLifecyclePassword(user.id, validation.data.password))) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 })
    }

    const payload = await buildBusinessExport(context.businessId)
    await recordLifecycleAction({
      userId: user.id,
      action: 'business_data_exported',
      request,
      details: { businessId: context.businessId, exportVersion: payload.export.version },
    })

    const safeSlug = context.business.slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
    return dataExportResponse(
      payload,
      `onprez-${safeSlug}-data-${new Date().toISOString().slice(0, 10)}.json`
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Business data export failed:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to create the business export' },
      { status: 500 }
    )
  }
}
