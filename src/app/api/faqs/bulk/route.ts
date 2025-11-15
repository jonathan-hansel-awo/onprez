/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

// POST - Bulk create/update FAQs (useful for presence editor)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, faqs } = await request.json()

    if (!businessId || !Array.isArray(faqs)) {
      return NextResponse.json(
        { success: false, error: 'Business ID and FAQs array are required' },
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

    // Delete all existing FAQs and create new ones
    // This is a simple approach for syncing from presence editor
    await prisma.fAQ.deleteMany({
      where: { businessId },
    })

    // Create new FAQs
    const createdFaqs = await prisma.fAQ.createMany({
      data: faqs.map((faq: any, index: number) => ({
        businessId,
        question: faq.question,
        answer: faq.answer,
        order: index,
        isActive: true,
      })),
    })

    return NextResponse.json({
      success: true,
      data: { count: createdFaqs.count },
      message: 'FAQs synced successfully',
    })
  } catch (error) {
    console.error('Bulk FAQ operation error:', error)
    return NextResponse.json({ success: false, error: 'Failed to sync FAQs' }, { status: 500 })
  }
}
