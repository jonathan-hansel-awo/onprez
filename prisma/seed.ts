import {
  prisma,
  cleanDatabase,
  hashPassword,
  createDefaultBusinessHours,
  getFutureDate,
  getPastDate,
  randomElement,
  randomNumber,
} from './seed-utils'
import { BusinessCategory, PriceType, AppointmentStatus, PaymentStatus } from '@prisma/client'

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Clean existing data
  await cleanDatabase()

  // ============================================
  // USERS
  // ============================================
  console.log('👤 Creating users...')

  const demoPassword = await hashPassword('password123')

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@onprez.com',
      passwordHash: demoPassword,
      emailVerified: true,
    },
  })

  const sarahUser = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      passwordHash: demoPassword,
      emailVerified: true,
    },
  })

  const mikeUser = await prisma.user.create({
    data: {
      email: 'mike@example.com',
      passwordHash: demoPassword,
      emailVerified: true,
    },
  })

  console.log('   ✓ Created 3 users')

  // ============================================
  // BUSINESSES
  // ============================================
  console.log('🏢 Creating businesses...')

  // Demo Salon
  const demoSalon = await prisma.business.create({
    data: {
      ownerId: demoUser.id,
      name: 'Demo Salon',
      slug: 'demo-salon',
      category: BusinessCategory.SALON,
      description: 'A modern hair salon offering cuts, colors, and styling services.',
      tagline: 'Where style meets expertise',
      email: 'info@demosalon.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'US',
      timezone: 'America/Los_Angeles',
      isPublished: true,
      socialLinks: {
        instagram: 'https://instagram.com/demosalon',
        facebook: 'https://facebook.com/demosalon',
      },
      settings: {
        bufferTime: 15,
        advanceBookingDays: 30,
        sameDayBooking: true,
        emailNotifications: true,
        bookingConfirmation: true,
        reminderEnabled: true,
        reminderHours: 24,
        showPrices: true,
      },
      branding: {
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        fontFamily: 'Inter',
      },
      seoTitle: 'Demo Salon - Professional Hair Services',
      seoDescription: 'Premium hair salon in San Francisco. Expert cuts, colors, and styling.',
      seoKeywords: ['hair salon', 'haircut', 'hair color', 'san francisco'],
    },
  })

  await createDefaultBusinessHours(demoSalon.id)

  // Sarah's Spa
  const sarahsSpa = await prisma.business.create({
    data: {
      ownerId: sarahUser.id,
      name: "Sarah's Spa & Wellness",
      slug: 'sarahs-spa',
      category: BusinessCategory.SPA,
      description: 'Luxury spa treatments and massage therapy in a tranquil setting.',
      tagline: 'Relax, rejuvenate, renew',
      email: 'hello@sarahsspa.com',
      phone: '+1 (555) 234-5678',
      address: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      timezone: 'America/Los_Angeles',
      isPublished: true,
      isPremium: true,
    },
  })

  await createDefaultBusinessHours(sarahsSpa.id)

  // Mike's Fitness
  const mikesFitness = await prisma.business.create({
    data: {
      ownerId: mikeUser.id,
      name: 'Mike Fitness Studio',
      slug: 'mike-fitness',
      category: BusinessCategory.FITNESS,
      description: 'Personal training and group fitness classes.',
      tagline: 'Transform your body, elevate your life',
      email: 'train@mikefitness.com',
      phone: '+1 (555) 345-6789',
      address: '789 Gym Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '73301',
      timezone: 'America/Chicago',
      isPublished: false, // Not published yet
    },
  })

  await createDefaultBusinessHours(mikesFitness.id)

  console.log('   ✓ Created 3 businesses')

  // ============================================
  // SERVICE CATEGORIES
  // ============================================
  console.log('📂 Creating service categories...')

  const hairCategory = await prisma.serviceCategory.create({
    data: {
      businessId: demoSalon.id,
      name: 'Hair Services',
      description: 'Cuts, colors, and styling',
      order: 1,
      color: '#3B82F6',
      icon: '✂️',
    },
  })

  const treatmentCategory = await prisma.serviceCategory.create({
    data: {
      businessId: demoSalon.id,
      name: 'Treatments',
      description: 'Deep conditioning and special treatments',
      order: 2,
      color: '#8B5CF6',
      icon: '💆',
    },
  })

  const massageCategory = await prisma.serviceCategory.create({
    data: {
      businessId: sarahsSpa.id,
      name: 'Massage Therapy',
      order: 1,
      color: '#10B981',
      icon: '💆',
    },
  })

  console.log('   ✓ Created 3 service categories')

  // ============================================
  // SERVICES
  // ============================================
  console.log('💈 Creating services...')

  // Demo Salon Services
  const haircutService = await prisma.service.create({
    data: {
      businessId: demoSalon.id,
      categoryId: hairCategory.id,
      name: 'Haircut & Style',
      description: 'Professional haircut with wash and style. Includes consultation.',
      tagline: 'Expert cuts for every style',
      price: 50,
      priceType: PriceType.FIXED,
      duration: 60,
      bufferTime: 15,
      active: true,
      featured: true,
      order: 1,
      preparationNotes: 'Please arrive with clean, dry hair if possible.',
    },
  })

  const colorService = await prisma.service.create({
    data: {
      businessId: demoSalon.id,
      categoryId: hairCategory.id,
      name: 'Hair Color',
      description: 'Full color application or highlights. Includes toner and style.',
      price: 80,
      priceType: PriceType.STARTING_AT,
      duration: 120,
      bufferTime: 15,
      active: true,
      order: 2,
    },
  })

  const treatmentService = await prisma.service.create({
    data: {
      businessId: demoSalon.id,
      categoryId: treatmentCategory.id,
      name: 'Deep Conditioning Treatment',
      description: 'Intensive treatment to restore health and shine.',
      price: 35,
      priceType: PriceType.FIXED,
      duration: 30,
      active: true,
      order: 3,
    },
  })

  const consultService = await prisma.service.create({
    data: {
      businessId: demoSalon.id,
      name: 'Free Consultation',
      description: 'Discuss your hair goals with our expert stylists.',
      price: 0,
      priceType: PriceType.FREE,
      duration: 15,
      active: true,
      order: 4,
    },
  })

  // Sarah's Spa Services
  const swedishMassage = await prisma.service.create({
    data: {
      businessId: sarahsSpa.id,
      categoryId: massageCategory.id,
      name: 'Swedish Massage',
      description: 'Relaxing full-body massage to ease tension.',
      price: 60,
      priceType: PriceType.RANGE,
      priceRangeMin: 60,
      priceRangeMax: 120,
      duration: 60,
      active: true,
      featured: true,
    },
  })

  const deepTissue = await prisma.service.create({
    data: {
      businessId: sarahsSpa.id,
      categoryId: massageCategory.id,
      name: 'Deep Tissue Massage',
      description: 'Therapeutic massage targeting deep muscle layers.',
      price: 90,
      priceType: PriceType.STARTING_AT,
      duration: 90,
      active: true,
    },
  })

  // Mike's Fitness Services
  const personalTraining = await prisma.service.create({
    data: {
      businessId: mikesFitness.id,
      name: 'Personal Training Session',
      description: 'One-on-one training customized to your goals.',
      price: 75,
      priceType: PriceType.FIXED,
      duration: 60,
      active: true,
      featured: true,
    },
  })

  console.log('   ✓ Created 7 services')

  // ============================================
  // CUSTOMERS
  // ============================================
  console.log('👥 Creating customers...')

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        businessId: demoSalon.id,
        email: 'john.doe@example.com',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1 (555) 111-2222',
        emailOptIn: true,
        tags: ['regular', 'vip'],
        totalBookings: 5,
        completedBookings: 4,
        totalSpent: 250,
        firstBookingAt: getPastDate(90),
        lastBookingAt: getPastDate(14),
        isVip: true,
      },
    }),
    prisma.customer.create({
      data: {
        businessId: demoSalon.id,
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1 (555) 222-3333',
        emailOptIn: true,
        smsOptIn: true,
        tags: ['regular'],
        totalBookings: 3,
        completedBookings: 3,
        totalSpent: 150,
        firstBookingAt: getPastDate(60),
        lastBookingAt: getPastDate(7),
      },
    }),
    prisma.customer.create({
      data: {
        businessId: demoSalon.id,
        email: 'alex.johnson@example.com',
        name: 'Alex Johnson',
        phone: '+1 (555) 333-4444',
        emailOptIn: false,
        tags: ['new'],
        totalBookings: 1,
        completedBookings: 0,
        totalSpent: 0,
        firstBookingAt: new Date(),
      },
    }),
    prisma.customer.create({
      data: {
        businessId: sarahsSpa.id,
        email: 'emily.brown@example.com',
        name: 'Emily Brown',
        phone: '+1 (555) 444-5555',
        emailOptIn: true,
        smsOptIn: true,
        tags: ['regular', 'referral'],
        totalBookings: 8,
        completedBookings: 7,
        totalSpent: 560,
        isVip: true,
        firstBookingAt: getPastDate(120),
        lastBookingAt: getPastDate(10),
      },
    }),
  ])

  console.log('   ✓ Created 4 customers')

  // ============================================
  // APPOINTMENTS
  // ============================================
  console.log('📅 Creating appointments...')

  // Past completed appointment
  await prisma.appointment.create({
    data: {
      businessId: demoSalon.id,
      serviceId: haircutService.id,
      customerId: customers[0].id,
      startTime: getPastDate(14),
      endTime: new Date(getPastDate(14).getTime() + 60 * 60 * 1000),
      duration: 60,
      timezone: 'America/Los_Angeles',
      status: AppointmentStatus.COMPLETED,
      confirmedAt: getPastDate(15),
      completedAt: getPastDate(14),
      customerName: customers[0].name,
      customerEmail: customers[0].email,
      customerPhone: customers[0].phone!,
      totalAmount: 50,
      paymentStatus: PaymentStatus.PAID,
      paidAt: getPastDate(14),
      bookingSource: 'website',
    },
  })

  // Past cancelled appointment
  await prisma.appointment.create({
    data: {
      businessId: demoSalon.id,
      serviceId: colorService.id,
      customerId: customers[1].id,
      startTime: getPastDate(7),
      endTime: new Date(getPastDate(7).getTime() + 120 * 60 * 1000),
      duration: 120,
      timezone: 'America/Los_Angeles',
      status: AppointmentStatus.CANCELLED,
      cancelledAt: getPastDate(8),
      cancellationSource: 'CUSTOMER',
      cancellationReason: 'Schedule conflict',
      customerName: customers[1].name,
      customerEmail: customers[1].email,
      customerPhone: customers[1].phone!,
      totalAmount: 80,
      paymentStatus: PaymentStatus.UNPAID,
      bookingSource: 'website',
    },
  })

  // Upcoming confirmed appointment
  await prisma.appointment.create({
    data: {
      businessId: demoSalon.id,
      serviceId: haircutService.id,
      customerId: customers[1].id,
      startTime: getFutureDate(3),
      endTime: new Date(getFutureDate(3).getTime() + 60 * 60 * 1000),
      duration: 60,
      timezone: 'America/Los_Angeles',
      status: AppointmentStatus.CONFIRMED,
      confirmedAt: new Date(),
      customerName: customers[1].name,
      customerEmail: customers[1].email,
      customerPhone: customers[1].phone!,
      customerNotes: 'Please use organic products if available',
      totalAmount: 50,
      paymentStatus: PaymentStatus.UNPAID,
      bookingSource: 'website',
    },
  })

  // Upcoming pending appointment
  await prisma.appointment.create({
    data: {
      businessId: demoSalon.id,
      serviceId: colorService.id,
      customerId: customers[2].id,
      startTime: getFutureDate(7),
      endTime: new Date(getFutureDate(7).getTime() + 120 * 60 * 1000),
      duration: 120,
      timezone: 'America/Los_Angeles',
      status: AppointmentStatus.PENDING,
      customerName: customers[2].name,
      customerEmail: customers[2].email,
      customerPhone: customers[2].phone!,
      totalAmount: 80,
      paymentStatus: PaymentStatus.UNPAID,
      bookingSource: 'phone',
    },
  })

  // Sarah's Spa appointment
  await prisma.appointment.create({
    data: {
      businessId: sarahsSpa.id,
      serviceId: swedishMassage.id,
      customerId: customers[3].id,
      startTime: getFutureDate(5),
      endTime: new Date(getFutureDate(5).getTime() + 60 * 60 * 1000),
      duration: 60,
      timezone: 'America/Los_Angeles',
      status: AppointmentStatus.CONFIRMED,
      confirmedAt: new Date(),
      customerName: customers[3].name,
      customerEmail: customers[3].email,
      customerPhone: customers[3].phone!,
      requiresDeposit: true,
      depositAmount: 30,
      depositPaid: true,
      depositPaidAt: new Date(),
      totalAmount: 60,
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
      bookingSource: 'website',
    },
  })

  console.log('   ✓ Created 5 appointments')

  // ============================================
  // REVIEWS
  // ============================================
  console.log('⭐ Creating reviews...')

  await prisma.review.create({
    data: {
      businessId: demoSalon.id,
      customerId: customers[0].id,
      rating: 5,
      title: 'Excellent service!',
      comment: "Best haircut I've had in years. The stylist really listened to what I wanted.",
      isPublished: true,
      isVerified: true,
    },
  })

  await prisma.review.create({
    data: {
      businessId: demoSalon.id,
      customerId: customers[1].id,
      rating: 4,
      title: 'Great experience',
      comment: 'Very professional and friendly staff. Will definitely come back.',
      isPublished: true,
      isVerified: true,
      businessResponse: 'Thank you for your kind words! We look forward to seeing you again.',
      respondedAt: new Date(),
    },
  })

  await prisma.review.create({
    data: {
      businessId: sarahsSpa.id,
      customerId: customers[3].id,
      rating: 5,
      title: 'So relaxing!',
      comment: 'The massage was incredible. I felt completely rejuvenated afterward.',
      isPublished: true,
      isVerified: true,
    },
  })

  console.log('   ✓ Created 3 reviews')

  // ============================================
  // RATE LIMIT CONFIGS
  // ============================================
  console.log('⚡ Creating rate limit configs...')

  await prisma.rateLimitConfig.create({
    data: {
      endpoint: 'auth:login',
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
      description: 'Login attempts',
      isActive: true,
    },
  })

  await prisma.rateLimitConfig.create({
    data: {
      endpoint: 'booking:create',
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000,
      description: 'Booking creation',
      isActive: true,
    },
  })

  console.log('   ✓ Created 2 rate limit configs')

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n✅ Seed completed successfully!\n')
  console.log('📊 Summary:')
  console.log('   - 3 users')
  console.log('   - 3 businesses')
  console.log('   - 3 service categories')
  console.log('   - 7 services')
  console.log('   - 4 customers')
  console.log('   - 5 appointments')
  console.log('   - 3 reviews')
  console.log('   - 2 rate limit configs')
  console.log('\n🔑 Test Login:')
  console.log('   Email: demo@onprez.com')
  console.log('   Password: password123')
  console.log('\n🌐 Test URLs:')
  console.log('   - onprez.com/demo-salon')
  console.log('   - onprez.com/sarahs-spa')
  console.log('   - onprez.com/mike-fitness (unpublished)')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
