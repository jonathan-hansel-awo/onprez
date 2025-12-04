import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Get service with business owner check
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            ownerId: true,
          },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    if (service.business.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Toggle active status
    const updatedService = await prisma.service.update({
      where: { id },
      data: { active: !service.active },
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Toggle service error:', error)
    return NextResponse.json({ error: 'Failed to toggle service' }, { status: 500 })
  }
}
