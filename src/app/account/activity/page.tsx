'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormError } from '@/components/form'
import { Select } from '@/components/form'
import { Clock, Filter, ChevronDown, ChevronUp, MapPin, Monitor, Calendar } from 'lucide-react'
import { getActivityConfig, getSeverityColor, formatLogDetails } from '@/lib/utils/activity-log'
import { getDeviceDisplayName } from '@/lib/utils/device-parser'

interface SecurityLog {
  id: string
  action: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: any
  ipAddress: string
  userAgent: string
  severity: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  // Filters
  const [actionFilter, setActionFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [daysFilter, setDaysFilter] = useState('90')
  const [availableActions, setAvailableActions] = useState<string[]>([])
  const [availableSeverities, setAvailableSeverities] = useState<string[]>([])

  useEffect(() => {
    fetchLogs(1)
  }, [actionFilter, severityFilter, daysFilter])

  const fetchLogs = async (page: number = 1) => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        days: daysFilter,
      })

      if (actionFilter !== 'all') {
        params.append('action', actionFilter)
      }

      if (severityFilter !== 'all') {
        params.append('severity', severityFilter)
      }

      const response = await fetch(`/api/account/activity?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch activity logs')
      }

      setLogs(data.data.logs)
      setPagination(data.data.pagination)
      setAvailableActions(data.data.filters.actions)
      setAvailableSeverities(data.data.filters.severities)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity logs')
      console.error('Fetch logs error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-600 mt-2">View your account security and activity history</p>
      </div>

      {error && <FormError errors={error} dismissible onDismiss={() => setError('')} />}

      {/* Stats Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-onprez-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{pagination?.total || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Showing</p>
                <p className="text-2xl font-bold text-gray-900">Last {daysFilter} days</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Filter className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select
                value={daysFilter}
                onChange={e => setDaysFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-onprez-blue focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-onprez-blue focus:border-transparent"
              >
                <option value="all">All Actions</option>
                {availableActions.map((action, index) => (
                  <option key={index} value={action}>
                    {getActivityConfig(action).label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-onprez-blue focus:border-transparent"
              >
                <option value="all">All Severities</option>
                {availableSeverities.map((severity, index) => (
                  <option key={index} value={severity}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Found</h3>
            <p className="text-gray-600">No security events match your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log, index) => {
            const config = getActivityConfig(log.action)
            const Icon = config.icon
            const isExpanded = expandedLogs.has(log.id)
            const deviceName = getDeviceDisplayName(log.userAgent)
            const logDetails = formatLogDetails(log.details)

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover={false}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-lg ${config.color} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              {config.label}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(
                                log.severity
                              )}`}
                            >
                              {log.severity}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Quick Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                          <div className="flex items-center gap-1">
                            <Monitor className="w-4 h-4" />
                            <span>{deviceName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{log.ipAddress}</span>
                          </div>
                        </div>

                        {/* Expandable Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Full Date:</span>
                                    <p className="font-medium text-gray-900">
                                      {formatFullDate(log.createdAt)}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">User Agent:</span>
                                    <p className="font-mono text-xs text-gray-900 break-all">
                                      {log.userAgent}
                                    </p>
                                  </div>
                                </div>
                                {logDetails && (
                                  <div className="text-sm">
                                    <span className="text-gray-600">Details:</span>
                                    <p className="font-medium text-gray-900 mt-1">{logDetails}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Expand Button */}
                        <button
                          onClick={() => toggleExpanded(log.id)}
                          className="mt-3 text-sm text-onprez-blue hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show more
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            events
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => {
                  return (
                    p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1
                  )
                })
                .map((p, index, array) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && array[index - 1] !== p - 1 && (
                      <span className="text-gray-400 px-2">...</span>
                    )}
                    <Button
                      variant={p === pagination.page ? 'primary' : 'ghost'}
                      onClick={() => fetchLogs(p)}
                      disabled={loading}
                      size="sm"
                    >
                      {p}
                    </Button>
                  </div>
                ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={!pagination.hasMore || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
