import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { apiError, logApiError } from '@/lib/api/error-response'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    })
  } catch (error) {
    logApiError('current-user-api', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
