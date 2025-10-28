import { prisma } from '@/lib/prisma'
import { AppointmentStatus, PaymentStatus, CancellationSource } from '@prisma/client'

async function testAppointmentData() {
  console.log('🧪 Testing Appointment model...\n')

  try {
    // Test AppointmentStatus enum
    console.log('📊 Appointment Statuses:')
    Object.values(AppointmentStatus).forEach(status => {
      console.log(`   - ${status}`)
    })

    // Test PaymentStatus enum
    console.log('\n💳 Payment Statuses:')
    Object.values(PaymentStatus).forEach(status => {
      console.log(`   - ${status}`)
    })

    // Test CancellationSource enum
    console.log('\n🚫 Cancellation Sources:')
    Object.values(CancellationSource).forEach(source => {
      console.log(`   - ${source}`)
    })

    console.log('\n✅ Appointment model test complete!')
  } catch (error) {
    console.error('❌ Appointment test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testAppointmentData()
