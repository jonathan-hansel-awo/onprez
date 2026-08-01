jest.mock('@/lib/prisma', () => ({
  prisma: { $transaction: jest.fn(), business: { findUnique: jest.fn() } },
}))

import { prisma } from '@/lib/prisma'
import {
  BusinessHandleConflictError,
  BusinessHandleValidationError,
  changeBusinessHandle,
} from '@/lib/business/handle-changes'

function transactionClient() {
  return {
    business: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    businessHandleRedirect: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
  }
}

const existingBusiness = {
  id: 'business-1',
  name: 'Aurelia Wellness House',
  slug: 'aurelia-wellness',
  isPublished: true,
  updatedAt: new Date('2026-08-02T00:00:00.000Z'),
}

describe('business handle changes', () => {
  beforeEach(() => jest.clearAllMocks())

  it('changes the canonical handle and stores a direct business alias', async () => {
    const tx = transactionClient()
    tx.business.findUnique.mockResolvedValueOnce(existingBusiness).mockResolvedValueOnce(null)
    tx.businessHandleRedirect.findUnique.mockResolvedValue(null)
    tx.business.update.mockResolvedValue({ ...existingBusiness, slug: 'aurelia-cambridge' })
    tx.businessHandleRedirect.findMany.mockResolvedValue([
      { sourceHandle: 'aurelia-wellness', createdAt: new Date('2026-08-02T00:01:00.000Z') },
    ])
    ;(prisma.$transaction as jest.Mock).mockImplementation(async callback => callback(tx))

    const result = await changeBusinessHandle({
      businessId: 'business-1',
      nextHandle: ' Aurelia-Cambridge ',
    })

    expect(result.changed).toBe(true)
    expect(result.business.slug).toBe('aurelia-cambridge')
    expect(tx.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'business-1' },
        data: { slug: 'aurelia-cambridge' },
      })
    )
    expect(tx.businessHandleRedirect.upsert).toHaveBeenCalledWith({
      where: { sourceHandle: 'aurelia-wellness' },
      create: { businessId: 'business-1', sourceHandle: 'aurelia-wellness' },
      update: { businessId: 'business-1' },
    })
  })

  it('rejects a handle retained by another business', async () => {
    const tx = transactionClient()
    tx.business.findUnique.mockResolvedValueOnce(existingBusiness).mockResolvedValueOnce(null)
    tx.businessHandleRedirect.findUnique.mockResolvedValue({
      id: 'redirect-2',
      businessId: 'business-2',
    })
    ;(prisma.$transaction as jest.Mock).mockImplementation(async callback => callback(tx))

    await expect(
      changeBusinessHandle({ businessId: 'business-1', nextHandle: 'reserved-history' })
    ).rejects.toBeInstanceOf(BusinessHandleConflictError)
    expect(tx.business.update).not.toHaveBeenCalled()
  })

  it('lets an owner return to their own prior handle without making a loop', async () => {
    const tx = transactionClient()
    tx.business.findUnique.mockResolvedValueOnce(existingBusiness).mockResolvedValueOnce(null)
    tx.businessHandleRedirect.findUnique.mockResolvedValue({
      id: 'redirect-1',
      businessId: 'business-1',
    })
    tx.business.update.mockResolvedValue({ ...existingBusiness, slug: 'aurelia-original' })
    tx.businessHandleRedirect.findMany.mockResolvedValue([
      { sourceHandle: 'aurelia-wellness', createdAt: new Date('2026-08-02T00:02:00.000Z') },
    ])
    ;(prisma.$transaction as jest.Mock).mockImplementation(async callback => callback(tx))

    await changeBusinessHandle({
      businessId: 'business-1',
      nextHandle: 'aurelia-original',
    })

    expect(tx.businessHandleRedirect.delete).toHaveBeenCalledWith({
      where: { id: 'redirect-1' },
    })
    expect(tx.businessHandleRedirect.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { businessId: 'business-1', sourceHandle: 'aurelia-wellness' },
      })
    )
  })

  it('rejects reserved and malformed handles before opening a transaction', async () => {
    await expect(
      changeBusinessHandle({ businessId: 'business-1', nextHandle: 'dashboard' })
    ).rejects.toBeInstanceOf(BusinessHandleValidationError)
    await expect(
      changeBusinessHandle({ businessId: 'business-1', nextHandle: 'Not Valid!' })
    ).rejects.toBeInstanceOf(BusinessHandleValidationError)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
