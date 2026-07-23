import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AdminBusinessWorkspace } from '@/components/admin/AdminBusinessWorkspace'

export const dynamic = 'force-dynamic'

type AdminBusinessPageProps = {
  params: Promise<{ businessId: string }>
}

export default async function AdminBusinessPage({ params }: AdminBusinessPageProps) {
  const { businessId } = await params

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      tagline: true,
      description: true,
      email: true,
      phone: true,
      website: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      logoUrl: true,
      coverImageUrl: true,
      isPublished: true,
      isActive: true,
      owner: { select: { email: true } },
      pages: {
        where: { slug: 'home' },
        take: 1,
        select: { isPublished: true, updatedAt: true },
      },
      services: {
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          duration: true,
          imageUrl: true,
          active: true,
          featured: true,
          order: true,
          _count: { select: { appointments: true } },
        },
      },
    },
  })

  if (!business) {
    notFound()
  }

  const page = business.pages[0]

  return (
    <AdminBusinessWorkspace
      initialBusiness={{
        id: business.id,
        name: business.name,
        slug: business.slug,
        category: business.category,
        tagline: business.tagline,
        description: business.description,
        email: business.email,
        phone: business.phone,
        website: business.website,
        address: business.address,
        city: business.city,
        state: business.state,
        zipCode: business.zipCode,
        country: business.country,
        logoUrl: business.logoUrl,
        coverImageUrl: business.coverImageUrl,
        isPublished: business.isPublished,
        isActive: business.isActive,
        ownerEmail: business.owner.email,
      }}
      pageStatus={{
        exists: Boolean(page),
        isPublished: page?.isPublished ?? false,
        updatedAt: page?.updatedAt.toISOString() ?? null,
      }}
      initialServices={business.services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: Number(service.price),
        duration: service.duration,
        imageUrl: service.imageUrl,
        active: service.active,
        featured: service.featured,
        order: service.order,
        appointmentCount: service._count.appointments,
      }))}
    />
  )
}
