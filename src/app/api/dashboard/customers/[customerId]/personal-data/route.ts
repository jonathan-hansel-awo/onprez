import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'
import { recordLifecycleAction } from '@/lib/data-lifecycle/audit'
import { anonymizeCustomer } from '@/lib/data-lifecycle/customer-anonymization'
import {
  enforceLifecycleRateLimit,
  verifyLifecyclePassword,
} from '@/lib/data-lifecycle/verification'
import { prisma } from '@/lib/prisma'

const requestSchema = z.object({
  businessId: z.string().min(1),
  password: z.string().min(1).max(256),
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResponse = await enforceLifecycleRateLimit(request, user.id, 'customer-delete')
    if (rateLimitResponse) return rateLimitResponse

    const validation = requestSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Business and password are required' },
        { status: 400 }
      )
    }

    const { customerId } = await params
    await requireBusinessRole(user.id, validation.data.businessId, ['ADMIN', 'MANAGER'])

    if (!(await verifyLifecyclePassword(user.id, validation.data.password))) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 })
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id_businessId: { id: customerId, businessId: validation.data.businessId },
      },
      select: { id: true },
    })

    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 })
    }

    const result = await anonymizeCustomer(validation.data.businessId, customerId)
    if (!result) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 })
    }

    await recordLifecycleAction({
      userId: user.id,
      action: 'customer_personal_data_anonymised',
      request,
      details: {
        businessId: validation.data.businessId,
        customerId,
        retainedAppointmentCount: result.retainedAppointmentCount,
        retainedData: ['booking timing', 'service', 'status', 'payment and policy records'],
      },
      severity: 'warning',
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Personal data removed. Required booking and payment records were retained.',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Customer personal-data removal failed:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to remove customer personal data' },
      { status: 500 }
    )
  }
}
