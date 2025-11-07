import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filters
    const action = searchParams.get('action')
    const severity = searchParams.get('severity')
    const days = parseInt(searchParams.get('days') || '90')

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      userId: user.id,
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    }

    if (action && action !== 'all') {
      where.action = action
    }

    if (severity && severity !== 'all') {
      where.severity = severity
    }

    // Get logs with pagination
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

    // Get unique actions and severities for filters
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
