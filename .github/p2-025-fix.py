from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        raise RuntimeError(f'{label} was not found')
    return source.replace(old, new, 1)


calendar_page = Path('src/app/dashboard/settings/calendar/page.tsx')
calendar_page.write_text(
    calendar_page.read_text().replace('variant="danger"', 'variant="destructive"')
)

booking = Path('src/lib/services/booking.ts')
source = booking.read_text()
old = '''        business: {
          select: {
            name: true,
            email: true,
            phone: true,
            timezone: true,
          },
        },
      },
    })

    const rescheduledAt = updatedAppointment.rescheduledAt || new Date()'''
new = '''        business: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            timezone: true,
          },
        },
      },
    })

    const rescheduledAt = updatedAppointment.rescheduledAt || new Date()'''
booking.write_text(replace_once(source, old, new, 'Reschedule business select block'))

email = Path('src/lib/services/email.ts')
source = email.read_text()
source = replace_once(
    source,
    '''  bookingId: string
  startTime: Date
  endTime: Date''',
    '''  bookingId?: string
  startTime: Date
  endTime?: Date''',
    'Appointment status calendar input fields',
)
source = replace_once(
    source,
    '''  const calendarInput = {
    bookingId: input.bookingId,
    customerName: input.customerName,
    businessName: input.businessName,
    businessAddress: input.businessAddress,
    serviceName: input.serviceName,
    startTime: input.startTime,
    endTime: input.endTime,
    timezone: input.timezone,
  }
  const showCalendarLinks =
    input.toStatus === AppointmentStatus.CONFIRMED ||
    input.toStatus === AppointmentStatus.RESCHEDULED''',
    '''  const hasCalendarDetails = Boolean(input.bookingId && input.endTime)
  const calendarInput = {
    bookingId: input.bookingId || 'calendar-details-unavailable',
    customerName: input.customerName,
    businessName: input.businessName,
    businessAddress: input.businessAddress,
    serviceName: input.serviceName,
    startTime: input.startTime,
    endTime: input.endTime || input.startTime,
    timezone: input.timezone,
  }
  const showCalendarLinks =
    hasCalendarDetails &&
    (input.toStatus === AppointmentStatus.CONFIRMED ||
      input.toStatus === AppointmentStatus.RESCHEDULED)''',
    'Appointment status calendar rendering block',
)
source = replace_once(
    source,
    '''    attachments:
      input.toStatus === AppointmentStatus.CANCELLED
        ? [buildBookingCalendarAttachment(calendarInput, 'CANCEL')]''',
    '''    attachments:
      input.toStatus === AppointmentStatus.CANCELLED && hasCalendarDetails
        ? [buildBookingCalendarAttachment(calendarInput, 'CANCEL')]''',
    'Appointment cancellation attachment condition',
)
email.write_text(source)

notification_tests = Path('src/lib/services/booking-notifications.test.ts')
source = notification_tests.read_text()
source = replace_once(
    source,
    '''jest.mock('@/lib/services/email', () => ({
  sendEmail: jest.fn(),
}))''',
    '''jest.mock('@/lib/services/email', () => ({
  sendEmail: jest.fn(),
}))

jest.mock('@/lib/integrations/google-calendar', () => ({
  syncAppointmentToGoogleCalendar: jest.fn().mockResolvedValue({ success: true }),
}))''',
    'Google Calendar notification mock',
)
source = replace_once(
    source,
    '''    expect(customerEmail.text).toContain('will review your request')
    expect(businessEmail.subject).toBe('New booking request: Serenity Massage - Ada Okoro')''',
    '''    expect(customerEmail.text).toContain('will review your request')
    expect(customerEmail.attachments).toBeUndefined()
    expect(businessEmail.subject).toBe('New booking request: Serenity Massage - Ada Okoro')''',
    'Pending customer calendar expectation',
)
source = replace_once(
    source,
    '''  it('does not add calendar details to the customer email', () => {
    const customerEmail = buildCustomerBookingEmail(baseInput)

    expect(customerEmail.html).not.toContain('Add to calendar')
    expect(customerEmail.attachments).toBeUndefined()
  })''',
    '''  it('adds calendar links and an .ics attachment to confirmed customer emails', () => {
    const customerEmail = buildCustomerBookingEmail(baseInput)

    expect(customerEmail.html).toContain('Add to Google Calendar')
    expect(customerEmail.html).toContain('Add to Outlook Calendar')
    expect(customerEmail.attachments).toEqual([
      expect.objectContaining({
        filename: 'booking-AB12CD34.ics',
        contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
      }),
    ])
  })''',
    'Confirmed customer calendar expectation',
)
notification_tests.write_text(source)

Path('.github/workflows/p2-025-verify-fix.yml').unlink(missing_ok=True)
Path('.github/p2-025-fix.py').unlink(missing_ok=True)
