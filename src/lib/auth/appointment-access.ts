import { prisma } from '@/lib/prisma'
import {
  BusinessAuthError,
  requireBusinessAccess,
  requireBusinessRole,
  type BusinessRole,
} from '@/lib/auth/business-access'

export async function getAppointmentBusinessId(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      businessId: true,
      status: true,
      startTime: true,
      endTime: true,
      customerId: true,
      customerEmail: true,
      businessNotes: true,
      customerNotes: true,
      totalAmount: true,
    },
  })

  return appointment
}

export async function requireAppointmentAccess(userId: string, appointmentId: string) {
  const appointment = await getAppointmentBusinessId(appointmentId)

  if (!appointment) {
    throw new BusinessAuthError('Appointment not found', 404, 'BUSINESS_NOT_FOUND')
  }

  const context = await requireBusinessAccess(userId, appointment.businessId)

  return {
    appointment,
    context,
  }
}

export async function requireAppointmentRole(
  userId: string,
  appointmentId: string,
  roles: BusinessRole[] = ['ADMIN', 'MANAGER', 'STAFF']
) {
  const appointment = await getAppointmentBusinessId(appointmentId)

  if (!appointment) {
    throw new BusinessAuthError('Appointment not found', 404, 'BUSINESS_NOT_FOUND')
  }

  const context = await requireBusinessRole(userId, appointment.businessId, roles)

  return {
    appointment,
    context,
  }
}
