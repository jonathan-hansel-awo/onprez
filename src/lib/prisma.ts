// lib/prisma.ts

import { PrismaClient } from '@prisma/client'
import { Pool, PoolConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { getDatabaseUrls } from './db-config'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // Production: Use Neon serverless adapter
  const { url } = getDatabaseUrls()
  const pool = new Pool({ connectionString: url })
  const adapter = new PrismaNeon(pool as unknown as PoolConfig)

  prisma = new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })
} else {
  // Development: Use standard Prisma Client with connection reuse
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

// Graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
