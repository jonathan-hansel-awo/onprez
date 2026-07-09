import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const context = await resolveReadableBusinessContext(user.id)
    const businessId = context.businessId

    const services = await prisma.service.findMany({
      where: {
        businessId,
        ...(activeOnly ? { active: true } : {}),
      },
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        active: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      data: {
        services: services.map(service => ({
          ...service,
          price: Number(service.price),
        })),
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get services error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch services' }, { status: 500 })
  }
}
