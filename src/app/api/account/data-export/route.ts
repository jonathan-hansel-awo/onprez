import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { recordLifecycleAction } from '@/lib/data-lifecycle/audit'
import { buildAccountExport, dataExportResponse } from '@/lib/data-lifecycle/export'
import {
  enforceLifecycleRateLimit,
  verifyLifecyclePassword,
} from '@/lib/data-lifecycle/verification'

const requestSchema = z.object({ password: z.string().min(1).max(256) })

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = await enforceLifecycleRateLimit(request, user.id, 'account-export')
    if (rateLimitResponse) return rateLimitResponse

    const validation = requestSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Password is required' }, { status: 400 })
    }

    if (!(await verifyLifecyclePassword(user.id, validation.data.password))) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 })
    }

    const payload = await buildAccountExport(user.id)
    await recordLifecycleAction({
      userId: user.id,
      action: 'account_data_exported',
      request,
      details: { exportVersion: payload.export.version },
    })

    return dataExportResponse(
      payload,
      `onprez-account-data-${new Date().toISOString().slice(0, 10)}.json`
    )
  } catch (error) {
    console.error('Account data export failed:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to create your account export' },
      { status: 500 }
    )
  }
}
