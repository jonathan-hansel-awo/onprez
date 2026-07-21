'use client'

import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Calendar, Clock, DollarSign, RefreshCw, Users } from 'lucide-react'
import { GuidedEmptyState } from '@/components/dashboard/guided-empty-state'
import { StatCard } from '@/components/dashboard/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AnalyticsStats {
  totalBookings: number
  totalRevenue: number
  totalCustomers: number
  pendingBookings: number
  bookingsTrend: number
  revenueTrend: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || 'Failed to load analytics')
      setStats(result.data.stats)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const hasActivity = Boolean(
    stats && (stats.totalBookings > 0 || stats.totalCustomers > 0 || stats.totalRevenue > 0)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-gray-600">
          Track this month&apos;s bookings, customers, and revenue.
        </p>
      </div>

      {!loading && error && (
        <Card className="border-red-200 bg-red-50" hover={false}>
          <CardContent className="p-6">
            <p className="font-medium text-red-800">We couldn&apos;t load your analytics.</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={fetchAnalytics}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && !hasActivity && (
        <GuidedEmptyState
          icon={BarChart3}
          title="Your insights begin with your first booking"
          description="There is no activity to analyse yet. Publish and share your presence page, and this space will turn bookings into useful business insights."
          action={{ label: 'Open your presence', href: '/dashboard/presence' }}
          secondaryAction={{ label: 'Check your services', href: '/dashboard/services' }}
        />
      )}

      {(loading || (!error && hasActivity)) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Bookings this month"
            value={stats?.totalBookings || 0}
            icon={Calendar}
            loading={loading}
          />
          <StatCard
            title="Revenue this month"
            value={`£${Number(stats?.totalRevenue || 0).toFixed(2)}`}
            icon={DollarSign}
            loading={loading}
          />
          <StatCard
            title="Total customers"
            value={stats?.totalCustomers || 0}
            icon={Users}
            loading={loading}
          />
          <StatCard
            title="Pending bookings"
            value={stats?.pendingBookings || 0}
            icon={Clock}
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}
