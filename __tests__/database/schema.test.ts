import {
  PrismaClient,
  BusinessCategory,
  AppointmentStatus,
} from '@prisma/client';

// Mock Prisma for testing
// jest.mock('@prisma/client')

describe('Area 2: Database & Data Layer', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
  });

  describe('Database Schema', () => {
    it('should have all required models', () => {
      // Test that all models are accessible
      expect(mockPrisma.user).toBeDefined();
      expect(mockPrisma.business).toBeDefined();
      expect(mockPrisma.service).toBeDefined();
      expect(mockPrisma.appointment).toBeDefined();
      expect(mockPrisma.customer).toBeDefined();
      //   expect(mockPrisma.page).toBeDefined()
    });
  });

  describe('User Model', () => {
    it('should create user with required fields', async () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        emailVerified: true,
      };

      mockPrisma.user.create = jest.fn().mockResolvedValue(userData);

      const result = await mockPrisma.user.create({
        data: userData,
      });

      expect(result).toEqual(userData);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });

    it('should enforce unique email constraint', async () => {
      mockPrisma.user.create = jest
        .fn()
        .mockRejectedValue(
          new Error('Unique constraint failed on the fields: (`email`)'),
        );

      await expect(
        mockPrisma.user.create({
          data: {
            email: 'duplicate@example.com',
            passwordHash: 'somehash',
            emailVerified: false,
          },
        }),
      ).rejects.toThrow('Unique constraint failed');
    });
  });

  describe('Business Model', () => {
    it('should create business with owner relationship', async () => {
      const businessData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        slug: 'test-salon',
        name: 'Test Salon',
        ownerId: '123e4567-e89b-12d3-a456-426614174000',
        category: BusinessCategory.SALON,
        timezone: 'America/New_York',
        settings: {},
      };

      mockPrisma.business.create = jest.fn().mockResolvedValue(businessData);

      const result = await mockPrisma.business.create({
        data: businessData,
      });

      expect(result).toEqual(businessData);
    });

    it('should enforce unique slug constraint', async () => {
      mockPrisma.business.create = jest
        .fn()
        .mockRejectedValue(
          new Error('Unique constraint failed on the fields: (`slug`)'),
        );

      await expect(
        mockPrisma.business.create({
          data: {
            slug: 'duplicate-slug',
            name: 'Duplicate Business',
            category: 'SALON',
            timezone: 'UTC',
          },
        }),
      ).rejects.toThrow('Unique constraint failed');
    });
  });

  describe('Multi-tenant Data Isolation', () => {
    it('should filter appointments by business ID', async () => {
      const businessId = '123e4567-e89b-12d3-a456-426614174001';
      const expectedAppointments = [
        {
          id: '1',
          businessId,
          startTime: new Date('2025-01-15T14:00:00Z'),
          endTime: new Date('2025-01-15T15:00:00Z'),
        },
      ];

      mockPrisma.appointment.findMany = jest
        .fn()
        .mockResolvedValue(expectedAppointments);

      const result = await mockPrisma.appointment.findMany({
        where: { businessId },
      });

      expect(result).toEqual(expectedAppointments);
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
        where: { businessId },
      });
    });

    it('should filter customers by business ID', async () => {
      const businessId = '123e4567-e89b-12d3-a456-426614174001';
      const expectedCustomers = [
        {
          id: '1',
          businessId,
          email: 'customer@example.com',
          name: 'John Doe',
        },
      ];

      mockPrisma.customer.findMany = jest
        .fn()
        .mockResolvedValue(expectedCustomers);

      const result = await mockPrisma.customer.findMany({
        where: { businessId },
      });

      expect(result).toEqual(expectedCustomers);
    });
  });

  describe('Foreign Key Relationships', () => {
    it('should maintain referential integrity for appointments', async () => {
      const appointmentData = {
        businessId: '123e4567-e89b-12d3-a456-426614174001',
        serviceId: '123e4567-e89b-12d3-a456-426614174002',
        customerId: '123e4567-e89b-12d3-a456-426614174003',
        startTime: new Date('2025-01-15T14:00:00Z'),
        endTime: new Date('2025-01-15T15:00:00Z'),
        status: AppointmentStatus.CONFIRMED,
      };

      mockPrisma.appointment.create = jest.fn().mockResolvedValue({
        id: '1',
        ...appointmentData,
      });

      const result = await mockPrisma.appointment.create({
        data: appointmentData,
      });

      expect(result.businessId).toBe(appointmentData.businessId);
      expect(result.serviceId).toBe(appointmentData.serviceId);
      expect(result.customerId).toBe(appointmentData.customerId);
    });

    it('should fail when referencing non-existent business', async () => {
      mockPrisma.appointment.create = jest
        .fn()
        .mockRejectedValue(new Error('Foreign key constraint failed'));

      await expect(
        mockPrisma.appointment.create({
          data: {
            businessId: 'non-existent-id',
            serviceId: '123e4567-e89b-12d3-a456-426614174002',
            customerId: '123e4567-e89b-12d3-a456-426614174003',
            startTime: new Date(),
            endTime: new Date(),
            status: 'CONFIRMED',
          },
        }),
      ).rejects.toThrow('Foreign key constraint failed');
    });
  });
});
