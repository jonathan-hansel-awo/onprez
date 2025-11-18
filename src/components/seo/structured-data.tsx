interface StructuredDataProps {
  business: {
    name: string
    description?: string
    url: string
    logo?: string
    address?: string
    phone?: string
    email?: string
  }
}

export function StructuredData({ business }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    url: business.url,
    image: business.logo,
    telephone: business.phone,
    email: business.email,
    address: business.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: business.address,
        }
      : undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
