/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const { url } = getDatabaseUrls()

  if (!url) {
    throw new Error('Database URL is not defined')
  }

  console.log('Creating Neon pool with URL prefix:', url.substring(0, 30))

  const pool = new Pool({ connectionString: url })
  const adapter = new PrismaNeon(pool as any) // FIX: Type assertion

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

// Graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
