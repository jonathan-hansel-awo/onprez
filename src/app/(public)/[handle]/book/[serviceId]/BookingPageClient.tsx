'use client'

import { useRouter } from 'next/navigation'
import { BookingWidget } from '@/components/booking'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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

  const handleComplete = () => {
    // Will redirect to success page in Milestone 8.8
    router.push(`/${business.handle}/book/success`)
  }

  const handleCancel = () => {
    router.push(`/${business.handle}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/${business.handle}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to {business.name}</span>
              <span className="sm:hidden">Back</span>
            </Link>

            {business.logoUrl && (
              <Image
                src={business.logoUrl}
                alt={business.name}
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Service Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">You're booking</p>
                <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
                {service.description && (
                  <p className="text-gray-600 mt-2 text-sm">{service.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">£{service.price.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{service.duration} minutes</p>
              </div>
            </div>
          </div>

          {/* Booking Widget */}
          <BookingWidget
            businessId={business.id}
            businessHandle={business.handle}
            businessName={business.name}
            businessTimezone={business.timezone}
            initialServiceId={service.id}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-sm text-gray-500">
          Powered by{' '}
          <Link href="/" className="text-blue-600 hover:underline">
            OnPrez
          </Link>
        </p>
      </footer>
    </div>
  )
}
