import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BookingIndexClient } from './BookingIndexClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

interface BookingIndexPageProps {
  params: Promise<{
    handle: string
  }>
}

export default async function BookingIndexPage({ params }: BookingIndexPageProps) {
  const { handle } = await params

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
    },
  })

  if (!business || !business.isPublished) {
    notFound()
  }

  // Check if there's only one active service - if so, redirect directly
  const services = await prisma.service.findMany({
    where: {
      businessId: business.id,
      active: true,
    },
    select: { id: true },
    take: 2,
  })

  if (services.length === 1) {
    redirect(`/${handle}/book/${services[0].id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/${handle}`}
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
          <BookingIndexClient
            businessId={business.id}
            businessHandle={business.slug}
            businessName={business.name}
            businessTimezone={business.timezone}
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
