import { PrismaClient } from '@prisma/client'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { hashPassword } from '../../src/lib/auth/password'

const LOAD_TEST_EMAIL = 'load-test-owner@example.invalid'
const LOAD_TEST_PASSWORD = 'LoadTestOnly234'
const LOAD_TEST_HANDLE = 'load-test-salon'
const LOAD_TEST_USER_AGENT = 'OnPrezCriticalPathLoadTest/1.0'
const LOAD_TEST_LOGIN_IP = '198.51.100.11'

function requireIsolatedDatabase(databaseUrl: string) {
  const hostname = new URL(databaseUrl).hostname
  if (!['localhost', '127.0.0.1', '::1', 'postgres'].includes(hostname)) {
    throw new Error(
      `Refusing to seed a non-local database (${hostname}). P2-020 fixtures are destructive by design.`
    )
  }
}

function futureDate(daysAhead: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + daysAhead)
  return date.toISOString().slice(0, 10)
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required')
  requireIsolatedDatabase(databaseUrl)

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  const outputPath = resolve(process.env.LOAD_TEST_FIXTURE_PATH || 'load-test-fixture.json')

  try {
    await prisma.user.deleteMany({ where: { email: LOAD_TEST_EMAIL } })
    await prisma.rateLimit.deleteMany({
      where: { endpoint: { in: ['handle:check', 'auth:login', 'booking:create'] } },
    })

    const passwordHash = await hashPassword(LOAD_TEST_PASSWORD)
    const user = await prisma.user.create({
      data: {
        email: LOAD_TEST_EMAIL,
        passwordHash,
        emailVerified: true,
        role: 'USER',
      },
    })

    const business = await prisma.business.create({
      data: {
        ownerId: user.id,
        name: 'Load Test Salon',
        slug: LOAD_TEST_HANDLE,
        category: 'SALON',
        description: 'Synthetic P2-020 performance fixture.',
        email: LOAD_TEST_EMAIL,
        timezone: 'Europe/London',
        isPublished: true,
        publishedAt: new Date(),
        settings: {
          advanceBookingDays: 30,
          sameDayBooking: true,
          bufferTime: 0,
          inquiriesEnabled: false,
          notifications: { bookingOwnerEmail: false },
        },
        pages: {
          create: {
            slug: 'home',
            title: 'Load Test Salon',
            isPublished: true,
            content: [],
            publishedContent: [],
            publishedAt: new Date(),
          },
        },
        businessHours: {
          create: Array.from({ length: 7 }, (_, dayOfWeek) => ({
            dayOfWeek,
            openTime: '08:00',
            closeTime: '20:00',
            isClosed: false,
          })),
        },
      },
    })

    const service = await prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Load Test Consultation',
        description: 'Synthetic service used only by the isolated load-test database.',
        price: 25,
        duration: 30,
        bufferTime: 0,
        requiresApproval: false,
        requiresDeposit: false,
        active: true,
        order: 0,
      },
    })

    await prisma.session.create({
      data: {
        userId: user.id,
        token: createHash('sha256').update('load-test-access-token').digest('hex'),
        refreshToken: createHash('sha256').update('load-test-refresh-token').digest('hex'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        userAgent: LOAD_TEST_USER_AGENT,
        ipAddress: LOAD_TEST_LOGIN_IP,
      },
    })

    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(
      outputPath,
      JSON.stringify(
        {
          handle: LOAD_TEST_HANDLE,
          businessId: business.id,
          serviceId: service.id,
          bookingDate: futureDate(7),
          bookingStartTime: '10:00',
          loginEmail: LOAD_TEST_EMAIL,
          loginPassword: LOAD_TEST_PASSWORD,
          loginIp: LOAD_TEST_LOGIN_IP,
          userAgent: LOAD_TEST_USER_AGENT,
        },
        null,
        2
      )
    )

    process.stdout.write(`Wrote isolated P2-020 fixture to ${outputPath}\n`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
