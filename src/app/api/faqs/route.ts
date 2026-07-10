import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'
import {
  businessAuthErrorResponse,
  requireBusinessAccess,
  requireBusinessRole,
} from '@/lib/auth/business-access'

const createFaqSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required').max(128),
  question: z.string().trim().min(1, 'Question is required').max(500),
  answer: z.string().trim().min(1, 'Answer is required').max(5000),
  order: z.number().int().min(0).max(1000).optional(),
})

const updateFaqSchema = z.object({
  faqId: z.string().min(1, 'FAQ ID is required').max(128),
  businessId: z.string().min(1, 'Business ID is required').max(128),
  question: z.string().trim().min(1).max(500).optional(),
  answer: z.string().trim().min(1).max(5000).optional(),
  isActive: z.boolean().optional(),
})

const faqSelect = {
  id: true,
  businessId: true,
  question: true,
  answer: true,
  order: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = request.nextUrl.searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      )
    }

    const context = await requireBusinessAccess(user.id, businessId)

    const faqs = await prisma.fAQ.findMany({
      where: {
        businessId: context.businessId,
      },
      orderBy: {
        order: 'asc',
      },
      select: faqSelect,
    })

    return NextResponse.json({
      success: true,
      data: { faqs },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Fetch FAQs error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch FAQs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createFaqSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { businessId, question, answer, order } = validation.data
    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    let faqOrder = order

    if (faqOrder === undefined) {
      const lastFaq = await prisma.fAQ.findFirst({
        where: { businessId: context.businessId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })

      faqOrder = lastFaq ? lastFaq.order + 1 : 0
    }

    const faq = await prisma.fAQ.create({
      data: {
        businessId: context.businessId,
        question,
        answer,
        order: faqOrder,
        isActive: true,
      },
      select: faqSelect,
    })

    return NextResponse.json(
      {
        success: true,
        data: { faq },
        message: 'FAQ created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Create FAQ error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create FAQ' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateFaqSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { faqId, businessId, question, answer, isActive } = validation.data
    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    const existingFaq = await prisma.fAQ.findFirst({
      where: {
        id: faqId,
        businessId: context.businessId,
      },
      select: { id: true },
    })

    if (!existingFaq) {
      return NextResponse.json({ success: false, error: 'FAQ not found' }, { status: 404 })
    }

    const faq = await prisma.fAQ.update({
      where: { id: existingFaq.id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(isActive !== undefined && { isActive }),
      },
      select: faqSelect,
    })

    return NextResponse.json({
      success: true,
      data: { faq },
      message: 'FAQ updated successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update FAQ error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update FAQ' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const faqId = request.nextUrl.searchParams.get('faqId')
    const businessId = request.nextUrl.searchParams.get('businessId')

    if (!faqId || !businessId) {
      return NextResponse.json(
        { success: false, error: 'FAQ ID and Business ID are required' },
        { status: 400 }
      )
    }

    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    const result = await prisma.fAQ.deleteMany({
      where: {
        id: faqId,
        businessId: context.businessId,
      },
    })

    if (result.count !== 1) {
      return NextResponse.json({ success: false, error: 'FAQ not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Delete FAQ error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete FAQ' }, { status: 500 })
  }
}
