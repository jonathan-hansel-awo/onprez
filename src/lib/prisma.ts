// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { getDatabaseUrls } from './db-config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // Production: Use Neon serverless adapter
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV)
  console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL)
  console.log('🔍 DATABASE_URL prefix:', process.env.DATABASE_URL?.substring(0, 30))

  const { url } = getDatabaseUrls()

  console.log('🔍 getDatabaseUrls returned url:', url?.substring(0, 30))

  if (!url) {
    throw new Error('Database URL is not defined after getDatabaseUrls()')
  }

  const pool = new Pool({ connectionString: url })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeon(pool as any)

  prisma = new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })
} else {
  // Development: Use standard Prisma Client
  if (!globalForPrisma.prisma) {
    const { url } = getDatabaseUrls()

    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
      log: ['query', 'error', 'warn'],
    })
  }

  prisma = globalForPrisma.prisma
}

export { prisma }

if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
