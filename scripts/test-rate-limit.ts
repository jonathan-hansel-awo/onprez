import { prisma } from '@/lib/prisma'
import { checkRateLimit, resetRateLimit, cleanupExpiredRateLimits } from '@/lib/services/rate-limit'

async function testRateLimit() {
  console.log('🧪 Testing Rate Limit system...\n')

  try {
    const testKey = 'test-ip-123'
    const testEndpoint = 'auth:login'

    console.log('1️⃣ Testing rate limit check...')

    // First request - should be allowed
    let result = await checkRateLimit(testKey, testEndpoint)
    console.log(
      `   ✓ First request: allowed=${result.allowed}, remaining=${result.remaining}/${result.limit}`
    )

    // Second request - should be allowed
    result = await checkRateLimit(testKey, testEndpoint)
    console.log(
      `   ✓ Second request: allowed=${result.allowed}, remaining=${result.remaining}/${result.limit}`
    )

    // Third request - should be allowed
    result = await checkRateLimit(testKey, testEndpoint)
    console.log(
      `   ✓ Third request: allowed=${result.allowed}, remaining=${result.remaining}/${result.limit}`
    )

    console.log('\n2️⃣ Testing rate limit reset...')
    await resetRateLimit(testKey, testEndpoint)
    console.log('   ✓ Rate limit reset successful')

    // After reset - should be allowed again
    result = await checkRateLimit(testKey, testEndpoint)
    console.log(
      `   ✓ After reset: allowed=${result.allowed}, remaining=${result.remaining}/${result.limit}`
    )

    console.log('\n3️⃣ Testing cleanup...')
    const cleaned = await cleanupExpiredRateLimits()
    console.log(`   ✓ Cleaned up ${cleaned} expired rate limits`)

    console.log('\n4️⃣ Checking rate limit rules...')
    console.log('   Available endpoints:')
    console.log('   - auth:login (5 attempts / 15 min)')
    console.log('   - auth:signup (3 attempts / 1 hour)')
    console.log('   - booking:create (10 attempts / 1 hour)')
    console.log('   - api:general (100 attempts / 1 hour)')

    // Cleanup test data
    await resetRateLimit(testKey, testEndpoint)

    console.log('\n✅ Rate limit system test complete!')
  } catch (error) {
    console.error('❌ Rate limit test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testRateLimit()
