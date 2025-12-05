import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkUpdateSchema = z.object({
  serviceIds: z.array(z.string()),
  action: z.enum(['activate', 'deactivate', 'delete', 'feature', 'unfeature']),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = bulkUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { serviceIds, action } = validation.data

    // Verify all services belong to user
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
      },
      include: {
        business: {
          select: { ownerId: true },
        },
      },
    })

    const unauthorized = services.some(s => s.business.ownerId !== user.id)
    if (unauthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Perform bulk action
    switch (action) {
      case 'activate':
        await prisma.service.updateMany({
          where: { id: { in: serviceIds } },
          data: { active: true },
        })
        break

      case 'deactivate':
        await prisma.service.updateMany({
          where: { id: { in: serviceIds } },
          data: { active: false },
        })
        break

      case 'delete':
        await prisma.service.deleteMany({
          where: { id: { in: serviceIds } },
        })
        break

      case 'feature':
        await prisma.service.updateMany({
          where: { id: { in: serviceIds } },
          data: { featured: true },
        })
        break

      case 'unfeature':
        await prisma.service.updateMany({
          where: { id: { in: serviceIds } },
          data: { featured: false },
        })
        break
    }

    return NextResponse.json({
      success: true,
      message: `${serviceIds.length} service(s) updated`,
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json({ error: 'Failed to update services' }, { status: 500 })
  }
}
