import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { Prisma } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }  // Changed to Promise
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params  // Add await here
    const { theme } = await request.json()

    if (!theme) {
      return NextResponse.json({ success: false, error: 'Theme data is required' }, { status: 400 })
    }

    // Verify user owns the business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: user.id,
      },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or access denied' },
        { status: 404 }
      )
    }

    // Update business settings with theme
    const currentSettings = (business.settings as Prisma.JsonObject) || {}
    const updatedSettings = {
      ...currentSettings,
      theme: theme,
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        settings: updatedSettings,
      },
    })

    return NextResponse.json({
      success: true,
      data: { business: updatedBusiness },
      message: 'Theme updated successfully',
    })
  } catch (error) {
    console.error('Update theme error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update theme' }, { status: 500 })
  }
}
