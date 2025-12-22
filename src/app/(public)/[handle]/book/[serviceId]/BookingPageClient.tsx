'use client'

import { useRouter } from 'next/navigation'
import { BookingWidget } from '@/components/booking'

interface BookingPageClientProps {
  businessId: string
  businessHandle: string
  businessName: string
  businessTimezone: string
  serviceId: string
}

export function BookingPageClient({
  businessId,
  businessHandle,
  businessName,
  businessTimezone,
  serviceId,
}: BookingPageClientProps) {
  const router = useRouter()

  const handleComplete = (
    booking: any,
    confirmation: { id: string; confirmationNumber: string }
  ) => {
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
        preselectedServiceId={serviceId}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
