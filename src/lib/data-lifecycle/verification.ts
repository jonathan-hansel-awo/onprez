import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { getLifecycleRequestMetadata } from './audit'

export async function verifyLifecyclePassword(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  })

  return user ? verifyPassword(password, user.passwordHash) : false
}

export async function enforceLifecycleRateLimit(
  request: NextRequest,
  userId: string,
  action: string
) {
  const { ipAddress } = getLifecycleRequestMetadata(request)
  const result = await checkRateLimit(
    `data-lifecycle:${action}:${userId}:${ipAddress}`,
    'auth:mfa-sensitive'
  )

  if (result.allowed) return null

  const retryAfter =
    result.retryAfter || Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000))

  return NextResponse.json(
    { success: false, message: 'Too many attempts. Please try again later.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
        'Retry-After': String(retryAfter),
      },
    }
  )
}
