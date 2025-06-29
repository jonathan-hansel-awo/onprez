import {
  Business,
  Service,
  Appointment,
  Customer,
  User,
} from '@/types/database';

export const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  passwordHash: 'mocked-password-hash',
  emailVerified: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

export const mockBusiness: Business = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  slug: 'test-salon',
  name: 'Test Salon',
  category: 'SALON',
  email: 'salon@example.com',
  updatedAt: new Date('2025-01-01'),
  description: 'A test salon for mock data.',
  phone: '+12345678901',
  address: '123 Main St, Test City, NY',
  timezone: 'America/New_York',
  createdAt: new Date('2025-01-01'),
  settings: {
    businessHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '15:00' },
      sunday: { closed: true },
    },
    bufferTime: 15,
    advanceBookingDays: 30,
  },
};

import Decimal from 'decimal.js';

export const mockService: Service = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  businessId: mockBusiness.id,
  name: 'Haircut',
  description: 'Professional haircut and styling',
  price: new Decimal(50.0),
  duration: 60, // minutes
  active: true,
  order: 1,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

export const mockCustomer: Customer = {
  id: '123e4567-e89b-12d3-a456-426614174004',
  businessId: mockBusiness.id,
  email: 'customer@example.com',
  name: 'John Doe',
  phone: '+1234567890',
  notes: 'Regular customer, prefers afternoon appointments',
  tags: ['vip', 'regular'],
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

export const mockAppointment: Appointment = {
  id: '123e4567-e89b-12d3-a456-426614174005',
  businessId: mockBusiness.id,
  serviceId: mockService.id,
  customerId: mockCustomer.id,
  startTime: new Date('2025-01-15T14:00:00Z'),
  endTime: new Date('2025-01-15T15:00:00Z'),
  status: 'CONFIRMED',
  notes: 'Customer requested layers',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

export const mockPage = {
  id: '123e4567-e89b-12d3-a456-426614174006',
  businessId: mockBusiness.id,
  templateId: '123e4567-e89b-12d3-a456-426614174007',
  slug: 'home',
  isPublished: true,
  content: {
    hero: {
      title: 'Welcome to Test Salon',
      subtitle: 'Professional hair care services',
      image: '/images/hero.jpg',
    },
    services: {
      title: 'Our Services',
      items: [mockService],
    },
  },
  seoMeta: {
    title: 'Test Salon - Professional Hair Care',
    description: 'Professional hair care services in your area',
  },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};
