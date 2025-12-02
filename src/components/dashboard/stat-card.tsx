'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  iconBackground?: string
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  loading?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-white',
  iconBackground = 'bg-gradient-to-br from-onprez-blue to-onprez-purple',
  trend,
  loading,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-2" />
            ) : (
              <p className="text-3xl font-bold mt-2">{value}</p>
            )}
            {trend && !loading && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? '+' : ''}
                  {Math.abs(trend.value)}%
                </span>
                {trend.label && (
                  <span className="text-sm text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn('w-12 h-12 rounded-lg flex items-center justify-center', iconBackground)}
          >
            <Icon className={cn('w-6 h-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
