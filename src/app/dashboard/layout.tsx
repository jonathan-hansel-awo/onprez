import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { validateSession } from '@/lib/auth/session-service'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value?.trim()

  if (!accessToken) {
    redirect('/login?redirect=/dashboard')
  }

  const validation = await validateSession(accessToken)

  if (!validation.valid) {
    redirect('/login?redirect=/dashboard')
  }

  return <DashboardShell>{children}</DashboardShell>
}
