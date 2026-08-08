import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { prisma } from '@/lib/prisma'
import { bulkCloseDatesSchema } from '@/lib/validation/business'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const businessId = typeof body.businessId === 'string' ? body.businessId : undefined
    const { businessId: _businessId, ...bulkBody } = body
    const validation = bulkCloseDatesSchema.safeParse(bulkBody)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const context = await resolveWritableBusinessContext(user.id, businessId || request)
    const dates = validation.data.dates.map(date => new Date(`${date}T00:00:00.000Z`))
    const existingDates = await prisma.specialDate.findMany({
      where: {
        businessId: context.businessId,
        date: { in: dates },
      },
      select: { date: true },
    })

    if (existingDates.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more selected dates already have special hours or a closure',
          data: {
            conflictingDates: existingDates.map(item => item.date.toISOString().slice(0, 10)),
          },
        },
        { status: 409 }
      )
    }

    const result = await prisma.specialDate.createMany({
      data: dates.map(date => ({
        businessId: context.businessId,
        date,
        name: validation.data.name,
        isClosed: true,
        openTime: null,
        closeTime: null,
        notes: validation.data.notes || null,
        isRecurring: false,
      })),
    })

    return NextResponse.json(
      {
        success: true,
        message: `${result.count} ${result.count === 1 ? 'date' : 'dates'} blocked successfully`,
        data: { businessId: context.businessId, count: result.count },
      },
      { status: 201 }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'One or more selected dates already have a closure' },
        { status: 409 }
      )
    }

    console.error('Bulk close dates error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to block selected dates' },
      { status: 500 }
    )
  }
}
