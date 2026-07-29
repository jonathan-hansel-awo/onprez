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

Path('.github/workflows/p2-025-verify-fix.yml').unlink(missing_ok=True)
Path('.github/p2-025-fix.py').unlink(missing_ok=True)
