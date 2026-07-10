import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  businessAuthErrorResponse,
  requireBusinessAccess,
  requireBusinessRole,
} from '@/lib/auth/business-access'

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional().nullable(),
  color: z.string().trim().max(50).optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
})

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const category = await prisma.serviceCategory.findUnique({
      where: { id },
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

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    await requireBusinessAccess(user.id, category.businessId)

    return NextResponse.json({
      success: true,
      data: { category },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Fetch category error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch category' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      select: {
        id: true,
        businessId: true,
      },
    })

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    await requireBusinessRole(user.id, category.businessId, ['ADMIN', 'MANAGER'])

    const body = await request.json()
    const validation = updateCategorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, color, icon } = validation.data

    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        businessId: category.businessId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        id: {
          not: id,
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

    const updatedCategory = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
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

    return NextResponse.json({
      success: true,
      data: { category: updatedCategory },
      message: 'Category updated successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update category error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      select: {
        id: true,
        businessId: true,
        _count: {
          select: { services: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    await requireBusinessRole(user.id, category.businessId, ['ADMIN', 'MANAGER'])

    if (category._count.services > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete category with assigned services. Please reassign or delete the services first.',
        },
        { status: 400 }
      )
    }

    const result = await prisma.serviceCategory.deleteMany({
      where: {
        id,
        businessId: category.businessId,
      },
    })

    if (result.count !== 1) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Delete category error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
