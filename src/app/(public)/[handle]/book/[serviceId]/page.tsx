import { FeatureKey, StripeConnectedAccountStatus } from '@prisma/client'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BookingPageClient } from './BookingPageClient'
import { Metadata } from 'next'
import {
  readBookingProtectionDefaults,
  resolveEffectiveServiceDeposit,
} from '@/lib/booking-protection/config'
import { isFeatureEntitlementActive } from '@/lib/features/entitlements'

interface BookingPageProps {
  params: Promise<{
    handle: string
    serviceId: string
  }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { handle, serviceId } = await params

  // Fetch business
  const business = await prisma.business.findUnique({
    where: { slug: handle },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      isPublished: true,
      logoUrl: true,
      branding: true,
      settings: true,
      featureEntitlements: {
        where: { feature: FeatureKey.BOOKING_DEPOSITS },
        take: 1,
      },
      stripeConnectedAccount: {
        select: { status: true, chargesEnabled: true, payoutsEnabled: true },
      },
    },
  })

  if (!business || !business.isPublished) {
    notFound()
  }

  // Fetch service
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      businessId: business.id,
      active: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      duration: true,
      bufferTime: true,
      imageUrl: true,
      depositMode: true,
      depositAmount: true,
    },
  })

  if (!service) {
    notFound()
  }

  const stripeReady = Boolean(
    business.stripeConnectedAccount?.status === StripeConnectedAccountStatus.READY &&
    business.stripeConnectedAccount.chargesEnabled &&
    business.stripeConnectedAccount.payoutsEnabled
  )
  const effectiveDeposit = resolveEffectiveServiceDeposit({
    mode: service.depositMode,
    customDepositAmount: service.depositAmount === null ? null : Number(service.depositAmount),
    servicePrice: Number(service.price),
    defaults: readBookingProtectionDefaults(business.settings),
    entitled: isFeatureEntitlementActive(business.featureEntitlements[0]),
    stripeReady,
  })

  return (
    <BookingPageClient
      business={{
        id: business.id,
        name: business.name,
        handle: business.slug,
        timezone: business.timezone,
        logoUrl: business.logoUrl,
      }}
      service={{
        id: service.id,
        name: service.name,
        description: service.description,
        price: Number(service.price),
        duration: service.duration,
        requiresDeposit: effectiveDeposit.requiresDeposit,
        depositAmount: effectiveDeposit.depositAmount,
        remainingAmount: effectiveDeposit.remainingAmount,
        cancellationWindowHours: effectiveDeposit.cancellationWindowHours,
        deductFromTotal: effectiveDeposit.deductFromTotal,
      }}
    />
  )
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { handle, serviceId } = await params

  const business = await prisma.business.findUnique({
    where: { slug: handle },
    select: { name: true },
  })

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { name: true },
  })

  if (!business || !service) {
    return {
      title: 'Book Appointment - OnPrez',
    }
  }

  return {
    title: `Book ${service.name} - ${business.name} | OnPrez`,
    description: `Book a ${service.name} appointment with ${business.name} online. Easy booking, instant confirmation.`,
    robots: {
      index: false, // Don't index booking pages
      follow: true,
    },
  }
}
