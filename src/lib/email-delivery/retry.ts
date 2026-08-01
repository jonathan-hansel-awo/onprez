import { EmailDeliveryCategory } from '@prisma/client'
import { retryTrackedEmail } from '@/lib/email-delivery/delivery'
import { toSettingsRecord } from '@/lib/notifications/preferences'
import { prisma } from '@/lib/prisma'
import {
  buildBusinessBookingEmail,
  buildCustomerBookingEmail,
  type BookingCreatedNotificationInput,
} from '@/lib/services/booking-notifications'
import { renderAppointmentStatusEmail, type SendEmailOptions } from '@/lib/services/email'
import {
  buildBusinessInquiryEmail,
  buildCustomerInquiryEmail,
  type InquiryCreatedNotificationInput,
} from '@/lib/services/inquiry-notifications'
import { buildAppointmentReminderEmail } from '@/lib/services/reminder'

function normalized(value?: string | null) {
  return value?.trim().toLowerCase() || undefined
}

export async function retryEmailDelivery(deliveryId: string, userId: string) {
  const delivery = await prisma.emailDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      appointment: {
        include: {
          customer: { select: { name: true, email: true } },
          service: { select: { name: true, duration: true, currency: true } },
          business: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
              timezone: true,
              settings: true,
              owner: { select: { email: true } },
            },
          },
        },
      },
      inquiry: {
        include: {
          business: {
            select: {
              name: true,
              email: true,
              settings: true,
              owner: { select: { email: true } },
            },
          },
        },
      },
    },
  })

  if (!delivery) return null

  let options: SendEmailOptions | null = null
  let expectedStatus = delivery.appointment?.status

  if (
    delivery.category === EmailDeliveryCategory.BOOKING_CUSTOMER_CONFIRMATION ||
    delivery.category === EmailDeliveryCategory.BOOKING_BUSINESS_NOTIFICATION
  ) {
    const appointment = delivery.appointment
    if (!appointment) throw new Error('The booking for this delivery no longer exists')

    const input: BookingCreatedNotificationInput = {
      bookingId: appointment.id,
      status: appointment.status,
      customerName: appointment.customerName || appointment.customer.name,
      customerEmail: appointment.customerEmail || appointment.customer.email,
      customerPhone: appointment.customerPhone,
      customerNotes: appointment.customerNotes,
      businessName: appointment.business.name,
      businessEmail: appointment.business.email,
      businessOwnerEmail: appointment.business.owner.email,
      businessAddress: appointment.business.address,
      serviceName: appointment.service.name,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      timezone: appointment.business.timezone,
      totalAmount: Number(appointment.totalAmount),
      currency: appointment.service.currency,
    }

    options =
      delivery.category === EmailDeliveryCategory.BOOKING_CUSTOMER_CONFIRMATION
        ? buildCustomerBookingEmail(input)
        : buildBusinessBookingEmail(
            input,
            normalized(appointment.business.email) || appointment.business.owner.email
          )
  } else if (delivery.category === EmailDeliveryCategory.APPOINTMENT_STATUS_UPDATE) {
    const appointment = delivery.appointment
    if (!appointment) throw new Error('The booking for this delivery no longer exists')

    options = {
      to: appointment.customerEmail,
      ...renderAppointmentStatusEmail({
        to: appointment.customerEmail,
        customerName: appointment.customerName,
        businessName: appointment.business.name,
        serviceName: appointment.service.name,
        bookingId: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        timezone: appointment.business.timezone,
        businessAddress: appointment.business.address,
        fromStatus: appointment.previousStatus || appointment.status,
        toStatus: appointment.status,
        reason: appointment.cancellationReason || appointment.rescheduleReason || undefined,
      }),
    }
  } else if (delivery.category === EmailDeliveryCategory.APPOINTMENT_REMINDER) {
    if (!delivery.appointment) throw new Error('The booking for this delivery no longer exists')
    options = buildAppointmentReminderEmail(delivery.appointment)
  } else if (
    delivery.category === EmailDeliveryCategory.INQUIRY_CUSTOMER_ACKNOWLEDGEMENT ||
    delivery.category === EmailDeliveryCategory.INQUIRY_BUSINESS_NOTIFICATION
  ) {
    const inquiry = delivery.inquiry
    if (!inquiry) throw new Error('The inquiry for this delivery no longer exists')
    const settings = toSettingsRecord(inquiry.business.settings)
    const input: InquiryCreatedNotificationInput = {
      businessId: inquiry.businessId,
      inquiryId: inquiry.id,
      customerName: inquiry.customerName,
      customerEmail: inquiry.customerEmail,
      customerPhone: inquiry.customerPhone,
      subject: inquiry.subject,
      message: inquiry.message,
      preferredContact: 'EITHER',
      businessName: inquiry.business.name,
      businessEmail: inquiry.business.email,
      businessOwnerEmail: inquiry.business.owner.email,
      businessSettings: inquiry.business.settings,
    }
    const autoReply =
      typeof settings.inquiryAutoReply === 'string' && settings.inquiryAutoReply.trim()
        ? settings.inquiryAutoReply.trim()
        : `Thank you for contacting ${inquiry.business.name}. Your inquiry has been received and the business will get back to you as soon as possible.`
    const configuredRecipient =
      typeof settings.inquiryNotificationEmail === 'string'
        ? normalized(settings.inquiryNotificationEmail)
        : undefined

    options =
      delivery.category === EmailDeliveryCategory.INQUIRY_CUSTOMER_ACKNOWLEDGEMENT
        ? buildCustomerInquiryEmail(input, autoReply)
        : buildBusinessInquiryEmail(
            input,
            configuredRecipient ||
              normalized(inquiry.business.email) ||
              inquiry.business.owner.email
          )
    expectedStatus = undefined
  }

  if (!options) throw new Error('This email cannot be rebuilt safely')
  return retryTrackedEmail(delivery.id, userId, options, expectedStatus)
}
