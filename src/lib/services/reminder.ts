import { EmailDeliveryAudience, EmailDeliveryCategory } from '@prisma/client'
import { sendTrackedEmail } from '@/lib/email-delivery/delivery'
import { prisma } from '@/lib/prisma'
import type { SendEmailOptions } from '@/lib/services/email'
import {
  generateReminderEmailHtml,
  generateReminderEmailText,
} from '@/lib/email/templates/appointment-reminder'
import {
  DEFAULT_TIMEZONE,
  formatLongDateInTimezone,
  formatTimeInTimezone,
} from '@/lib/utils/timezone'
import { readNotificationPreferences } from '@/lib/notifications/preferences'

interface ReminderSettings {
  enabled: boolean
  emailEnabled: boolean
  defaultMessage?: string
}

type ReminderAppointment = NonNullable<Awaited<ReturnType<typeof loadReminderAppointment>>>

async function loadReminderAppointment(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      business: {
        select: {
          name: true,
          email: true,
          phone: true,
          address: true,
          settings: true,
          timezone: true,
        },
      },
      customer: { select: { name: true, email: true } },
      service: { select: { name: true, duration: true } },
    },
  })
}

export function buildAppointmentReminderEmail(
  appointment: ReminderAppointment
): SendEmailOptions | null {
  const settings = (appointment.business.settings as Record<string, unknown>) || {}
  const customerEmail = appointment.customerEmail || appointment.customer?.email
  const customerName = appointment.customerName || appointment.customer?.name
  if (!customerEmail) return null

  const reminderSettings = settings.reminders as ReminderSettings | undefined
  const timezone = appointment.business.timezone || DEFAULT_TIMEZONE
  const appointmentStart = new Date(appointment.startTime)
  const emailData = {
    customerName: customerName || 'Customer',
    businessName: appointment.business.name,
    serviceName: appointment.service.name,
    appointmentDate: formatLongDateInTimezone(appointmentStart, timezone),
    appointmentTime: `${formatTimeInTimezone(appointmentStart, timezone)} (${timezone})`,
    duration: appointment.duration,
    businessPhone: appointment.business.phone || undefined,
    businessEmail: appointment.business.email || undefined,
    businessAddress: appointment.business.address || undefined,
    customMessage: reminderSettings?.defaultMessage,
  }

  return {
    to: customerEmail,
    subject: `Appointment Reminder - ${appointment.business.name}`,
    html: generateReminderEmailHtml(emailData),
    text: generateReminderEmailText(emailData),
  }
}

// Send a single reminder. Manual dashboard reminders remain explicit user actions;
// scheduled/automated reminders follow the saved business preference.
export async function sendAppointmentReminder(
  appointmentId: string,
  reminderType: string = 'manual'
): Promise<{ success: boolean; error?: string }> {
  try {
    const appointment = await loadReminderAppointment(appointmentId)

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    const settings = (appointment.business.settings as Record<string, unknown>) || {}
    const preferences = readNotificationPreferences(settings)

    if (reminderType !== 'manual' && !preferences.customerReminders) {
      return { success: true }
    }

    const email = buildAppointmentReminderEmail(appointment)
    if (!email) {
      return { success: false, error: 'No customer email' }
    }

    const result = await sendTrackedEmail(
      {
        businessId: appointment.businessId,
        appointmentId,
        dedupeKey: `booking:${appointmentId}:reminder:${reminderType}:${appointment.reminderCount + 1}`,
        category: EmailDeliveryCategory.APPOINTMENT_REMINDER,
        audience: EmailDeliveryAudience.CUSTOMER,
        appointmentStatus: appointment.status,
        reminderType,
      },
      email
    )
    if (!result.success) throw new Error(result.error || 'Email provider rejected the reminder')

    // Log the reminder
    await prisma.reminderLog.create({
      data: {
        appointmentId,
        reminderType,
        channel: 'email',
        status: 'sent',
      },
    })

    // Update appointment reminder tracking
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        reminderSentAt: new Date(),
        reminderCount: { increment: 1 },
      },
    })

    return { success: true }
  } catch (error) {
    // Log failed reminder
    await prisma.reminderLog.create({
      data: {
        appointmentId,
        reminderType,
        channel: 'email',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    console.error('Send reminder error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reminder',
    }
  }
}
