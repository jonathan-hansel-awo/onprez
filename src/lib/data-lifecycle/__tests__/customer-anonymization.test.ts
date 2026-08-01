/** @jest-environment node */

import { anonymizeCustomer } from '../customer-anonymization'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({ prisma: { $transaction: jest.fn() } }))

const mockedTransaction = prisma.$transaction as jest.Mock

describe('customer personal-data anonymisation', () => {
  it('removes PII while retaining the relational booking record', async () => {
    const tx = {
      customer: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'customer-1',
          _count: { appointments: 2 },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      appointment: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      inquiry: {
        findMany: jest.fn().mockResolvedValue([{ id: 'inquiry-1' }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inquiryReply: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      review: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    }
    mockedTransaction.mockImplementation(async callback => callback(tx))

    const result = await anonymizeCustomer('business-1', 'customer-1')

    expect(result).toEqual({ customerId: 'customer-1', retainedAppointmentCount: 2 })
    expect(tx.appointment.updateMany).toHaveBeenCalledWith({
      where: { businessId: 'business-1', customerId: 'customer-1' },
      data: expect.objectContaining({
        customerName: 'Deleted customer',
        customerEmail: 'deleted+customer-1@privacy.onprez.invalid',
        customerPhone: null,
        customerNotes: null,
        bookingIp: null,
      }),
    })
    expect(tx.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_businessId: { id: 'customer-1', businessId: 'business-1' } },
        data: expect.objectContaining({
          email: 'deleted+customer-1@privacy.onprez.invalid',
          phone: null,
          address: null,
          emailOptIn: false,
          smsOptIn: false,
          marketingOptIn: false,
          tags: [],
        }),
      })
    )
    expect(tx.inquiryReply.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { message: expect.stringContaining('data deletion request') },
      })
    )
    expect(tx.review.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: null, comment: null, businessResponse: null, isPublished: false },
      })
    )
  })

  it('does not touch another tenant when the composite customer lookup fails', async () => {
    const tx = {
      customer: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
      appointment: { updateMany: jest.fn() },
      inquiry: { findMany: jest.fn(), updateMany: jest.fn() },
      inquiryReply: { updateMany: jest.fn() },
      review: { updateMany: jest.fn() },
    }
    mockedTransaction.mockImplementation(async callback => callback(tx))

    await expect(anonymizeCustomer('business-1', 'customer-2')).resolves.toBeNull()
    expect(tx.appointment.updateMany).not.toHaveBeenCalled()
    expect(tx.customer.update).not.toHaveBeenCalled()
  })
})
