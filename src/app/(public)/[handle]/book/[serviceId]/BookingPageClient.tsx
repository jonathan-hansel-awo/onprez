'use client'

import { useRouter } from 'next/navigation'
import { BookingWidget } from '@/components/booking'

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
  }
}

export function BookingPageClient({ business, service }: BookingPageClientProps) {
  const router = useRouter()

  const handleComplete = (
    booking: any,
    confirmation: { id: string; confirmationNumber: string }
  ) => {
    router.push(`/${business.handle}/book/success?confirmation=${confirmation.confirmationNumber}`)
  }

  const handleCancel = () => {
    router.push(`/${business.handle}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <BookingWidget
        businessId={business.id}
        businessHandle={business.handle}
        businessName={business.name}
        businessTimezone={business.timezone}
        preselectedServiceId={service.id}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
