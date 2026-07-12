import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export type BusinessRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER' | 'MEMBER'

export type BusinessAccessContext = {
  userId: string
  businessId: string
  role: BusinessRole
  isOwner: boolean
  business: {
    id: string
    name: string
    slug: string
    ownerId: string
    settings?: unknown
  }
}

export class BusinessAuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403 | 404,
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'BUSINESS_NOT_FOUND'
  ) {
    super(message)
    this.name = 'BusinessAuthError'
  }
}

function normalizeRole(role: unknown): BusinessRole {
  if (role === 'OWNER') return 'OWNER'
  if (role === 'ADMIN') return 'ADMIN'
  if (role === 'MANAGER') return 'MANAGER'
  if (role === 'STAFF') return 'STAFF'
  if (role === 'VIEWER') return 'VIEWER'
  if (role === 'MEMBER') return 'MEMBER'

  return 'MEMBER'
}

export async function getBusinessAccess(
  userId: string,
  businessId: string
): Promise<BusinessAccessContext | null> {
  const ownedBusiness = await prisma.business.findFirst({
    where: {
      id: businessId,
      ownerId: userId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      settings: true,
    },
  })

  if (ownedBusiness) {
    return {
      userId,
      businessId: ownedBusiness.id,
      role: 'OWNER',
      isOwner: true,
      business: ownedBusiness,
    }
  }

  const membership = await prisma.businessMember.findFirst({
    where: {
      userId,
      businessId,
    },
    select: {
      role: true,
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          settings: true,
        },
      },
    },
  })

  if (!membership) {
    return null
  }

  return {
    userId,
    businessId: membership.business.id,
    role: normalizeRole(membership.role),
    isOwner: false,
    business: membership.business,
  }
}

export async function requireBusinessAccess(
  userId: string,
  businessId: string
): Promise<BusinessAccessContext> {
  const context = await getBusinessAccess(userId, businessId)

  if (!context) {
    throw new BusinessAuthError('You do not have access to this business', 403, 'FORBIDDEN')
  }

  return context
}

export async function requireBusinessRole(
  userId: string,
  businessId: string,
  allowedRoles: BusinessRole[]
): Promise<BusinessAccessContext> {
  const context = await requireBusinessAccess(userId, businessId)

  if (context.isOwner) {
    return context
  }

  if (!allowedRoles.includes(context.role)) {
    throw new BusinessAuthError(
      'You do not have permission to perform this action',
      403,
      'FORBIDDEN'
    )
  }

  return context
}

export async function getDefaultBusinessContext(
  userId: string
): Promise<BusinessAccessContext | null> {
  const contexts = await getUserBusinessContexts(userId)
  return contexts[0] ?? null
}

export async function getUserBusinessContexts(userId: string): Promise<BusinessAccessContext[]> {
  const [ownedBusinesses, memberships] = await Promise.all([
    prisma.business.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        ownerId: true,
        settings: true,
        createdAt: true,
      },
    }),
    prisma.businessMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        createdAt: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
            settings: true,
            createdAt: true,
          },
        },
      },
    }),
  ])

  const contexts = new Map<string, BusinessAccessContext & { selectedAt: Date }>()

  for (const business of ownedBusinesses) {
    contexts.set(business.id, {
      userId,
      businessId: business.id,
      role: 'OWNER',
      isOwner: true,
      business,
      selectedAt: business.createdAt,
    })
  }

  for (const membership of memberships) {
    if (!contexts.has(membership.business.id)) {
      contexts.set(membership.business.id, {
        userId,
        businessId: membership.business.id,
        role: normalizeRole(membership.role),
        isOwner: false,
        business: membership.business,
        selectedAt: membership.createdAt,
      })
    }
  }

  return [...contexts.values()]
    .sort((left, right) => left.selectedAt.getTime() - right.selectedAt.getTime())
    .map(({ selectedAt: _selectedAt, ...context }) => context)
}

export async function requireDefaultBusinessContext(
  userId: string
): Promise<BusinessAccessContext> {
  const context = await getDefaultBusinessContext(userId)

  if (!context) {
    throw new BusinessAuthError('Business not found', 404, 'BUSINESS_NOT_FOUND')
  }

  return context
}

export function businessAuthErrorResponse(error: unknown) {
  if (error instanceof BusinessAuthError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: error.status }
    )
  }

  return undefined
}
