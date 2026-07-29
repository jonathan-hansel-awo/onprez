from pathlib import Path

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
if old not in source:
    raise RuntimeError('Reschedule business select block was not found')
booking.write_text(source.replace(old, new, 1))

Path('.github/workflows/p2-025-verify-fix.yml').unlink(missing_ok=True)
Path('.github/p2-025-fix.py').unlink(missing_ok=True)
