import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reorderSchema = z.object({
  serviceIds: z.array(z.string()).min(1),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = reorderSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { serviceIds } = validation.data

    // Verify all services belong to user's business
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
      },
      include: {
        business: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    // Check ownership
    const unauthorized = services.some(service => service.business.ownerId !== user.id)
    if (unauthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update order for each service
    await prisma.$transaction(
      serviceIds.map((id, index) =>
        prisma.service.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reorder services error:', error)
    return NextResponse.json({ error: 'Failed to reorder services' }, { status: 500 })
  }
}
