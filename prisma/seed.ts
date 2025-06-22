import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'demo@onprez.com',
      passwordHash: hashedPassword,
      emailVerified: true,
    },
  });

  console.log('✅ Created test user:', user.email);

  // Create test business
  const business = await prisma.business.create({
    data: {
      name: 'Demo Salon',
      slug: 'demo-salon',
      category: 'SALON',
      description: 'A demo salon for testing OnPrez',
      phone: '+1234567890',
      email: 'contact@demosalon.com',
      address: '123 Main St, Demo City, DC 12345',
      settings: {
        currency: 'USD',
        timeSlotDuration: 30,
        bookingAdvanceDays: 30,
      },
    },
  });

  console.log('✅ Created test business:', business.name);

  // Link user to business
  await prisma.userBusinessRole.create({
    data: {
      userId: user.id,
      businessId: business.id,
      role: 'OWNER',
    },
  });

  // Create business hours (Monday to Friday, 9 AM to 5 PM)
  const businessHours = [];
  for (let day = 1; day <= 5; day++) {
    businessHours.push({
      businessId: business.id,
      dayOfWeek: day,
      openTime: '09:00',
      closeTime: '17:00',
      isOpen: true,
    });
  }

  await prisma.businessHours.createMany({
    data: businessHours,
  });

  console.log('✅ Created business hours');

  // Create services
  const services = await prisma.service.createMany({
    data: [
      {
        businessId: business.id,
        name: 'Haircut',
        description: 'Professional haircut and styling',
        price: 35,
        duration: 30,
        order: 1,
      },
      {
        businessId: business.id,
        name: 'Hair Color',
        description: 'Full hair coloring service',
        price: 85,
        duration: 90,
        order: 2,
      },
      {
        businessId: business.id,
        name: 'Manicure',
        description: 'Professional manicure service',
        price: 25,
        duration: 45,
        order: 3,
      },
    ],
  });

  console.log('✅ Created services:', services.count);

  // Create a test customer
  const customer = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1234567891',
      tags: ['regular', 'vip'],
    },
  });

  console.log('✅ Created test customer:', customer.name);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
