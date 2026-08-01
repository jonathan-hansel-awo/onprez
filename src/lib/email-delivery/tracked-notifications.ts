import { EmailDeliveryAudience, EmailDeliveryCategory } from '@prisma/client'
import { sendTrackedEmail } from '@/lib/email-delivery/delivery'
import {
  renderAppointmentStatusEmail,
  type AppointmentStatusEmailInput,
  type EmailResult,
} from '@/lib/services/email'

export async function sendTrackedAppointmentStatusEmail(
  businessId: string,
  input: AppointmentStatusEmailInput
): Promise<EmailResult> {
  if (!input.bookingId) {
    throw new Error('Tracked appointment status emails require a booking ID')
  }

  return sendTrackedEmail(
    {
      businessId,
      appointmentId: input.bookingId,
      dedupeKey: [
        'booking',
        input.bookingId,
        'status',
        input.toStatus,
        input.startTime.toISOString(),
        'customer',
      ].join(':'),
      category: EmailDeliveryCategory.APPOINTMENT_STATUS_UPDATE,
      audience: EmailDeliveryAudience.CUSTOMER,
      appointmentStatus: input.toStatus,
    },
    {
      to: input.to,
      ...renderAppointmentStatusEmail(input),
    }
  )
}
