import {
  BusinessAuthError,
  requireBusinessAccess,
  requireBusinessRole,
  requireDefaultBusinessContext,
  type BusinessAccessContext,
  type BusinessRole,
} from '@/lib/auth/business-access'

const DEFAULT_WRITE_ROLES: BusinessRole[] = ['ADMIN', 'MANAGER']

export async function resolveReadableBusinessContext(
  userId: string,
  businessId?: string | null
): Promise<BusinessAccessContext> {
  if (businessId) {
    return requireBusinessAccess(userId, businessId)
  }

  return requireDefaultBusinessContext(userId)
}

export async function resolveWritableBusinessContext(
  userId: string,
  businessId?: string | null,
  allowedRoles: BusinessRole[] = DEFAULT_WRITE_ROLES
): Promise<BusinessAccessContext> {
  if (businessId) {
    return requireBusinessRole(userId, businessId, allowedRoles)
  }

  const context = await requireDefaultBusinessContext(userId)

  if (context.isOwner || allowedRoles.includes(context.role)) {
    return context
  }

  throw new BusinessAuthError('You do not have permission to perform this action', 403, 'FORBIDDEN')
}
