import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { businessHandleSchema } from '@/lib/validation/auth'

export class BusinessHandleValidationError extends Error {}
export class BusinessHandleConflictError extends Error {}
export class BusinessHandleNotFoundError extends Error {}

const businessHandleResultSelect = {
  id: true,
  name: true,
  slug: true,
  isPublished: true,
  updatedAt: true,
} satisfies Prisma.BusinessSelect

export async function changeBusinessHandle(input: { businessId: string; nextHandle: string }) {
  const validation = businessHandleSchema.safeParse(input.nextHandle)
  if (!validation.success) {
    throw new BusinessHandleValidationError(validation.error.issues[0]?.message || 'Invalid handle')
  }

  const nextHandle = validation.data

  return prisma.$transaction(
    async tx => {
      const business = await tx.business.findUnique({
        where: { id: input.businessId },
        select: businessHandleResultSelect,
      })

      if (!business) throw new BusinessHandleNotFoundError('Business not found')

      if (business.slug === nextHandle) {
        const previousHandles = await tx.businessHandleRedirect.findMany({
          where: { businessId: business.id },
          orderBy: { createdAt: 'desc' },
          select: { sourceHandle: true, createdAt: true },
        })

        return { business, previousHandles, changed: false, oldHandle: business.slug }
      }

      const [currentHandleConflict, retiredHandleConflict] = await Promise.all([
        tx.business.findUnique({
          where: { slug: nextHandle },
          select: { id: true },
        }),
        tx.businessHandleRedirect.findUnique({
          where: { sourceHandle: nextHandle },
          select: { id: true, businessId: true },
        }),
      ])

      if (currentHandleConflict && currentHandleConflict.id !== business.id) {
        throw new BusinessHandleConflictError('This handle is already taken')
      }

      if (retiredHandleConflict && retiredHandleConflict.businessId !== business.id) {
        throw new BusinessHandleConflictError('This handle is already taken')
      }

      // The owner may return to one of their own previous handles. Remove that
      // alias before making it current, then retire the handle being replaced.
      if (retiredHandleConflict) {
        await tx.businessHandleRedirect.delete({ where: { id: retiredHandleConflict.id } })
      }

      const updatedBusiness = await tx.business.update({
        where: { id: business.id },
        data: { slug: nextHandle },
        select: businessHandleResultSelect,
      })

      await tx.businessHandleRedirect.upsert({
        where: { sourceHandle: business.slug },
        create: { businessId: business.id, sourceHandle: business.slug },
        update: { businessId: business.id },
      })

      const previousHandles = await tx.businessHandleRedirect.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        select: { sourceHandle: true, createdAt: true },
      })

      return {
        business: updatedBusiness,
        previousHandles,
        changed: true,
        oldHandle: business.slug,
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}

export async function getBusinessHandleHistory(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      slug: true,
      handleRedirects: {
        orderBy: { createdAt: 'desc' },
        select: { sourceHandle: true, createdAt: true },
      },
    },
  })

  if (!business) throw new BusinessHandleNotFoundError('Business not found')

  return {
    currentHandle: business.slug,
    previousHandles: business.handleRedirects,
  }
}
