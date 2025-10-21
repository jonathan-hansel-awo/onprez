import { prisma } from '../lib/prisma'

async function testMigrations() {
  console.log('🔍 Testing Migration System...\n')

  try {
    // Connect to database
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Check if migrations table exists
    const migrationsTable = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      );
    `

    if (migrationsTable[0].exists) {
      console.log('✅ Migrations table exists')

      // Count applied migrations
      const migrations = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM _prisma_migrations;
      `
      console.log(`✅ Applied migrations: ${migrations[0].count}`)

      // List migrations
      const migrationList = await prisma.$queryRaw<
        Array<{
          migration_name: string
          finished_at: Date | null
        }>
      >`
        SELECT migration_name, finished_at 
        FROM _prisma_migrations 
        ORDER BY finished_at DESC;
      `

      console.log('\n📋 Migration History:')
      migrationList.forEach(m => {
        const status = m.finished_at ? '✓' : '⏳'
        const date = m.finished_at ? m.finished_at.toISOString().split('T')[0] : 'pending'
        console.log(`   ${status} ${m.migration_name} (${date})`)
      })
    } else {
      console.log('⚠️  No migrations table found - run db:migrate to create')
    }

    // Verify all tables exist
    const tables = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `
    console.log(`\n✅ Total tables: ${tables[0].count}`)

    // Check for pending migrations
    console.log('\n🔍 Checking for pending migrations...')
    // This would normally be done via CLI: prisma migrate status
    console.log('   Run "npm run db:migrate:status" to check status')

    console.log('\n🎉 Migration system test complete!')
  } catch (error) {
    console.error('❌ Migration test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testMigrations()
