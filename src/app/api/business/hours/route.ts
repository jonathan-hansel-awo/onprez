import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'

const businessHoursSchema = z.object({
  businessId: z.string().optional(),
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

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    const context = await resolveReadableBusinessContext(user.id, businessId || request)

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        timezone: true,
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
        businessId: business.id,
        businessHours: business.businessHours,
        timezone: business.timezone,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

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

    const context = await resolveWritableBusinessContext(
      user.id,
      validation.data.businessId || request
    )

    await prisma.$transaction([
      prisma.businessHours.deleteMany({
        where: { businessId: context.businessId },
      }),
      prisma.businessHours.createMany({
        data: validation.data.hours.map(hour => ({
          businessId: context.businessId,
          dayOfWeek: hour.dayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isClosed: hour.isClosed,
          notes: hour.notes,
        })),
      }),
    ])

    const updatedHours = await prisma.businessHours.findMany({
      where: { businessId: context.businessId },
      orderBy: { dayOfWeek: 'asc' },
    })

    return NextResponse.json({
      success: true,
      message: 'Business hours updated successfully',
      data: {
        businessId: context.businessId,
        businessHours: updatedHours,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update business hours error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update hours' }, { status: 500 })
  }
}
