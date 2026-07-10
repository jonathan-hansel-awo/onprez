import { prisma } from '@/lib/prisma'
import {
  BusinessAuthError,
  requireBusinessAccess,
  requireBusinessRole,
  type BusinessRole,
} from '@/lib/auth/business-access'

export async function getServiceBusiness(serviceId: string) {
  return prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      businessId: true,
      active: true,
      name: true,
    },
  })
}

export async function requireServiceAccess(userId: string, serviceId: string) {
  const service = await getServiceBusiness(serviceId)

  if (!service) {
    throw new BusinessAuthError('Service not found', 404, 'BUSINESS_NOT_FOUND')
  }

  const context = await requireBusinessAccess(userId, service.businessId)

  return {
    service,
    context,
  }
}

export async function requireServiceRole(
  userId: string,
  serviceId: string,
  roles: BusinessRole[] = ['ADMIN', 'MANAGER']
) {
  const service = await getServiceBusiness(serviceId)

  if (!service) {
    throw new BusinessAuthError('Service not found', 404, 'BUSINESS_NOT_FOUND')
  }

  const context = await requireBusinessRole(userId, service.businessId, roles)

  return {
    service,
    context,
  }
}

export async function requireServiceVariantRole(
  userId: string,
  serviceId: string,
  variantId: string,
  roles: BusinessRole[] = ['ADMIN', 'MANAGER']
) {
  const variant = await prisma.serviceVariant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
      serviceId: true,
      service: {
        select: {
          id: true,
          businessId: true,
        },
      },
    },
  })

  if (!variant || variant.serviceId !== serviceId) {
    throw new BusinessAuthError('Variant not found', 404, 'BUSINESS_NOT_FOUND')
  }

  const context = await requireBusinessRole(userId, variant.service.businessId, roles)

  return {
    variant,
    context,
  }
}
