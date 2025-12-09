import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'
import { updateServiceSchema } from '@/lib/validation/service'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const service = (await prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        business: {
          select: {
            id: true,
            name: true,
            settings: true,
          },
        },
      },
    })) as any

    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    // Include effective booking limits
    const businessSettings = (service.business.settings as Record<string, unknown>) || {}
    const bookingConfig = (businessSettings.booking as Record<string, unknown>) || {}

    const effectiveLimits = {
      maxAdvanceDays:
        (service as any).maxAdvanceBookingDays ??
        (bookingConfig.advanceBookingDays as number) ??
        30,
      minAdvanceHours:
        (service as any).minAdvanceBookingHours ?? (bookingConfig.minAdvanceHours as number) ?? 0,
      usingBusinessDefaults: {
        maxAdvance: (service as any).maxAdvanceBookingDays === null,
        minAdvance: (service as any).minAdvanceBookingHours === null,
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        ...service,
        effectiveLimits,
      },
    })
  } catch (error) {
    console.error('Get service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to get service' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Get existing service and verify ownership
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        business: {
          select: { ownerId: true },
        },
      },
    })

    if (!existingService) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    if (existingService.business.ownerId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Validate input
    const validation = updateServiceSchema.safeParse({ ...body, id })
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { id: _, ...updateData } = validation.data

    // Update service
    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...updateData,
        price: updateData.price !== undefined ? updateData.price : undefined,
        priceRangeMin:
          updateData.priceRangeMin !== undefined ? updateData.priceRangeMin : undefined,
        priceRangeMax:
          updateData.priceRangeMax !== undefined ? updateData.priceRangeMax : undefined,
        depositAmount:
          updateData.depositAmount !== undefined ? updateData.depositAmount : undefined,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Service updated successfully',
    })
  } catch (error) {
    console.error('Update service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        business: {
          select: { ownerId: true },
        },
        _count: {
          select: { appointments: true },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    if (service.business.ownerId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Check for existing appointments
    if (service._count.appointments > 0) {
      // Soft delete - deactivate instead
      await prisma.service.update({
        where: { id },
        data: { active: false },
      })

      return NextResponse.json({
        success: true,
        message: 'Service deactivated (has existing appointments)',
        deactivated: true,
      })
    }

    // Hard delete
    await prisma.service.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    })
  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete service' }, { status: 500 })
  }
}
