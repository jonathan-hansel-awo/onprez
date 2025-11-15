import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

// POST - Reorder FAQs
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, faqIds } = await request.json()

    if (!businessId || !Array.isArray(faqIds)) {
      return NextResponse.json(
        { success: false, error: 'Business ID and FAQ IDs array are required' },
        { status: 400 }
      )
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

    // Update order for each FAQ
    const updatePromises = faqIds.map((faqId, index) =>
      prisma.fAQ.update({
        where: { id: faqId },
        data: { order: index },
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: 'FAQs reordered successfully',
    })
  } catch (error) {
    console.error('Reorder FAQs error:', error)
    return NextResponse.json({ success: false, error: 'Failed to reorder FAQs' }, { status: 500 })
  }
}
