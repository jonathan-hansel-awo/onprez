import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'

const businessHoursSchema = z.object({
  hours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        openTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
        closeTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
        isClosed: z.boolean(),
        notes: z.string().max(200).optional().nullable(),
      })
    )
    .length(7),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      include: {
        businessHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        businessHours: business.businessHours,
        timezone: business.timezone,
      },
    })
  } catch (error) {
    console.error('Get business hours error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch hours' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = businessHoursSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    // Delete existing hours and create new ones
    await prisma.businessHours.deleteMany({
      where: { businessId: business.id },
    })

    await prisma.businessHours.createMany({
      data: validation.data.hours.map(hour => ({
        businessId: business.id,
        ...hour,
      })),
    })

    const updatedHours = await prisma.businessHours.findMany({
      where: { businessId: business.id },
      orderBy: { dayOfWeek: 'asc' },
    })

    return NextResponse.json({
      success: true,
      message: 'Business hours updated successfully',
      data: { businessHours: updatedHours },
    })
  } catch (error) {
    console.error('Update business hours error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update hours' }, { status: 500 })
  }
}
