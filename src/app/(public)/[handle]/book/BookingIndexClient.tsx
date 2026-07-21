'use client'

import { useRouter } from 'next/navigation'
import { BookingWidget } from '@/components/booking'
import type { BookingData } from '@/components/booking/BookingWidget'

interface BookingIndexClientProps {
  businessId: string
  businessHandle: string
  businessName: string
  businessTimezone: string
}

export function BookingIndexClient({
  businessId,
  businessHandle,
  businessName,
  businessTimezone,
}: BookingIndexClientProps) {
  const router = useRouter()

  const handleComplete = (
    _booking: BookingData,
    confirmation: { id: string; confirmationNumber: string }
  ) => {
    // Redirect to success page with confirmation number
    router.push(`/${businessHandle}/book/success?confirmation=${confirmation.confirmationNumber}`)
  }

  const handleCancel = () => {
    router.push(`/${businessHandle}`)
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-gray-50 px-3 py-4 sm:px-4 sm:py-8">
      <BookingWidget
        businessId={businessId}
        businessHandle={businessHandle}
        businessName={businessName}
        businessTimezone={businessTimezone}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </main>
  )
}
