'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  loading?: boolean
}

export function StatCard({ title, value, icon: Icon, trend, trendLabel, loading }: StatCardProps) {
  const isPositive = trend && trend > 0
  const isNegative = trend && trend < 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-2" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            )}
            {trend !== undefined && trendLabel && !loading && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive && <TrendingUp className="w-4 h-4 text-green-600" />}
                {isNegative && <TrendingDown className="w-4 h-4 text-red-600" />}
                <span
                  className={cn(
                    'text-sm font-medium',
                    isPositive && 'text-green-600',
                    isNegative && 'text-red-600',
                    !isPositive && !isNegative && 'text-gray-600'
                  )}
                >
                  {trend > 0 ? '+' : ''}
                  {trend.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-600">{trendLabel}</span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-onprez-blue to-onprez-purple flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
