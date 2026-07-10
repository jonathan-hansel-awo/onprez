import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { requireServiceRole } from '@/lib/auth/service-access'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const { service } = await requireServiceRole(user.id, id, ['ADMIN', 'MANAGER'])

    const updatedService = await prisma.service.update({
      where: { id },
      data: { active: !service.active },
      select: {
        id: true,
        name: true,
        active: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: { service: updatedService },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Toggle service error:', error)
    return NextResponse.json({ success: false, error: 'Failed to toggle service' }, { status: 500 })
  }
}
