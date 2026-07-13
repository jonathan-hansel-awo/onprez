import { renderAppointmentStatusEmail } from '@/lib/services/email'

describe('appointment status email', () => {
  it('renders the actual transition and business-local appointment time', () => {
    const rendered = renderAppointmentStatusEmail({
      to: 'alex@example.com',
      customerName: 'Alex',
      businessName: 'OnPrez Salon',
      serviceName: 'Consultation',
      startTime: new Date('2030-07-15T09:00:00.000Z'),
      timezone: 'Europe/London',
      fromStatus: 'PENDING',
      toStatus: 'CONFIRMED',
    })

    expect(rendered.subject).toBe('Appointment confirmed - OnPrez Salon')
    expect(rendered.text).toMatch(/Time: 10:00 \(Europe\/London\)[\s\S]*PENDING to CONFIRMED/)
    expect(rendered.html).toContain('PENDING → CONFIRMED')
  })
})
