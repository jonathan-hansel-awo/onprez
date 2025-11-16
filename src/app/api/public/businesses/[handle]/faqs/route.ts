import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }  // Changed to Promise
) {
  try {
    const { handle } = await params  // Add await here

    // Find business by slug/handle
    const business = await prisma.business.findUnique({
      where: { slug: handle },
    })

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      )
    }

    // Fetch active FAQs
    const faqs = await prisma.fAQ.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        question: true,
        answer: true,
        order: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { faqs },
    })
  } catch (error) {
    console.error('Fetch public FAQs error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQs' },
      { status: 500 }
    )
  }
}
