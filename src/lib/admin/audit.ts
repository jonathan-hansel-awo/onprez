import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

function firstForwardedValue(value: string | null) {
  return value?.split(',')[0]?.trim() || undefined
}

export function getAdminRequestMetadata(request: NextRequest) {
  return {
    ipAddress:
      firstForwardedValue(request.headers.get('x-forwarded-for')) ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || undefined,
  }
}

export async function recordAdminAction({
  adminUserId,
  action,
  targetBusinessId,
  request,
  details,
  severity = 'info',
}: {
  adminUserId: string
  action: string
  targetBusinessId: string
  request: NextRequest
  details?: Record<string, unknown>
  severity?: 'info' | 'warning' | 'error' | 'critical'
}) {
  const metadata = getAdminRequestMetadata(request)

  await prisma.securityLog.create({
    data: {
      userId: adminUserId,
      action,
      details: {
        targetBusinessId,
        ...details,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      severity,
    },
  })
}
