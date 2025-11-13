import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function fixRoleColumn() {
  try {
    console.log('🔍 Checking database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50))

    // Check if role column exists
    const checkColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'role'
    `

    console.log('📊 Role column exists:', checkColumn)

    if (Array.isArray(checkColumn) && checkColumn.length === 0) {
      console.log('❌ Role column does NOT exist!')
      console.log('⚠️  Adding role column...')

      // Create the enum type first
      await prisma.$executeRaw`
        DO $$ BEGIN
          CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `

      console.log('✅ Created UserRole enum (or already exists)')

      // Add the column
      await prisma.$executeRaw`
        ALTER TABLE "users" 
        ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'OWNER';
      `

      console.log('✅ Added role column!')

      // Verify
      const verify = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
      `

      console.log('✅ Verification:', verify)
    } else {
      console.log('✅ Role column already exists!')
    }

    // List all columns in users table
    const allColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `

    console.log('\n📋 All columns in users table:')
    console.log(allColumns)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixRoleColumn()
