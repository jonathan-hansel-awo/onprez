import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getMfaStatus } from '@/lib/services/mfa'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const status = await getMfaStatus(user.id)

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('MFA status API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
