import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'

const updateThemeSchema = z.object({
  theme: z
    .record(z.string(), z.unknown())
    .refine(value => Object.keys(value).length > 0, 'Theme cannot be empty')
    .refine(value => Object.keys(value).length <= 50, 'Theme payload is too large'),
})

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const body = await request.json()

    const validation = updateThemeSchema.safeParse(body)

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

    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        settings: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const currentSettings = toRecord(business.settings)
    const updatedSettings = {
      ...currentSettings,
      theme: validation.data.theme,
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: context.businessId },
      data: {
        settings: updatedSettings as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        settings: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Theme updated successfully',
      data: {
        business: updatedBusiness,
        access: {
          role: context.role,
          isOwner: context.isOwner,
        },
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update theme error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update theme' }, { status: 500 })
  }
}
