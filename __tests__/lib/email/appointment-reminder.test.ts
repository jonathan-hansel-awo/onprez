import {
  generateReminderEmailHtml,
  generateReminderEmailText,
} from '@/lib/email/templates/appointment-reminder'
import { formatLongDateInTimezone, formatTimeInTimezone } from '@/lib/utils/timezone'

describe('appointment reminder timezone display', () => {
  it('shows the business-local date and time in customer email content', () => {
    const instant = new Date('2030-07-15T09:00:00.000Z')
    const timezone = 'Europe/London'
    const data = {
      customerName: 'Alex',
      businessName: 'OnPrez Salon',
      serviceName: 'Consultation',
      appointmentDate: formatLongDateInTimezone(instant, timezone),
      appointmentTime: `${formatTimeInTimezone(instant, timezone)} (${timezone})`,
      duration: 30,
    }

    expect(generateReminderEmailText(data)).toContain('Date: Monday, 15 July 2030')
    expect(generateReminderEmailText(data)).toContain('Time: 10:00 (Europe/London)')
    expect(generateReminderEmailHtml(data)).toContain('10:00 (Europe/London)')
  })
})
