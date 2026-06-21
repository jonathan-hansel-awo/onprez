import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'

const ALLOWED_SEVERITIES = new Set(['info', 'warning', 'error', 'critical'])
const MAX_LIMIT = 100
const MAX_DAYS = 365

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || '', 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, max)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const page = parsePositiveInt(searchParams.get('page'), 1, Number.MAX_SAFE_INTEGER)
    const limit = parsePositiveInt(searchParams.get('limit'), 20, MAX_LIMIT)
    const days = parsePositiveInt(searchParams.get('days'), 90, MAX_DAYS)
    const skip = (page - 1) * limit

    const action = searchParams.get('action')
    const severity = searchParams.get('severity')

    const where: {
      userId: string
      createdAt: { gte: Date }
      action?: string
      severity?: string
    } = {
      userId: user.id,
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    }

    if (action && action !== 'all') {
      where.action = action.slice(0, 100)
    }

    if (severity && severity !== 'all' && ALLOWED_SEVERITIES.has(severity)) {
      where.severity = severity
    }

    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          severity: true,
          createdAt: true,
        },
      }),
      prisma.securityLog.count({ where }),
    ])

    const [actions, severities] = await Promise.all([
      prisma.securityLog.findMany({
        where: { userId: user.id },
        select: { action: true },
        distinct: ['action'],
        orderBy: { action: 'asc' },
      }),
      prisma.securityLog.findMany({
        where: { userId: user.id },
        select: { severity: true },
        distinct: ['severity'],
        orderBy: { severity: 'asc' },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + logs.length < total,
        },
        filters: {
          actions: actions.map(a => a.action),
          severities: severities.map(s => s.severity),
        },
      },
    })
  } catch (error) {
    console.error('Get security logs API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
