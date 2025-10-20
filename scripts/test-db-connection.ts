import { prisma } from '../lib/prisma'
import { getCurrentDatabaseEnv } from '../lib/db-config'

async function testConnection() {
  console.log('🔍 Testing database connection...')
  console.log(`📊 Environment: ${getCurrentDatabaseEnv()}`)

  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!')

    // Get database info
    const result = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version()
    `
    console.log('📦 PostgreSQL version:', result[0].version)

    // Disconnect
    await prisma.$disconnect()
    console.log('👋 Connection closed')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

testConnection()
