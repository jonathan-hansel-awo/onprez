import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearSignupRateLimits() {
  const deleted = await prisma.rateLimit.deleteMany({
    where: {
      endpoint: 'auth:signup',
    },
  })

  console.log(`✅ Deleted ${deleted.count} signup rate limit records`)
  await prisma.$disconnect()
}

clearSignupRateLimits().catch(console.error)
