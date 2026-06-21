import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/services/security-logging'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const device = await prisma.trustedDevice.findFirst({
      where: {
        id,
        userId: user.id,
        revokedAt: null,
      },
      select: {
        id: true,
        userId: true,
        ipAddress: true,
      },
    })

    if (!device) {
      return NextResponse.json(
        { success: false, message: 'Trusted device not found' },
        { status: 404 }
      )
    }

    await prisma.trustedDevice.updateMany({
      where: {
        id,
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logSecurityEvent({
      userId: user.id,
      action: 'trusted_device_revoked',
      details: {
        trustedDeviceId: id,
        trustedDeviceIp: device.ipAddress,
      },
      ipAddress,
      userAgent,
      severity: 'warning',
    })

    return NextResponse.json({
      success: true,
      message: 'Trusted device revoked successfully',
    })
  } catch (error) {
    console.error('Revoke trusted device API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
