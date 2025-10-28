import { NextRequest, NextResponse } from 'next/server'
import { verifyEmail } from '@/lib/services/email-verification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Verification token is required',
        },
        { status: 400 }
      )
    }

    // Get client info
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    // Verify email
    const result = await verifyEmail(token, ipAddress, userAgent)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Verify email API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during verification',
      },
      { status: 500 }
    )
  }
}
