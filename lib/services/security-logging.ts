/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from 'lib/prisma'

export interface SecurityLogEntry {
  userId?: string
  action: string
  details?: Record<string, any>
  ipAddress: string
  userAgent?: string
  severity: 'info' | 'warning' | 'error' | 'critical'
}

/**
 * Log a security event
 */
export async function logSecurityEvent(entry: SecurityLogEntry): Promise<void> {
  await prisma.securityLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      details: entry.details,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      severity: entry.severity,
    },
  })
}

/**
 * Get security logs for a user
 */
export async function getUserSecurityLogs(userId: string, limit: number = 50): Promise<any[]> {
  return prisma.securityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Get recent security logs by action
 */
export async function getSecurityLogsByAction(action: string, limit: number = 100): Promise<any[]> {
  return prisma.securityLog.findMany({
    where: { action },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Get critical security events
 */
export async function getCriticalSecurityEvents(limit: number = 50): Promise<any[]> {
  return prisma.securityLog.findMany({
    where: { severity: 'critical' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Clean up old security logs
 */
export async function cleanupOldSecurityLogs(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = await prisma.securityLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
      severity: {
        not: 'critical', // Keep critical logs longer
      },
    },
  })

  return result.count
}
