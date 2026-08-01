import { prisma } from '@/lib/prisma'

export const DATA_EXPORT_VERSION = '2026-08-01'

export async function buildAccountExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      accountLocked: true,
      lastLoginAt: true,
      mfaEnabled: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      businesses: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      businessMemberships: {
        select: {
          role: true,
          joinedAt: true,
          business: { select: { id: true, name: true, slug: true } },
        },
      },
      pushNotificationPreference: {
        select: {
          newBookingEnabled: true,
          cancellationEnabled: true,
          rescheduleEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      pushSubscriptions: {
        select: {
          id: true,
          deviceName: true,
          expiresAt: true,
          lastSeenAt: true,
          failureCount: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      sessions: {
        select: {
          id: true,
          deviceInfo: true,
          ipAddress: true,
          userAgent: true,
          expiresAt: true,
          lastActivityAt: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      trustedDevices: {
        select: {
          id: true,
          deviceName: true,
          ipAddress: true,
          userAgent: true,
          lastUsedAt: true,
          revokedAt: true,
          createdAt: true,
        },
      },
      authAttempts: {
        select: {
          success: true,
          ipAddress: true,
          userAgent: true,
          attemptType: true,
          failureReason: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      securityLogs: {
        select: {
          action: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          severity: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      dataLifecycleRequestsAbout: {
        select: {
          id: true,
          type: true,
          status: true,
          verificationMethod: true,
          scheduledFor: true,
          holdReason: true,
          requestedAt: true,
          cancelledAt: true,
          completedAt: true,
          updatedAt: true,
        },
        orderBy: { requestedAt: 'desc' },
      },
    },
  })

  if (!user) throw new Error('User not found')

  return {
    export: {
      product: 'OnPrez',
      scope: 'account',
      version: DATA_EXPORT_VERSION,
      generatedAt: new Date().toISOString(),
      excludedSecrets: [
        'password hashes',
        'session and refresh tokens',
        'MFA secrets and backup-code hashes',
        'push authentication keys',
      ],
    },
    account: user,
  }
}

export async function buildBusinessExport(businessId: string) {
  const [
    business,
    teamMembers,
    teamInvitations,
    hours,
    specialDates,
    categories,
    services,
    pages,
    faqs,
    customers,
    appointments,
    appointmentTransitions,
    inquiries,
    reviews,
    bookingPayments,
  ] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.businessMember.findMany({
      where: { businessId },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true } },
      },
    }),
    prisma.teamInvitation.findMany({
      where: { businessId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.businessHours.findMany({ where: { businessId }, orderBy: { dayOfWeek: 'asc' } }),
    prisma.specialDate.findMany({ where: { businessId }, orderBy: { date: 'asc' } }),
    prisma.serviceCategory.findMany({ where: { businessId }, orderBy: { order: 'asc' } }),
    prisma.service.findMany({
      where: { businessId },
      include: { variants: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    }),
    prisma.page.findMany({ where: { businessId }, orderBy: { order: 'asc' } }),
    prisma.fAQ.findMany({ where: { businessId }, orderBy: { order: 'asc' } }),
    prisma.customer.findMany({ where: { businessId }, orderBy: { createdAt: 'asc' } }),
    prisma.appointment.findMany({ where: { businessId }, orderBy: { createdAt: 'asc' } }),
    prisma.appointmentStatusTransition.findMany({
      where: { businessId },
      orderBy: { changedAt: 'asc' },
    }),
    prisma.inquiry.findMany({
      where: { businessId },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.review.findMany({ where: { businessId }, orderBy: { createdAt: 'asc' } }),
    prisma.bookingPayment.findMany({ where: { businessId }, orderBy: { createdAt: 'asc' } }),
  ])

  if (!business) throw new Error('Business not found')

  return {
    export: {
      product: 'OnPrez',
      scope: 'business',
      version: DATA_EXPORT_VERSION,
      generatedAt: new Date().toISOString(),
      businessId,
      excludedSecrets: ['invitation tokens', 'provider credentials', 'authentication secrets'],
    },
    business,
    teamMembers,
    teamInvitations,
    hours,
    specialDates,
    categories,
    services,
    pages,
    faqs,
    customers,
    appointments,
    appointmentTransitions,
    inquiries,
    reviews,
    bookingPayments,
  }
}

export function dataExportResponse(payload: unknown, filename: string) {
  const body = JSON.stringify(
    payload,
    (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
    2
  )

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      Pragma: 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
