import { checkRateLimit } from '@/lib/services/rate-limit'
import { checkHandleAvailability } from '@/lib/services/signup'
import { RESERVED_HANDLES } from '@/lib/validation/auth'
import { NextRequest, NextResponse } from 'next/server'

const HANDLE_REGEX = /^[a-z0-9-]+$/

export async function GET(request: NextRequest) {
  try {
    // Get handle from query params
    const searchParams = request.nextUrl.searchParams
    const handle = searchParams.get('handle')

    console.log('🔍 Checking handle:', handle)

    if (!handle) {
      return NextResponse.json(
        {
          available: false,
          reason: 'Handle is required',
        },
        { status: 400 }
      )
    }

    console.log('📊 Querying database...')

    // Rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwarded ? forwarded.split(',')[0] : realIp || 'unknown'
    const rateLimitKey = `ip:${ipAddress}`
    const rateLimitResult = await checkRateLimit(rateLimitKey, 'handle:check')

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          available: false,
          reason: 'Too many requests. Please slow down.',
        },
        { status: 429 }
      )
    }

    // Validate format
    const normalizedHandle = handle.toLowerCase().trim()

    if (normalizedHandle.length < 3 || normalizedHandle.length > 30) {
      return NextResponse.json({
        available: false,
        reason: 'Handle must be between 3 and 30 characters',
      })
    }

    if (!HANDLE_REGEX.test(normalizedHandle)) {
      return NextResponse.json({
        available: false,
        reason: 'Handle can only contain lowercase letters, numbers, and hyphens',
      })
    }

    // Check if reserved
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (RESERVED_HANDLES.includes(normalizedHandle as any)) {
      return NextResponse.json({
        available: false,
        reason: 'This handle is reserved',
      })
    }

    // Check availability in database
    const result = await checkHandleAvailability(normalizedHandle)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Handle check error:', error)

    return NextResponse.json(
      {
        available: false,
        reason: 'Failed to check handle availability',
      },
      { status: 500 }
    )
  }
}
