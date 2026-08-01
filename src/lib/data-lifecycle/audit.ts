import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function firstForwardedValue(value: string | null) {
  return value?.split(',')[0]?.trim() || undefined
}

export function getLifecycleRequestMetadata(request: NextRequest) {
  return {
    ipAddress:
      firstForwardedValue(request.headers.get('x-forwarded-for')) ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent')?.slice(0, 512) || undefined,
  }
}

export async function recordLifecycleAction({
  userId,
  action,
  request,
  details,
  severity = 'info',
}: {
  userId: string
  action: string
  request: NextRequest
  details?: Record<string, unknown>
  severity?: 'info' | 'warning' | 'error' | 'critical'
}) {
  const requestMetadata = getLifecycleRequestMetadata(request)

  await prisma.securityLog.create({
    data: {
      userId,
      action,
      details: (details ?? {}) as Prisma.InputJsonValue,
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
      severity,
    },
  })
}
