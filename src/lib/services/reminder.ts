import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import {
  generateReminderEmailHtml,
  generateReminderEmailText,
} from '@/lib/email/templates/appointment-reminder'
import { format, addHours } from 'date-fns'

interface ReminderSettings {
  enabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  reminderTimes: number[]
  defaultMessage?: string
}

interface ProcessResult {
  processed: number
  sent: number
  errors: number
  details: Array<{
    appointmentId: string
    customerEmail: string
    reminderType: string
    status: 'sent' | 'skipped' | 'error'
    error?: string
  }>
}

export async function processReminders(): Promise<ProcessResult> {
  const result: ProcessResult = {
    processed: 0,
    sent: 0,
    errors: 0,
    details: [],
  }

  try {
    // Get all businesses with reminders enabled
    const businesses = await prisma.business.findMany({
      where: {
        settings: {
          path: ['reminders', 'enabled'],
          equals: true,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        settings: true,
      },
    })

    const now = new Date()

    for (const business of businesses) {
      const settings = (business.settings as Record<string, unknown>) || {}
      const reminderSettings = settings.reminders as ReminderSettings | undefined

      if (!reminderSettings?.enabled || !reminderSettings?.emailEnabled) {
        continue
      }

      // Process each reminder time (e.g., 24 hours, 2 hours before)
      for (const hoursBeforeAppointment of reminderSettings.reminderTimes) {
        const reminderType = `${hoursBeforeAppointment}h`

        // Find appointments that need reminders
        // Window: appointments starting in (hoursBeforeAppointment - 0.5) to (hoursBeforeAppointment + 0.5) hours
        const windowStart = addHours(now, hoursBeforeAppointment - 0.5)
        const windowEnd = addHours(now, hoursBeforeAppointment + 0.5)

        const appointments = await prisma.appointment.findMany({
          where: {
            businessId: business.id,
            status: { in: ['CONFIRMED', 'PENDING'] },
            startTime: {
              gte: windowStart,
              lte: windowEnd,
            },
            // Exclude appointments that already have this reminder sent
            NOT: {
              reminders: {
                some: {
                  reminderType: reminderType,
                  status: 'sent',
                },
              },
            },
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
              },
            },
          },
        })

        for (const appointment of appointments) {
          result.processed++

          if (!appointment.customer?.email) {
            result.details.push({
              appointmentId: appointment.id,
              customerEmail: 'N/A',
              reminderType,
              status: 'skipped',
              error: 'No customer email',
            })
            continue
          }

          try {
            // Generate email content
            const emailData = {
              customerName: appointment.customer.name,
              businessName: business.name,
              serviceName: appointment.service.name,
              appointmentDate: new Date(appointment.startTime),
              appointmentTime: format(new Date(appointment.startTime), 'h:mm a'),
              duration: appointment.duration,
              businessPhone: business.phone || undefined,
              businessEmail: business.email || undefined,
              businessAddress: business.address || undefined,
              customMessage: reminderSettings.defaultMessage,
            }

            const html = generateReminderEmailHtml(emailData)
            const text = generateReminderEmailText(emailData)

            // Determine subject based on time
            let subject: string
            if (hoursBeforeAppointment >= 24) {
              const days = Math.round(hoursBeforeAppointment / 24)
              subject = `Reminder: Your appointment in ${days} day${days > 1 ? 's' : ''}`
            } else {
              subject = `Reminder: Your appointment in ${hoursBeforeAppointment} hour${hoursBeforeAppointment > 1 ? 's' : ''}`
            }

            // Send email
            await sendEmail({
              to: appointment.customer.email,
              subject: `${subject} - ${business.name}`,
              html,
              text,
            })

            // Log the reminder
            await prisma.reminderLog.create({
              data: {
                appointmentId: appointment.id,
                reminderType,
                channel: 'email',
                status: 'sent',
              },
            })

            result.sent++
            result.details.push({
              appointmentId: appointment.id,
              customerEmail: appointment.customer.email,
              reminderType,
              status: 'sent',
            })
          } catch (error) {
            // Log failed reminder
            await prisma.reminderLog.create({
              data: {
                appointmentId: appointment.id,
                reminderType,
                channel: 'email',
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            })

            result.errors++
            result.details.push({
              appointmentId: appointment.id,
              customerEmail: appointment.customer.email,
              reminderType,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }
      }
    }

    return result
  } catch (error) {
    console.error('Process reminders error:', error)
    throw error
  }
}

// Send a single reminder (for manual trigger)
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

    if (!appointment.customer?.email) {
      return { success: false, error: 'No customer email' }
    }

    const settings = (appointment.business.settings as Record<string, unknown>) || {}
    const reminderSettings = settings.reminders as ReminderSettings | undefined

    const emailData = {
      customerName: appointment.customer.name,
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
      to: appointment.customer.email,
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
