import { prisma } from '@/lib/prisma'
import { PriceType } from '@prisma/client'

async function testServiceData() {
  console.log('🧪 Testing Service model...\n')

  try {
    // Test PriceType enum
    console.log('💰 Price Types:')
    Object.values(PriceType).forEach(type => {
      console.log(`   - ${type}`)
    })

    console.log('\n✅ Service model test complete!')
  } catch (error) {
    console.error('❌ Service test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testServiceData()
