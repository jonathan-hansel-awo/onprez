'use client'

import { useRouter } from 'next/navigation'
import { BookingWidget } from '@/components/booking'

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
    booking: any,
    confirmation: { id: string; confirmationNumber: string }
  ) => {
    // Redirect to success page with confirmation number
    router.push(`/${businessHandle}/book/success?confirmation=${confirmation.confirmationNumber}`)
  }

  const handleCancel = () => {
    router.push(`/${businessHandle}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <BookingWidget
        businessId={businessId}
        businessHandle={businessHandle}
        businessName={businessName}
        businessTimezone={businessTimezone}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
