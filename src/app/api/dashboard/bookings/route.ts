import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'

// Query params validation
const querySchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['startTime', 'createdAt', 'customerName']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's business - check ownership first, then membership
    let businessId: string | null = null

    // Check if user owns a business
    const ownedBusiness = await prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    })

    if (ownedBusiness) {
      businessId = ownedBusiness.id
    } else {
      // Check if user is a member of a business
      const membership = await prisma.businessMember.findFirst({
        where: { userId: user.id },
        select: { businessId: true },
      })

      if (membership) {
        businessId = membership.businessId
      }
    }

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'No business found for user' },
        { status: 404 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const queryResult = querySchema.safeParse({
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      sortBy: searchParams.get('sortBy') || 'startTime',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      )
    }

    const { status, startDate, endDate, search, page, limit, sortBy, sortOrder } = queryResult.data

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      businessId,
    }

    if (status) {
      where.status = status
    }

    if (startDate) {
      where.startTime = {
        ...where.startTime,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      where.startTime = {
        ...where.startTime,
        lte: endDateTime,
      }
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { service: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Get total count
    const total = await prisma.appointment.count({ where })

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get status counts for filters
    const statusCounts = await prisma.appointment.groupBy({
      by: ['status'],
      where: { businessId },
      _count: { status: true },
    })

    const statusCountMap = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      data: {
        appointments: appointments.map(apt => ({
          id: apt.id,
          confirmationNumber: apt.id.slice(0, 8).toUpperCase(),
          startTime: apt.startTime,
          endTime: apt.endTime,
          duration: apt.duration,
          status: apt.status,
          customerName: apt.customerName,
          customerEmail: apt.customerEmail,
          customerPhone: apt.customerPhone,
          customerNotes: apt.customerNotes,
          businessNotes: apt.businessNotes,
          totalAmount: Number(apt.totalAmount),
          paymentStatus: apt.paymentStatus,
          service: {
            id: apt.service.id,
            name: apt.service.name,
            price: Number(apt.service.price),
            duration: apt.service.duration,
          },
          customer: apt.customer,
          createdAt: apt.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        statusCounts: statusCountMap,
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
