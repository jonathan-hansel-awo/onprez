import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'

const reorderSchema = z.object({
  serviceIds: z
    .array(z.string())
    .min(1)
    .max(100)
    .refine(ids => new Set(ids).size === ids.length, {
      message: 'Duplicate service IDs are not allowed',
    }),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = reorderSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { serviceIds } = validation.data

    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
      },
      select: {
        id: true,
        businessId: true,
      },
    })

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more services were not found' },
        { status: 404 }
      )
    }

    const businessIds = [...new Set(services.map(service => service.businessId))]

    if (businessIds.length !== 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot reorder services across multiple businesses' },
        { status: 400 }
      )
    }

    const businessId = businessIds[0]
    await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    await prisma.$transaction(
      serviceIds.map((id, index) =>
        prisma.service.updateMany({
          where: {
            id,
            businessId,
          },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Reorder services error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reorder services' },
      { status: 500 }
    )
  }
}
