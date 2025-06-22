import {
  User,
  Business,
  Service,
  Customer,
  Appointment,
  BusinessHours,
  UserRole,
  BusinessCategory,
  AppointmentStatus,
} from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Business,
  Service,
  Customer,
  Appointment,
  BusinessHours,
  UserRole,
  BusinessCategory,
  AppointmentStatus,
};

// Custom types for API responses
export type SafeUser = Omit<User, 'passwordHash'>;

export type BusinessWithRole = Business & {
  role: UserRole;
};

export type ServiceWithAppointments = Service & {
  appointments: Appointment[];
};

export type AppointmentWithDetails = Appointment & {
  service: Service;
  customer: Customer;
};

export type CustomerWithAppointments = Customer & {
  appointments: Appointment[];
};

// Form/Input types
export type CreateBusinessInput = {
  name: string;
  category: BusinessCategory;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone?: string;
};

export type CreateServiceInput = {
  name: string;
  description?: string;
  price?: number;
  duration: number;
};

export type CreateAppointmentInput = {
  serviceId: string;
  customerId: string;
  startTime: Date;
  notes?: string;
};

export type BusinessSettings = {
  currency?: string;
  timeSlotDuration?: number;
  bookingAdvanceDays?: number;
  cancellationHours?: number;
  requirePayment?: boolean;
};
