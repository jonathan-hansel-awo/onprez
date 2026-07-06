import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse, requireBusinessAccess } from '@/lib/auth/business-access'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    const context = await requireBusinessAccess(user.id, businessId)

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        tagline: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        website: true,
        timezone: true,
        logoUrl: true,
        coverImageUrl: true,
        socialLinks: true,
        settings: true,
        branding: true,
        isPublished: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        business,
        access: {
          role: context.role,
          isOwner: context.isOwner,
        },
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Fetch business error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch business' }, { status: 500 })
  }
}
