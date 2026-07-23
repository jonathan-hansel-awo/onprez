import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type AdminPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { q: rawQuery } = await searchParams
  const query = rawQuery?.trim() || ''

  const businesses = await prisma.business.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
            { owner: { email: { contains: query, mode: 'insensitive' } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      isPublished: true,
      isActive: true,
      updatedAt: true,
      owner: { select: { email: true, emailVerified: true } },
      pages: {
        where: { slug: 'home' },
        take: 1,
        select: { isPublished: true, updatedAt: true },
      },
      _count: { select: { services: true, appointments: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Platform administration</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Customer setup workspace</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Find a customer business, complete its profile, build the presence page, and add services without impersonating the owner.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {businesses.length} result{businesses.length === 1 ? '' : 's'}
        </div>
      </div>

      <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search business, handle, or owner email"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-blue-500 focus:ring-2"
        />
        <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
          Search
        </button>
        {query ? (
          <Link href="/admin" className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-medium hover:bg-slate-50">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Setup</th>
                <th className="px-5 py-3">Activity</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businesses.map(business => {
                const pagePublished = business.pages[0]?.isPublished ?? false
                return (
                  <tr key={business.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-950">{business.name}</div>
                      <div className="mt-1 text-xs text-slate-500">onprez.com/{business.slug} · {business.category}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div>{business.owner.email}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {business.owner.emailVerified ? 'Email verified' : 'Email unverified'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pagePublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {pagePublished ? 'Published' : 'Draft'}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${business.isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                          {business.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div>{business._count.services} services</div>
                      <div className="mt-1 text-xs">{business._count.appointments} appointments</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/businesses/${business.id}`}
                        className="inline-flex rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Open setup
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {businesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    No businesses matched your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
