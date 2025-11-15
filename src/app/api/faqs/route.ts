import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

// GET - Fetch FAQs for a business
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

    // Fetch FAQs
    const faqs = await prisma.fAQ.findMany({
      where: {
        businessId: businessId,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: { faqs },
    })
  } catch (error) {
    console.error('Fetch FAQs error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch FAQs' }, { status: 500 })
  }
}

// POST - Create a new FAQ
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, question, answer, order } = await request.json()

    if (!businessId || !question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Business ID, question, and answer are required' },
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

    // Get the next order number if not provided
    let faqOrder = order
    if (faqOrder === undefined) {
      const lastFaq = await prisma.fAQ.findFirst({
        where: { businessId },
        orderBy: { order: 'desc' },
      })
      faqOrder = lastFaq ? lastFaq.order + 1 : 0
    }

    // Create FAQ
    const faq = await prisma.fAQ.create({
      data: {
        businessId,
        question,
        answer,
        order: faqOrder,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { faq },
      message: 'FAQ created successfully',
    })
  } catch (error) {
    console.error('Create FAQ error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create FAQ' }, { status: 500 })
  }
}

// PUT - Update FAQ
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { faqId, businessId, question, answer, isActive } = await request.json()

    if (!faqId || !businessId) {
      return NextResponse.json(
        { success: false, error: 'FAQ ID and Business ID are required' },
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

    // Update FAQ
    const faq = await prisma.fAQ.update({
      where: { id: faqId },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({
      success: true,
      data: { faq },
      message: 'FAQ updated successfully',
    })
  } catch (error) {
    console.error('Update FAQ error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update FAQ' }, { status: 500 })
  }
}

// DELETE - Delete FAQ
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const faqId = searchParams.get('faqId')
    const businessId = searchParams.get('businessId')

    if (!faqId || !businessId) {
      return NextResponse.json(
        { success: false, error: 'FAQ ID and Business ID are required' },
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

    // Delete FAQ
    await prisma.fAQ.delete({
      where: { id: faqId },
    })

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully',
    })
  } catch (error) {
    console.error('Delete FAQ error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete FAQ' }, { status: 500 })
  }
}
