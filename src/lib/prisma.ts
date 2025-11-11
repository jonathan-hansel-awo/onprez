// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // Production: Use standard Prisma Client (Vercel handles pooling)
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined')
  }

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ['error', 'warn'],
  })
} else {
  // Development: Use standard Prisma Client with connection reuse
  if (!globalForPrisma.prisma) {
    const databaseUrl = process.env.DATABASE_URL || process.env.PREVIEW_DATABASE_URL

    if (!databaseUrl) {
      throw new Error('No database URL configured')
    }

    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
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
