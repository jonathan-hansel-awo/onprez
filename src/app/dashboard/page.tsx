'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  Loader2,
  Plus,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Stats {
  totalBookings: number
  totalRevenue: number
  totalCustomers: number
  pendingBookings: number
  bookingsTrend: number
  revenueTrend: number
}

interface Booking {
  id: string
  startTime: string
  status: string
  service: { name: string }
  customer: { name: string; email: string }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Booking[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const [statsRes, recentRes, upcomingRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-bookings?limit=5'),
        fetch('/api/dashboard/upcoming-appointments?limit=5'),
      ])

      const [statsData, recentData, upcomingData] = await Promise.all([
        statsRes.json(),
        recentRes.json(),
        upcomingRes.json(),
      ])

      if (statsData.success) setStats(statsData.data.stats)
      if (recentData.success) setRecentBookings(recentData.data.bookings)
      if (upcomingData.success) setUpcomingAppointments(upcomingData.data.appointments)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm">
            <Link href="/dashboard/presence">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Presence
            </Link>
          </Button>
          <Button variant="primary" size="sm">
            <Link href="/dashboard/bookings/new">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={Calendar}
          trend={
            stats?.bookingsTrend
              ? {
                  value: stats.bookingsTrend,
                  isPositive: stats.bookingsTrend >= 0,
                  label: 'vs last month',
                }
              : undefined
          }
          loading={loading}
        />
        <StatCard
          title="Revenue"
          value={`£${Number(stats?.totalRevenue || 0).toFixed(2)}`}
          icon={DollarSign}
          trend={
            stats?.revenueTrend
              ? {
                  value: stats.revenueTrend,
                  isPositive: stats.revenueTrend >= 0,
                  label: 'vs last month',
                }
              : undefined
          }
          loading={loading}
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Pending Bookings"
          value={stats?.pendingBookings || 0}
          icon={Clock}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Button variant="ghost" size="sm">
              <Link href="/dashboard/bookings">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming appointments</p>
                <Button variant="primary" size="sm" className="mt-4">
                  <Link href="/dashboard/bookings/new">Create Booking</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{appointment.customer.name}</span>
                      <Badge className={getStatusColor(appointment.status)} size="sm">
                        {appointment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{appointment.service.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(appointment.startTime).toLocaleString('en-GB', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Button variant="ghost" size="sm">
              <Link href="/dashboard/bookings">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{booking.customer.name}</span>
                      <Badge className={getStatusColor(booking.status)} size="sm">
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{booking.service.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(booking.startTime).toLocaleString('en-GB', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="ghost" className="h-24 flex-col">
              <Link href="/dashboard/bookings/new">
                <Plus className="w-6 h-6 mb-2" />
                New Booking
              </Link>
            </Button>
            <Button variant="ghost" className="h-24 flex-col">
              <Link href="/dashboard/customers">
                <Users className="w-6 h-6 mb-2" />
                Customers
              </Link>
            </Button>
            <Button variant="ghost" className="h-24 flex-col">
              <Link href="/dashboard/services">
                <Calendar className="w-6 h-6 mb-2" />
                Services
              </Link>
            </Button>
            <Button variant="ghost" className="h-24 flex-col">
              <Link href="/dashboard/settings">
                <ExternalLink className="w-6 h-6 mb-2" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
