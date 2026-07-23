import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'
import { resolveReadableBusinessContext } from '@/lib/auth/business-route-utils'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'

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
    // Check if user owns a business
    const context = await resolveReadableBusinessContext(user.id, request)
    const businessId = context.businessId
    const businessSlug = context.business.slug

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
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            refundedAmount: true,
            refundStatus: true,
            refundReason: true,
            refundFailureMessage: true,
            retainedAt: true,
            retainedReason: true,
            lastReconciledAt: true,
            reconciliationSource: true,
            policySnapshot: true,
            paidAt: true,
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
          businessSlug,
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
          deposit: apt.payments[0]
            ? {
                paymentId: apt.payments[0].id,
                status: apt.payments[0].status,
                amount: Number(apt.payments[0].amount),
                currency: apt.payments[0].currency,
                paidAt: apt.payments[0].paidAt,
                refundedAmount: Number(apt.payments[0].refundedAmount),
                refundStatus: apt.payments[0].refundStatus,
                refundReason: apt.payments[0].refundReason,
                refundFailureMessage: apt.payments[0].refundFailureMessage,
                retainedAt: apt.payments[0].retainedAt,
                retainedReason: apt.payments[0].retainedReason,
                lastReconciledAt: apt.payments[0].lastReconciledAt,
                reconciliationSource: apt.payments[0].reconciliationSource,
                cancellationWindowHours:
                  apt.payments[0].policySnapshot &&
                  typeof apt.payments[0].policySnapshot === 'object' &&
                  !Array.isArray(apt.payments[0].policySnapshot) &&
                  typeof (apt.payments[0].policySnapshot as Record<string, unknown>)
                    .cancellationWindowHours === 'number'
                    ? (apt.payments[0].policySnapshot as Record<string, number>)
                        .cancellationWindowHours
                    : 24,
              }
            : null,
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
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Error fetching bookings:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
