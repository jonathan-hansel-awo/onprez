import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AdminPresenceEditor } from '@/components/admin/AdminPresenceEditor'
import type { PageSection } from '@/types/page-sections'

export const dynamic = 'force-dynamic'

type AdminPresencePageProps = {
  params: Promise<{ businessId: string }>
}

export default async function AdminPresencePage({ params }: AdminPresencePageProps) {
  const { businessId } = await params

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      slug: true,
      pages: {
        where: { slug: 'home' },
        take: 1,
        select: {
          id: true,
          content: true,
          isPublished: true,
        },
      },
    },
  })

  const page = business?.pages[0]

  if (!business || !page) {
    notFound()
  }

  return (
    <AdminPresenceEditor
      businessId={business.id}
      businessName={business.name}
      businessSlug={business.slug}
      pageId={page.id}
      initialSections={(page.content as unknown as PageSection[]) || []}
      initialPublishStatus={page.isPublished}
    />
  )
}
