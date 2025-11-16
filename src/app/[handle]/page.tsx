/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SectionRenderer } from '@/components/presence/sections/SectionRenderer'
import { PageSection } from '@/types/page-sections'

interface PresencePageProps {
  params: Promise<{
    handle: string
  }>
}

export default async function PresencePage({ params }: PresencePageProps) {
  const { handle } = await params  // Add await here

  // Fetch business
  const business = await prisma.business.findUnique({
    where: { slug: handle },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      zipCode: true,
      socialLinks: true,
      settings: true,
      isPublished: true,
    },
  })

  if (!business || !business.isPublished) {
    notFound()
  }

  // Fetch published page
  const page = await prisma.page.findFirst({
    where: {
      businessId: business.id,
      slug: 'home',
      isPublished: true,
    },
  })

  if (!page) {
    notFound()
  }

  const sections = page.content as unknown as PageSection[]
  const settings = business.settings as any
  const showInquiryForm = settings?.inquiriesEnabled !== false

  const fullAddress = [business.address, business.city, business.zipCode].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen">
      <SectionRenderer
        sections={sections}
        businessHandle={handle}
        businessId={business.id}
        businessName={business.name}
        businessData={{
          phone: business.phone || undefined,
          email: business.email || undefined,
          address: fullAddress || undefined,
          socialMedia: business.socialLinks as any,
        }}
        showInquiryForm={showInquiryForm}
      />
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PresencePageProps) {
  const { handle } = await params  // Add await here too

  const business = await prisma.business.findUnique({
    where: { slug: handle },
    select: {
      name: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
    },
  })

  if (!business) {
    return {
      title: 'Not Found',
    }
  }

  return {
    title: business.seoTitle || `${business.name} - OnPrez`,
    description: business.seoDescription || business.description || `Visit ${business.name} on OnPrez`,
  }
}
