import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSchema() {
  try {
    // Check what columns exist in users table
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'role'
    `

    console.log('📊 Role column info:', result)

    // Also check if there's a UserRole enum type in database
    const enumCheck = await prisma.$queryRaw`
      SELECT typname, enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE typname = 'UserRole'
    `

    console.log('🔍 UserRole enum in database:', enumCheck)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()
