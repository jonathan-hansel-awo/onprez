import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/auth/get-user'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/admin')
  }

  if (!isAdmin(user)) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <Link href="/admin" className="text-lg font-semibold tracking-tight">
              OnPrez Admin
            </Link>
            <nav aria-label="Platform administration" className="flex gap-1 text-sm">
              <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-slate-100">
                Customer setup
              </Link>
              <Link href="/admin/operations" className="rounded-lg px-3 py-2 hover:bg-slate-100">
                Usage &amp; overhead
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">{user.email}</span>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
            >
              My dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
