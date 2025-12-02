import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        business: true,
        _count: {
          select: { services: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    // Verify ownership
    if (category.business.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: { category },
    })
  } catch (error) {
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
      include: { business: true },
    })

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    // Verify ownership
    if (category.business.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, icon } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    // Check for duplicate name (excluding current category)
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
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    // Update category
    const updatedCategory = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
      },
      include: {
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
      include: {
        business: true,
        _count: {
          select: { services: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    // Verify ownership
    if (category.business.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Check if category has services
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

    // Delete category
    await prisma.serviceCategory.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
