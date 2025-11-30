import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing database connection...')

  // Test 1: Get user
  const user = await prisma.user.findFirst()
  console.log('✓ User found:', user?.email)

  // Test 2: Get business
  const business = await prisma.business.findFirst({
    where: { ownerId: user?.id },
  })
  console.log('✓ Business found:', business?.name)

  // Test 3: Get services
  const services = await prisma.service.findMany({
    where: { businessId: business?.id },
  })
  console.log('✓ Services found:', services.length)

  console.log('\nDatabase connection is working!')
}

main()
  .catch(e => {
    console.error('❌ Database error:', e)
  })
  .finally(() => prisma.$disconnect())
