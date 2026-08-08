import { fireEvent, render, screen, waitFor } from '@/lib/test-utils'
import { formatCalendarDate, RescheduleModal } from '@/components/bookings/reschedule-modal'
import { CancelBookingModal } from '@/components/bookings/cancel-booking-modal'

const booking = {
  id: 'booking-1',
  confirmationNumber: 'OP-1234',
  startTime: '2026-08-10T09:00:00.000Z',
  endTime: '2026-08-10T10:00:00.000Z',
  duration: 60,
  service: {
    id: 'service-1',
    name: 'Hair styling',
    duration: 60,
  },
}

describe('booking management modals', () => {
  const originalTimezone = process.env.TZ

  beforeAll(() => {
    process.env.TZ = 'Europe/London'
  })

  afterAll(() => {
    process.env.TZ = originalTimezone
  })

  afterEach(() => {
    jest.restoreAllMocks()
    delete (global as { fetch?: typeof fetch }).fetch
  })

  it('requests and submits the selected local calendar date during BST', async () => {
    const selectedDate = new Date(2026, 7, 14)

    expect(selectedDate.toISOString().split('T')[0]).toBe('2026-08-13')
    expect(formatCalendarDate(selectedDate)).toBe('2026-08-14')

    global.fetch = jest.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            availability: [
              {
                slots: [{ startTime: '10:00', endTime: '11:00', available: true }],
              },
            ],
          },
        }),
      } as Response
    }) as typeof fetch

    const onReschedule = jest.fn(async () => undefined)

    render(
      <RescheduleModal
        isOpen
        onClose={jest.fn()}
        onReschedule={onReschedule}
        booking={booking}
        businessSlug="louises-studio"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '14' }))

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/availability?slug=louises-studio&date=2026-08-14&serviceId=service-1&includeSlots=true'
      )
    )

    fireEvent.click(await screen.findByRole('button', { name: '10:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Reschedule' }))

    await waitFor(() =>
      expect(onReschedule).toHaveBeenCalledWith('2026-08-14', '10:00', '11:00', undefined)
    )
  })

  it('keeps the cancellation notification thumb inside a fixed-width switch track', () => {
    render(
      <CancelBookingModal
        isOpen
        onClose={jest.fn()}
        onCancel={jest.fn(async () => undefined)}
        booking={{
          ...booking,
          customer: {
            name: 'Louise',
            email: 'a-long-customer-address@example.com',
          },
        }}
      />
    )

    const toggle = screen.getByRole('switch', { name: 'Notify customer of cancellation' })
    const thumb = toggle.firstElementChild

    expect(toggle).toHaveClass('w-11', 'shrink-0', 'overflow-hidden')
    expect(thumb).toHaveClass('absolute', 'left-1', 'translate-x-5')

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(thumb).toHaveClass('translate-x-0')
  })
})
