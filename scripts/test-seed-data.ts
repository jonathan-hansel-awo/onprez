import { prisma } from '../lib/prisma'

async function testSeedData() {
  console.log('🧪 Testing seed data...\n')

  try {
    // Count all records
    const [
      userCount,
      businessCount,
      categoryCount,
      serviceCount,
      customerCount,
      appointmentCount,
      reviewCount,
      configCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.serviceCategory.count(),
      prisma.service.count(),
      prisma.customer.count(),
      prisma.appointment.count(),
      prisma.review.count(),
      prisma.rateLimitConfig.count(),
    ])

    console.log('📊 Record Counts:')
    console.log(`   Users: ${userCount}`)
    console.log(`   Businesses: ${businessCount}`)
    console.log(`   Service Categories: ${categoryCount}`)
    console.log(`   Services: ${serviceCount}`)
    console.log(`   Customers: ${customerCount}`)
    console.log(`   Appointments: ${appointmentCount}`)
    console.log(`   Reviews: ${reviewCount}`)
    console.log(`   Rate Limit Configs: ${configCount}`)

    // Check demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@onprez.com' },
      include: {
        businesses: true,
      },
    })

    if (demoUser) {
      console.log('\n✅ Demo user exists')
      console.log(`   Email: ${demoUser.email}`)
      console.log(`   Businesses: ${demoUser.businesses.length}`)
    } else {
      console.log('\n❌ Demo user not found')
    }

    // Check published businesses
    const publishedBusinesses = await prisma.business.findMany({
      where: { isPublished: true },
    })

    console.log(`\n🌐 Published Businesses: ${publishedBusinesses.length}`)
    publishedBusinesses.forEach(b => {
      console.log(`   - ${b.name} (/${b.slug})`)
    })

    // Check appointment statuses
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      _count: true,
    })

    console.log('\n📅 Appointments by Status:')
    appointmentsByStatus.forEach(({ status, _count }) => {
      console.log(`   ${status}: ${_count}`)
    })

    // Check VIP customers
    const vipCustomers = await prisma.customer.findMany({
      where: { isVip: true },
    })

    console.log(`\n⭐ VIP Customers: ${vipCustomers.length}`)
    vipCustomers.forEach(c => {
      console.log(`   - ${c.name} ($${c.totalSpent} spent)`)
    })

    // Verify data integrity
    console.log('\n🔍 Data Integrity Checks:')

    const orphanedAppointments = await prisma.appointment.findMany({
      where: {
        OR: [{ business: undefined }, { service: undefined }, { customer: undefined }],
      },
    })

    if (orphanedAppointments.length === 0) {
      console.log('   ✅ No orphaned appointments')
    } else {
      console.log(`   ❌ Found ${orphanedAppointments.length} orphaned appointments`)
    }

    const businessesWithoutHours = await prisma.business.findMany({
      where: {
        businessHours: {
          none: {},
        },
      },
    })

    if (businessesWithoutHours.length === 0) {
      console.log('   ✅ All businesses have operating hours')
    } else {
      console.log(`   ❌ ${businessesWithoutHours.length} businesses without hours`)
    }

    console.log('\n✅ Seed data verification complete!')
  } catch (error) {
    console.error('❌ Seed data test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testSeedData()
