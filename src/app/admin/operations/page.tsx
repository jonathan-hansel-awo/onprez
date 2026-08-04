import Link from 'next/link'
import type { UsageWarningLevel } from '@/lib/usage/plan-limits'
import { getPlatformUsageReport } from '@/lib/usage/business-usage'

export const dynamic = 'force-dynamic'

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex
  return `${value.toFixed(unitIndex === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

function formatEstimatedCost(value: number | null) {
  if (value === null) return 'Unavailable'
  if (value === 0) return '£0.00'
  if (value < 0.01) return `£${value.toFixed(4)}`
  return `£${value.toFixed(2)}`
}

function warningStyle(level: UsageWarningLevel) {
  return {
    normal: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-900',
    critical: 'bg-orange-100 text-orange-900',
    exceeded: 'bg-red-100 text-red-800',
  }[level]
}

function usageWithAllowance(used: number, allowance: number | null) {
  return allowance === null ? `${used} / fair use` : `${used} / ${allowance}`
}

export default async function PlatformOperationsPage() {
  const report = await getPlatformUsageReport()
  const cards = [
    ['Active businesses', `${report.totals.activeBusinesses} / ${report.totals.businesses}`],
    ['Published pages', String(report.totals.publishedPages)],
    ['Bookings this month', String(report.totals.monthlyBookings)],
    ['Emails sent this month', String(report.totals.monthlyEmailSends)],
    ['Tracked media', `${report.totals.mediaItems} · ${formatBytes(report.totals.mediaBytes)}`],
    ['Estimated allocation', formatEstimatedCost(report.totals.estimatedCostGbp)],
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Platform operations</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Usage and overhead</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Canonical account usage before plan enforcement. Monthly counters use UTC and provider
            costs are labelled planning estimates, never invoices.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Customer setup
        </Link>
      </div>

      <section aria-labelledby="platform-summary-heading">
        <h2 id="platform-summary-heading" className="sr-only">
          Platform summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <h2 className="font-semibold">Measurement coverage</h2>
        <p className="mt-2">{report.coverage.note}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Media: stored assets recorded by OnPrez; historical uploads require backfill.</li>
          <li>Email: successful tracked sends during the current UTC month.</li>
          <li>CDN delivery and transformations: unavailable, not zero.</li>
        </ul>
      </div>

      <section className="space-y-3" aria-labelledby="account-usage-heading">
        <div>
          <h2 id="account-usage-heading" className="text-xl font-semibold">
            Account usage
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Warning at 70%, critical at 95%, and exceeded at 100% of a measured plan allowance.
            Limits remain observational in P3-002.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Pages / services</th>
                  <th className="px-4 py-3">Bookings / emails</th>
                  <th className="px-4 py-3">Media / team</th>
                  <th className="px-4 py-3">Threshold</th>
                  <th className="px-4 py-3 text-right">Est. allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.businesses.map(business => (
                  <tr key={business.businessId} className="align-top">
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/businesses/${business.businessId}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {business.name}
                      </Link>
                      <div className="mt-1 text-xs text-slate-500">/{business.slug}</div>
                    </td>
                    <td className="px-4 py-4 font-medium capitalize">
                      {business.planTier.toLowerCase()}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <div>
                        Pages:{' '}
                        {usageWithAllowance(
                          business.usage.publishedPages,
                          business.allowances.publishedPages
                        )}
                      </div>
                      <div className="mt-1">
                        Services:{' '}
                        {usageWithAllowance(
                          business.usage.activeServices,
                          business.allowances.activeServices
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <div>
                        Bookings:{' '}
                        {usageWithAllowance(
                          business.usage.monthlyBookings,
                          business.allowances.monthlyBookings
                        )}
                      </div>
                      <div className="mt-1">Emails: {business.usage.monthlyEmailSends}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <div>
                        Media:{' '}
                        {usageWithAllowance(
                          business.usage.mediaItems,
                          business.allowances.mediaItems
                        )}{' '}
                        · {formatBytes(business.usage.mediaBytes)}
                      </div>
                      <div className="mt-1">Team seats: {business.usage.teamMembers}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${warningStyle(business.highestWarning)}`}
                      >
                        {business.highestWarning}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      {formatEstimatedCost(business.estimatedCosts.totalGbp)}
                      <div className="mt-1 text-xs font-normal capitalize text-slate-500">
                        {business.estimatedCosts.status}
                      </div>
                    </td>
                  </tr>
                ))}
                {report.businesses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      No business usage is available yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Planning rates</h2>
        <p className="mt-1 text-sm text-slate-600">
          Server-side rates used for reproducible allocation estimates. Update the stored rate when
          provider pricing or the planning model changes.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {report.rates.map(rate => (
            <div
              key={`${rate.provider}:${rate.metric}:${rate.effectiveFrom}`}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="font-medium">
                {rate.provider} · {rate.metric}
              </div>
              <div className="mt-1 text-sm text-slate-700">
                {rate.currency} {rate.rate} per {rate.unit}
              </div>
              <div className="mt-2 text-xs text-slate-500">{rate.source}</div>
            </div>
          ))}
          {report.rates.length === 0 ? (
            <p className="text-sm text-slate-600">
              No active cost rates are configured. Usage remains available; estimates are labelled
              unavailable.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
