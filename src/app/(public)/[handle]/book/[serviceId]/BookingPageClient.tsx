'use client'

import { useRouter } from 'next/navigation'
import { BookingWidget } from '@/components/booking'
import type { BookingData } from '@/components/booking/BookingWidget'
import { saveBookingConfirmationEmail } from '@/lib/booking/public-booking'

interface BookingPageClientProps {
  business: {
    id: string
    name: string
    handle: string
    timezone: string
    logoUrl: string | null
  }
  service: {
    id: string
    name: string
    description: string | null
    price: number
    duration: number
    requiresDeposit: boolean
    depositAmount: number | null
    remainingAmount: number
    cancellationWindowHours: number | null
    deductFromTotal: boolean
  }
}

export function BookingPageClient({ business, service }: BookingPageClientProps) {
  const router = useRouter()

  const handleComplete = (
    booking: BookingData,
    confirmation: { id: string; confirmationNumber: string }
  ) => {
    saveBookingConfirmationEmail(confirmation.confirmationNumber, booking.customerEmail)
    router.push(`/${business.handle}/book/success?confirmation=${confirmation.confirmationNumber}`)
  }

  const handleCancel = () => {
    router.push(`/${business.handle}`)
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-gray-50 px-3 py-4 sm:px-4 sm:py-8">
      <BookingWidget
        businessId={business.id}
        businessHandle={business.handle}
        businessName={business.name}
        businessTimezone={business.timezone}
        preselectedServiceId={service.id}
        preselectedService={service}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </main>
  )
}
