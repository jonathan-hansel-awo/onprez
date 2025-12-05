import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { createSpecialDateSchema } from '@/lib/validation/business'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const upcoming = searchParams.get('upcoming')

    let whereClause: { businessId: string; date?: { gte?: Date; lte?: Date } } = {
      businessId: business.id,
    }

    if (year) {
      const yearNum = parseInt(year, 10)
      whereClause.date = {
        gte: new Date(`${yearNum}-01-01`),
        lte: new Date(`${yearNum}-12-31`),
      }
    } else if (upcoming === 'true') {
      whereClause.date = {
        gte: new Date(),
      }
    }

    const specialDates = await prisma.specialDate.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: { specialDates },
    })
  } catch (error) {
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

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = createSpecialDateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { date, name, isClosed, openTime, closeTime, notes, isRecurring } = validation.data

    // Check for existing special date on this date
    const existing = await prisma.specialDate.findUnique({
      where: {
        businessId_date: {
          businessId: business.id,
          date: new Date(date),
        },
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
        businessId: business.id,
        date: new Date(date),
        name,
        isClosed,
        openTime: isClosed ? null : openTime,
        closeTime: isClosed ? null : closeTime,
        notes,
        isRecurring: isRecurring || false,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Special date created successfully',
        data: { specialDate },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create special date error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create special date' },
      { status: 500 }
    )
  }
}
