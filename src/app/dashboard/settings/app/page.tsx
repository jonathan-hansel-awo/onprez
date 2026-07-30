import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, WifiOff } from 'lucide-react'
import { InstallOnPrezCard } from '@/components/pwa/install-onprez-card'
import { BookingAlertsCard } from '@/components/pwa/booking-alerts-card'
import { PushDiagnosticsCard } from '@/components/pwa/push-diagnostics-card'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'OnPrez App and Booking Alerts',
  description: 'Install the OnPrez dashboard and manage booking push notifications.',
}

export default function AppSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/settings"
          className="mb-4 inline-flex min-h-10 items-center text-sm font-medium text-gray-600 transition-colors hover:text-onprez-blue"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to settings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">OnPrez app</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Install your dashboard for quicker access and enable optional booking alerts on your
          devices.
        </p>
      </div>

      <InstallOnPrezCard />

      <BookingAlertsCard />

      <PushDiagnosticsCard />

      <div className="grid gap-5 md:grid-cols-2">
        <Card hover={false}>
          <CardContent className="p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-semibold text-gray-950">Your private data stays online</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              OnPrez does not save bookings, customers, or private dashboard pages for offline use.
              Signing out continues to protect the same live account data.
            </p>
          </CardContent>
        </Card>

        <Card hover={false}>
          <CardContent className="p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <WifiOff className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-semibold text-gray-950">Internet connection required</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Current availability and booking information always come from OnPrez. If you are
              offline, the app shows a safe connection screen instead of stale business data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
