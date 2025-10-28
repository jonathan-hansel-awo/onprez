// scripts/test-email-service.ts
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local BEFORE importing anything else
config({ path: resolve(process.cwd(), '.env.local') })

// Now import your modules
import { sendVerificationEmail } from '@/lib/services/email'

async function testEmail() {
  console.log('Testing email service...')
  console.log('API Key exists:', !!process.env.RESEND_API_KEY)

  const result = await sendVerificationEmail(
    'your-email@example.com',
    'https://onprez.com/verify?token=test123',
    'Test User'
  )

  if (result.success) {
    console.log('✅ Email sent successfully!')
    console.log('Message ID:', result.messageId)
  } else {
    console.log('❌ Email failed:', result.error)
  }
}

testEmail()
