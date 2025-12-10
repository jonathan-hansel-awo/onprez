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

  return (
    <BookingWidget
      businessId={businessId}
      businessHandle={businessHandle}
      businessName={businessName}
      businessTimezone={businessTimezone}
      onComplete={() => router.push(`/${businessHandle}/book/success`)}
      onCancel={() => router.push(`/${businessHandle}`)}
    />
  )
}
