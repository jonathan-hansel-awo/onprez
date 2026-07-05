import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { createSpecialDateSchema } from '@/lib/validation/business'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'
import { Prisma } from '@prisma/client'

function parseYear(value: string | null) {
  if (!value) return null

  const year = Number.parseInt(value, 10)

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return null
  }

  return year
}

function specialDateSelect() {
  return {
    id: true,
    businessId: true,
    date: true,
    name: true,
    isClosed: true,
    openTime: true,
    closeTime: true,
    notes: true,
    isRecurring: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.SpecialDateSelect
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const year = parseYear(searchParams.get('year'))
    const rawYear = searchParams.get('year')
    const upcoming = searchParams.get('upcoming')

    if (rawYear && !year) {
      return NextResponse.json({ success: false, error: 'Invalid year' }, { status: 400 })
    }

    const context = await resolveReadableBusinessContext(user.id, businessId)

    const whereClause: Prisma.SpecialDateWhereInput = {
      businessId: context.businessId,
    }

    if (year) {
      whereClause.date = {
        gte: new Date(Date.UTC(year, 0, 1)),
        lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
      }
    } else if (upcoming === 'true') {
      whereClause.date = {
        gte: new Date(),
      }
    }

    const specialDates = await prisma.specialDate.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
      select: specialDateSelect(),
    })

    return NextResponse.json({
      success: true,
      data: {
        businessId: context.businessId,
        specialDates,
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get special dates error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch special dates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const businessId = typeof body.businessId === 'string' ? body.businessId : undefined
    const { businessId: _businessId, ...specialDateBody } = body

    const validation = createSpecialDateSchema.safeParse(specialDateBody)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const context = await resolveWritableBusinessContext(user.id, businessId)

    const { date, name, isClosed, openTime, closeTime, notes, isRecurring } = validation.data
    const specialDateDate = new Date(date)

    const existing = await prisma.specialDate.findUnique({
      where: {
        businessId_date: {
          businessId: context.businessId,
          date: specialDateDate,
        },
      },
      select: {
        id: true,
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A special date already exists for this date' },
        { status: 409 }
      )
    }

    const specialDate = await prisma.specialDate.create({
      data: {
        businessId: context.businessId,
        date: specialDateDate,
        name,
        isClosed,
        openTime: isClosed ? null : openTime,
        closeTime: isClosed ? null : closeTime,
        notes,
        isRecurring: isRecurring || false,
      },
      select: specialDateSelect(),
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Special date created successfully',
        data: {
          businessId: context.businessId,
          specialDate,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A special date already exists for this date' },
        { status: 409 }
      )
    }

    console.error('Create special date error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create special date' },
      { status: 500 }
    )
  }
}
