import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'

const bulkUpdateSchema = z.object({
  serviceIds: z
    .array(z.string())
    .min(1)
    .max(100)
    .refine(ids => new Set(ids).size === ids.length, {
      message: 'Duplicate service IDs are not allowed',
    }),
  action: z.enum(['activate', 'deactivate', 'delete', 'feature', 'unfeature']),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = bulkUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { serviceIds, action } = validation.data

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

    for (const businessId of businessIds) {
      await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])
    }

    const scopedWhere = {
      id: { in: serviceIds },
      businessId: { in: businessIds },
    }

    switch (action) {
      case 'activate':
        await prisma.service.updateMany({
          where: scopedWhere,
          data: { active: true },
        })
        break

      case 'deactivate':
        await prisma.service.updateMany({
          where: scopedWhere,
          data: { active: false },
        })
        break

      case 'delete':
        await prisma.service.deleteMany({
          where: scopedWhere,
        })
        break

      case 'feature':
        await prisma.service.updateMany({
          where: scopedWhere,
          data: { featured: true },
        })
        break

      case 'unfeature':
        await prisma.service.updateMany({
          where: scopedWhere,
          data: { featured: false },
        })
        break
    }

    return NextResponse.json({
      success: true,
      message: `${serviceIds.length} service(s) updated`,
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Bulk update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update services' },
      { status: 500 }
    )
  }
}
