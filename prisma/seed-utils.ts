import { PrismaClient, BusinessCategory, PriceType, AppointmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Hash password for seed users
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Clean all data (for fresh seed)
 */
export async function cleanDatabase() {
  console.log('🧹 Cleaning database...')

  // Delete in correct order (respecting foreign keys)
  await prisma.review.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.service.deleteMany()
  await prisma.serviceCategory.deleteMany()
  await prisma.businessHours.deleteMany()
  await prisma.business.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.emailVerificationToken.deleteMany()
  await prisma.mfaBackupCode.deleteMany()
  await prisma.mfaSecret.deleteMany()
  await prisma.authAttempt.deleteMany()
  await prisma.securityLog.deleteMany()
  await prisma.session.deleteMany()
  await prisma.rateLimit.deleteMany()
  await prisma.rateLimitConfig.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Database cleaned')
}

/**
 * Create default business hours (Mon-Fri 9-5, Sat 10-3, Sun closed)
 */
export async function createDefaultBusinessHours(businessId: string) {
  const hours = [
    { dayOfWeek: 0, isClosed: true, openTime: '09:00', closeTime: '17:00' }, // Sunday
    { dayOfWeek: 1, isClosed: false, openTime: '09:00', closeTime: '17:00' }, // Monday
    { dayOfWeek: 2, isClosed: false, openTime: '09:00', closeTime: '17:00' }, // Tuesday
    { dayOfWeek: 3, isClosed: false, openTime: '09:00', closeTime: '17:00' }, // Wednesday
    { dayOfWeek: 4, isClosed: false, openTime: '09:00', closeTime: '17:00' }, // Thursday
    { dayOfWeek: 5, isClosed: false, openTime: '09:00', closeTime: '17:00' }, // Friday
    { dayOfWeek: 6, isClosed: false, openTime: '10:00', closeTime: '15:00' }, // Saturday
  ]

  for (const hour of hours) {
    await prisma.businessHours.create({
      data: {
        businessId,
        ...hour,
      },
    })
  }
}

/**
 * Generate future date
 */
export function getFutureDate(daysFromNow: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(14, 0, 0, 0) // 2 PM
  return date
}

/**
 * Generate past date
 */
export function getPastDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(14, 0, 0, 0) // 2 PM
  return date
}

/**
 * Random element from array
 */
export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Random number between min and max
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export { prisma }
