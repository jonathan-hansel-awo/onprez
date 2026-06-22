import { checkRateLimit } from '@/lib/services/rate-limit'
import { checkHandleAvailability } from '@/lib/services/signup'
import { RESERVED_HANDLES } from '@/lib/validation/auth'
import { NextRequest, NextResponse } from 'next/server'

const HANDLE_REGEX = /^[a-z0-9-]+$/

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  return forwarded ? forwarded.split(',')[0]?.trim() || 'unknown' : realIp || 'unknown'
}

export async function GET(request: NextRequest) {
  try {
    const handle = request.nextUrl.searchParams.get('handle')

    if (!handle) {
      return NextResponse.json(
        {
          available: false,
          reason: 'Handle is required',
        },
        { status: 400 }
      )
    }

    const ipAddress = getClientIp(request)
    const rateLimitKey = `handle-check:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'handle:check')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)

      return NextResponse.json(
        {
          available: false,
          reason: 'Too many requests. Please slow down.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.floor(rateLimit.resetAt.getTime() / 1000).toString(),
            'Retry-After': (rateLimit.retryAfter || resetInSeconds).toString(),
          },
        }
      )
    }

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

    if (RESERVED_HANDLES.includes(normalizedHandle as (typeof RESERVED_HANDLES)[number])) {
      return NextResponse.json({
        available: false,
        reason: 'This handle is reserved',
      })
    }

    const result = await checkHandleAvailability(normalizedHandle)

    return NextResponse.json({
      available: result.available,
      reason: result.reason,
    })
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
