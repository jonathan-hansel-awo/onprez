import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth/get-user'
import type { AuthUser } from '@/types/auth'

export class PlatformAdminError extends Error {
  constructor(
    message: string,
    public status: 401 | 403
  ) {
    super(message)
    this.name = 'PlatformAdminError'
  }
}

export async function requirePlatformAdminApi(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new PlatformAdminError('Unauthorized', 401)
  }

  if (!isAdmin(user)) {
    throw new PlatformAdminError('Forbidden', 403)
  }

  return user
}

export function platformAdminErrorResponse(error: unknown) {
  if (error instanceof PlatformAdminError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status })
  }

  return undefined
}
