// scripts/test-db-connection.ts

import { prisma } from '../lib/prisma'

async function testConnection() {
  console.log('🔍 Testing database connection...')
  console.log(`📊 Environment: ${process.env.DATABASE_ENV || 'preview'}`)

  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!')

    // Get database info
    const result = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version()
    `
    console.log(
      '📦 PostgreSQL version:',
      result[0].version.split(' ')[0],
      result[0].version.split(' ')[1]
    )

    // Count tables
    const tables = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log(`📋 Tables created: ${tables[0].count}`)

    // List all tables
    const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    console.log('📝 Tables:')
    tableNames.forEach(({ tablename }) => {
      console.log(`   - ${tablename}`)
    })

    console.log('\n🎉 Database schema verification complete!')

    // Disconnect
    await prisma.$disconnect()
    console.log('👋 Connection closed')
  } catch (error) {
    console.error('❌ Database test failed:', error)
    process.exit(1)
  }
}

testConnection()
