import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'

const bulkFaqItemSchema = z.object({
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(5000),
  isActive: z.boolean().optional().default(true),
})

const bulkFaqSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required').max(128),
  faqs: z.array(bulkFaqItemSchema).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = bulkFaqSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { businessId, faqs } = validation.data
    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    const result = await prisma.$transaction(async tx => {
      await tx.fAQ.deleteMany({
        where: { businessId: context.businessId },
      })

      if (faqs.length === 0) {
        return { count: 0 }
      }

      return tx.fAQ.createMany({
        data: faqs.map((faq, index) => ({
          businessId: context.businessId,
          question: faq.question,
          answer: faq.answer,
          order: index,
          isActive: faq.isActive,
        })),
      })
    })

    return NextResponse.json({
      success: true,
      data: { count: result.count },
      message: 'FAQs synced successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Bulk FAQ operation error:', error)
    return NextResponse.json({ success: false, error: 'Failed to sync FAQs' }, { status: 500 })
  }
}
