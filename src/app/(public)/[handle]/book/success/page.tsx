import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BookingSuccessClient } from './BookingSuccessClient'

interface PageProps {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ confirmation?: string; payment?: string; session_id?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params

  const business = await prisma.business.findUnique({
    where: { slug: handle },
    select: { name: true },
  })

  return {
    title: business ? `Booking Confirmed - ${business.name}` : 'Booking Confirmed',
    description: 'Your appointment has been successfully booked.',
    robots: { index: false, follow: false },
  }
}

export default async function BookingSuccessPage({ params, searchParams }: PageProps) {
  const { handle } = await params
  const { confirmation, payment, session_id: sessionId } = await searchParams

  // Verify business exists
  const business = await prisma.business.findUnique({
    where: { slug: handle },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      address: true,
      phone: true,
      email: true,
    },
  })

  if (!business) {
    notFound()
  }

  return (
    <BookingSuccessClient
      business={business}
      confirmationNumber={confirmation}
      paymentResult={payment}
      checkoutSessionId={sessionId}
    />
  )
}
