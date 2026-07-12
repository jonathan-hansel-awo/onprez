import {
  BusinessAuthError,
  requireBusinessAccess,
  requireBusinessRole,
  requireDefaultBusinessContext,
  type BusinessAccessContext,
  type BusinessRole,
} from '@/lib/auth/business-access'
import type { NextRequest } from 'next/server'

const DEFAULT_WRITE_ROLES: BusinessRole[] = ['ADMIN', 'MANAGER']

type BusinessSelection = string | Pick<NextRequest, 'headers' | 'nextUrl'> | null | undefined

function getSelectedBusinessId(selection: BusinessSelection): string | undefined {
  if (typeof selection === 'string') {
    return selection.trim() || undefined
  }

  if (!selection) {
    return undefined
  }

  return (
    selection.nextUrl.searchParams.get('businessId')?.trim() ||
    selection.headers.get('x-business-id')?.trim() ||
    undefined
  )
}

export async function getCurrentBusinessContext(
  userId: string,
  selection?: BusinessSelection
): Promise<BusinessAccessContext | null> {
  const businessId = getSelectedBusinessId(selection)

  if (businessId) {
    return requireBusinessAccess(userId, businessId)
  }

  try {
    return await requireDefaultBusinessContext(userId)
  } catch (error) {
    if (error instanceof BusinessAuthError && error.code === 'BUSINESS_NOT_FOUND') {
      return null
    }

    throw error
  }
}

export async function requireCurrentBusinessContext(
  userId: string,
  selection?: BusinessSelection
): Promise<BusinessAccessContext> {
  const context = await getCurrentBusinessContext(userId, selection)

  if (!context) {
    throw new BusinessAuthError('Business not found', 404, 'BUSINESS_NOT_FOUND')
  }

  return context
}

export async function resolveReadableBusinessContext(
  userId: string,
  selection?: BusinessSelection
): Promise<BusinessAccessContext> {
  return requireCurrentBusinessContext(userId, selection)
}

export async function resolveWritableBusinessContext(
  userId: string,
  selection?: BusinessSelection,
  allowedRoles: BusinessRole[] = DEFAULT_WRITE_ROLES
): Promise<BusinessAccessContext> {
  const businessId = getSelectedBusinessId(selection)

  if (businessId) {
    return requireBusinessRole(userId, businessId, allowedRoles)
  }

  const context = await requireDefaultBusinessContext(userId)

  if (context.isOwner || allowedRoles.includes(context.role)) {
    return context
  }

  throw new BusinessAuthError('You do not have permission to perform this action', 403, 'FORBIDDEN')
}
