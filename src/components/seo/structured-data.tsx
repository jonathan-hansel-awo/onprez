import { serializeJsonLd } from '@/lib/seo/presence-structured-data'

interface StructuredDataProps {
  data: unknown
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
