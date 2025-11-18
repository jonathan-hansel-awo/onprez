/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SectionRenderer } from '@/components/presence/sections/SectionRenderer'
import { PageSection } from '@/types/page-sections'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { Metadata } from 'next'
import { StructuredData } from '@/components/seo/structured-data'

interface PresencePageProps {
  params: Promise<{
    handle: string
  }>
}

export default async function PresencePage({ params }: PresencePageProps) {
  const { handle } = await params

  // Fetch business with all necessary data
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
      state: true,
      zipCode: true,
      country: true,
      website: true,
      socialLinks: true,
      settings: true,
      branding: true,
      isPublished: true,
      logoUrl: true,
      description: true,
    },
  })

  // 404 if business doesn't exist or isn't published
  if (!business || !business.isPublished) {
    notFound()
  }

  // Fetch published page (use publishedContent if available)
  const page = await prisma.page.findFirst({
    where: {
      businessId: business.id,
      slug: 'home',
      isPublished: true,
    },
    select: {
      id: true,
      content: true,
      publishedContent: true,
      isPublished: true,
      publishedAt: true,
      version: true,
    },
  })

  // 404 if no published page found
  if (!page || !page.isPublished) {
    notFound()
  }

  // Use publishedContent if available, otherwise fall back to content
  const sections = (page.publishedContent || page.content) as unknown as PageSection[]

  const settings = business.settings as any
  const theme = settings?.theme || {}
  const showInquiryForm = settings?.inquiriesEnabled !== false

  const fullAddress = [business.address, business.city, business.state, business.zipCode]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <StructuredData
        business={{
          name: business.name,
          description: business.description || undefined,
          url: `https://onprez.vercel.app/${handle}`,
          logo: business.logoUrl || undefined,
          address: fullAddress || undefined,
          phone: business.phone || undefined,
          email: business.email || undefined,
        }}
      />

      <ThemeProvider theme={theme}>
        <div
          className="min-h-screen"
          style={{
            backgroundColor: theme.backgroundColor || '#FFFFFF',
            fontFamily: theme.fontFamily || 'Inter',
          }}
        >
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
      </ThemeProvider>
    </>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PresencePageProps): Promise<Metadata> {
  const { handle } = await params

  const business = await prisma.business.findUnique({
    where: { slug: handle },
    select: {
      name: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      logoUrl: true,
      coverImageUrl: true,
      city: true,
      country: true,
    },
  })

  if (!business) {
    return {
      title: 'Not Found - OnPrez',
      description: 'This page could not be found.',
    }
  }

  const title = business.seoTitle || `${business.name} - OnPrez`
  const description =
    business.seoDescription ||
    business.description ||
    `Visit ${business.name} on OnPrez. Professional services and booking in ${business.city || business.country}.`

  const imageUrl = business.coverImageUrl || business.logoUrl || '/og-default.png'

  return {
    title,
    description,
    keywords: business.seoKeywords || [],
    openGraph: {
      title,
      description,
      url: `https://onprez.vercel.app/${handle}`,
      siteName: 'OnPrez',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: business.name,
        },
      ],
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `https://onprez.vercel.app/${handle}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  }
}

// Optional: Generate static params for popular handles (improves performance)
export async function generateStaticParams() {
  // Fetch published businesses for static generation
  const businesses = await prisma.business.findMany({
    where: {
      isPublished: true,
    },
    select: {
      slug: true,
    },
    take: 100, // Limit to top 100 for build performance
  })

  return businesses.map(business => ({
    handle: business.slug,
  }))
}
