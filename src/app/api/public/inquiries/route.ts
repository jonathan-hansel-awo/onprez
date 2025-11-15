/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const headersList = headers()
    const forwarded = (await headersList).get('x-forwarded-for')
    const ip = forwarded
      ? forwarded.split(',')[0]
      : (await headersList).get('x-real-ip') || 'unknown'

    // Rate limiting: 5 inquiries per minute per IP
    if (!checkRateLimit(ip, 5, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const {
      businessId,
      customerName,
      customerEmail,
      customerPhone,
      subject,
      message,
      preferredContact,
    } = await request.json()

    // Validation
    if (!businessId || !customerName || !customerEmail || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Required fields are missing' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
    }

    // Check if business exists and inquiries are enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        email: true,
        settings: true,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    // Check if inquiries are enabled in business settings
    const settings = business.settings as any
    if (settings?.inquiriesEnabled === false) {
      return NextResponse.json(
        { success: false, error: 'Inquiries are currently disabled' },
        { status: 403 }
      )
    }

    // Check if customer already exists
    let customer = await prisma.customer.findFirst({
      where: {
        businessId,
        email: customerEmail,
      },
    })

    // Create customer if doesn't exist
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          businessId,
          email: customerEmail,
          name: customerName,
          phone: customerPhone || null,
        },
      })
    }

    // Get user agent
    const userAgent = (await headersList).get('user-agent') || undefined

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        businessId,
        customerId: customer.id,
        customerEmail,
        customerName,
        customerPhone: customerPhone || null,
        subject,
        message,
        status: 'PENDING',
        priority: 'NORMAL',
        isRead: false,
        ipAddress: ip,
        userAgent,
      },
    })

    // TODO: Send email notification to business owner
    // This would be implemented in Milestone 11 with email service

    return NextResponse.json({
      success: true,
      data: { inquiry },
      message: 'Inquiry submitted successfully',
    })
  } catch (error) {
    console.error('Submit inquiry error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit inquiry' }, { status: 500 })
  }
}
