/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Eye, TrendingUp, Plus, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Bookings" value="24" change="+12%" icon={Calendar} trend="up" />
        <StatCard title="Total Customers" value="156" change="+8%" icon={Users} trend="up" />
        <StatCard title="Profile Views" value="1,234" change="+23%" icon={Eye} trend="up" />
        <StatCard
          title="Conversion Rate"
          value="18.5%"
          change="+2.3%"
          icon={TrendingUp}
          trend="up"
        />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/bookings/new">
              <Button variant="primary" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </Link>
            <Link href="/dashboard/services/new">
              <Button variant="secondary" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </Link>
            <Link href="/dashboard/presence">
              <Button variant="ghost" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Edit Presence
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Bookings</CardTitle>
              <Link href="/dashboard/bookings" className="text-sm text-onprez-blue hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">Hair Cut & Styling</p>
                    <p className="text-sm text-gray-600">John Doe • Today at 2:00 PM</p>
                  </div>
                  <Badge variant="success">Confirmed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Inquiries</CardTitle>
              <Link
                href="/dashboard/inquiries"
                className="text-sm text-onprez-blue hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">Price inquiry</p>
                    <p className="text-sm text-gray-600">Jane Smith • 2 hours ago</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string
  value: string
  change: string
  icon: any
  trend: 'up' | 'down'
}) {
  return (
    <Card hover={false}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className={`text-sm mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last month
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-onprez-blue to-onprez-purple rounded-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
