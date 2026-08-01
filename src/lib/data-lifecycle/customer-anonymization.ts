import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const REMOVED_TEXT = '[Removed following a verified data deletion request]'

export async function anonymizeCustomer(businessId: string, customerId: string) {
  return prisma.$transaction(async tx => {
    const customer = await tx.customer.findUnique({
      where: { id_businessId: { id: customerId, businessId } },
      select: { id: true, _count: { select: { appointments: true } } },
    })

    if (!customer) return null

    const anonymizedEmail = `deleted+${customer.id}@privacy.onprez.invalid`

    await tx.appointment.updateMany({
      where: { businessId, customerId },
      data: {
        customerName: 'Deleted customer',
        customerEmail: anonymizedEmail,
        customerPhone: null,
        customerNotes: null,
        businessNotes: null,
        bookingIp: null,
        metadata: Prisma.DbNull,
      },
    })

    const inquiryIds = await tx.inquiry.findMany({
      where: { businessId, customerId },
      select: { id: true },
    })

    if (inquiryIds.length > 0) {
      await tx.inquiryReply.updateMany({
        where: { inquiryId: { in: inquiryIds.map(inquiry => inquiry.id) } },
        data: { message: REMOVED_TEXT },
      })
    }

    await tx.inquiry.updateMany({
      where: { businessId, customerId },
      data: {
        customerName: 'Deleted customer',
        customerEmail: anonymizedEmail,
        customerPhone: null,
        subject: 'Removed',
        message: REMOVED_TEXT,
        ipAddress: null,
        userAgent: null,
      },
    })

    await tx.review.updateMany({
      where: { businessId, customerId },
      data: { title: null, comment: null, businessResponse: null, isPublished: false },
    })

    await tx.customer.update({
      where: { id_businessId: { id: customerId, businessId } },
      data: {
        email: anonymizedEmail,
        name: 'Deleted customer',
        firstName: null,
        lastName: null,
        phone: null,
        alternatePhone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        birthday: null,
        gender: null,
        preferredLanguage: null,
        preferences: Prisma.DbNull,
        emailOptIn: false,
        smsOptIn: false,
        marketingOptIn: false,
        tags: [],
        customFields: Prisma.DbNull,
        notes: null,
        privateNotes: null,
        isVip: false,
        isBlocked: false,
        blockReason: null,
        source: null,
        referredBy: null,
        metadata: Prisma.DbNull,
      },
    })

    return { customerId, retainedAppointmentCount: customer._count.appointments }
  })
}
