import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }  // Changed to Promise
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params  // Add await here

    // Fetch business and verify ownership
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: user.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        website: true,
        socialLinks: true,
      },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { business },
    })
  } catch (error) {
    console.error('Fetch business error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business' },
      { status: 500 }
    )
  }
}
