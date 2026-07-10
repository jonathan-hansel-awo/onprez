import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { z } from 'zod'
import { businessAuthErrorResponse, requireBusinessRole } from '@/lib/auth/business-access'

const reorderFaqsSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required').max(128),
  faqIds: z.array(z.string().min(1).max(128)).min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = reorderFaqsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { businessId, faqIds } = validation.data

    const uniqueFaqIds = [...new Set(faqIds)]

    if (uniqueFaqIds.length !== faqIds.length) {
      return NextResponse.json({ success: false, error: 'FAQ IDs must be unique' }, { status: 400 })
    }

    const context = await requireBusinessRole(user.id, businessId, ['ADMIN', 'MANAGER'])

    const existingFaqs = await prisma.fAQ.findMany({
      where: {
        businessId: context.businessId,
        id: {
          in: uniqueFaqIds,
        },
      },
      select: {
        id: true,
      },
    })

    if (existingFaqs.length !== uniqueFaqIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more FAQs were not found for this business' },
        { status: 404 }
      )
    }

    await prisma.$transaction(
      uniqueFaqIds.map((faqId, index) =>
        prisma.fAQ.updateMany({
          where: {
            id: faqId,
            businessId: context.businessId,
          },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'FAQs reordered successfully',
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Reorder FAQs error:', error)
    return NextResponse.json({ success: false, error: 'Failed to reorder FAQs' }, { status: 500 })
  }
}
