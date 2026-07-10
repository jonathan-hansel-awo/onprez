import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  businessAuthErrorResponse,
  requireBusinessAccess,
  requireBusinessRole,
} from '@/lib/auth/business-access'

const createCategorySchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional().nullable(),
  color: z.string().trim().max(50).optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      )
    }

    const context = await requireBusinessAccess(user.id, businessId)

    const categories = await prisma.serviceCategory.findMany({
      where: {
        businessId: context.businessId,
      },
      select: {
        id: true,
        businessId: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { services: true },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: { categories },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Fetch categories error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
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
    const validation = createCategorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { businessId, name, description, color, icon } = validation.data

    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        businessId: context.businessId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    const maxOrderCategory = await prisma.serviceCategory.findFirst({
      where: { businessId: context.businessId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const newOrder = (maxOrderCategory?.order ?? -1) + 1

    const category = await prisma.serviceCategory.create({
      data: {
        businessId: context.businessId,
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
        order: newOrder,
      },
      select: {
        id: true,
        businessId: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { services: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: { category },
        message: 'Category created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Create category error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
