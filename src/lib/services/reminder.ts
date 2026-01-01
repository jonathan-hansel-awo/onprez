import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/services/email'
import { generateReminderEmailHtml, generateReminderEmailText } from '@/lib/email/templates/appointment-reminder'
import { format } from 'date-fns'

interface ReminderSettings {
  enabled: boolean
  emailEnabled: boolean
  defaultMessage?: string
}

// Send a single reminder (manual trigger from dashboard)
export async function sendAppointmentReminder(
  appointmentId: string,
  reminderType: string = 'manual'
): Promise<{ success: boolean; error?: string }> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        business: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            settings: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
      },
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    const customerEmail = appointment.customerEmail || appointment.customer?.email
    const customerName = appointment.customerName || appointment.customer?.name

    if (!customerEmail) {
      return { success: false, error: 'No customer email' }
    }

    const settings = appointment.business.settings as Record<string, unknown> || {}
    const reminderSettings = settings.reminders as ReminderSettings | undefined

    const emailData = {
      customerName: customerName || 'Customer',
      businessName: appointment.business.name,
      serviceName: appointment.service.name,
      appointmentDate: new Date(appointment.startTime),
      appointmentTime: format(new Date(appointment.startTime), 'h:mm a'),
      duration: appointment.duration,
      businessPhone: appointment.business.phone || undefined,
      businessEmail: appointment.business.email || undefined,
      businessAddress: appointment.business.address || undefined,
      customMessage: reminderSettings?.defaultMessage,
    }

    const html = generateReminderEmailHtml(emailData)
    const text = generateReminderEmailText(emailData)

    await sendEmail({
      to: customerEmail,
      subject: `Appointment Reminder - ${appointment.business.name}`,
      html,
      text,
    })

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
