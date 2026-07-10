import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const inquirySchema = z.object({
  businessId: z.string().min(1).max(128),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: z.string().trim().max(20).optional().default(''),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(2000),
  preferredContact: z.enum(['EMAIL', 'PHONE', 'EITHER']).optional().default('EMAIL'),
})

function checkRateLimit(ip: string, limit = 5, windowMs = 60_000) {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count += 1
  return true
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  return forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
}

function getSettingsRecord(settings: unknown): Record<string, unknown> {
  return settings && typeof settings === 'object' && !Array.isArray(settings)
    ? (settings as Record<string, unknown>)
    : {}
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    if (!checkRateLimit(ip, 5, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validation = inquirySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      )
    }

    const data = validation.data
    const customerEmail = data.customerEmail.toLowerCase()

    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: {
        id: true,
        name: true,
        email: true,
        settings: true,
        isPublished: true,
      },
    })

    if (!business || !business.isPublished) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const settings = getSettingsRecord(business.settings)

    if (settings.inquiriesEnabled === false) {
      return NextResponse.json(
        { success: false, error: 'Inquiries are currently disabled' },
        { status: 403 }
      )
    }

    let customer = await prisma.customer.findFirst({
      where: {
        businessId: business.id,
        email: customerEmail,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          businessId: business.id,
          email: customerEmail,
          name: data.customerName,
          phone: data.customerPhone || null,
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
      })
    }

    const userAgent = request.headers.get('user-agent') || undefined

    // Build payload as any to avoid strict Prisma type mismatch for optional/renamed fields
    const createPayload: any = {
      businessId: business.id,
      customerId: customer.id,
      customerEmail,
      customerName: data.customerName,
      customerPhone: data.customerPhone || null,
      subject: data.subject,
      message: data.message,
      status: 'PENDING',
      priority: 'NORMAL',
      isRead: false,
      ipAddress: ip,
      userAgent,
    }

    if (data.preferredContact) {
      // include preferredContact only when provided to avoid TypeScript error if the DB field was renamed
      createPayload.preferredContact = data.preferredContact
    }

    const inquiry = await prisma.inquiry.create({
      data: createPayload,
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: { inquiry },
        message: 'Inquiry submitted successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Submit inquiry error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit inquiry' }, { status: 500 })
  }
}
