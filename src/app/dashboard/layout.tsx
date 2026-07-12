import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { getCurrentUser } from '@/lib/auth/get-user'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  return <DashboardShell>{children}</DashboardShell>
}
