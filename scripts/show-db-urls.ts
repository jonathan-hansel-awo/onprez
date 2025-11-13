import { getDatabaseUrls } from '@/lib/db-config'

async function showDbConfig() {
  console.log('🔍 Environment:', process.env.NODE_ENV)
  console.log('🔍 DATABASE_ENV:', process.env.DATABASE_ENV || 'not set')

  const urls = getDatabaseUrls()

  console.log('\n📊 Database URLs from config:')
  console.log('URL:', urls.url?.substring(0, 50) + '...')
  console.log('Direct URL:', urls.directUrl?.substring(0, 50) + '...')

  console.log('\n📊 Raw environment variables:')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
  console.log('DIRECT_URL:', process.env.DIRECT_URL?.substring(0, 50) + '...')
  console.log('PREVIEW_DATABASE_URL:', process.env.PREVIEW_DATABASE_URL?.substring(0, 50) + '...')
  console.log('PREVIEW_DIRECT_URL:', process.env.PREVIEW_DIRECT_URL?.substring(0, 50) + '...')
}

showDbConfig()
