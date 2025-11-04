import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const devices = await prisma.trustedDevice.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      orderBy: { lastUsedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: { devices },
    })
  } catch (error) {
    console.error('Get trusted devices API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
