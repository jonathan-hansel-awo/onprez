import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's business (assuming one business per user for now)
    const business = await prisma.business.findFirst({
      where: {
        ownerId: user.id,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'No business found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { business },
    })
  } catch (error) {
    console.error('Get current business error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch business' }, { status: 500 })
  }
}
