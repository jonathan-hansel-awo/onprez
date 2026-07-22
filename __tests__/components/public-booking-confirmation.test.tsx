import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@/lib/test-utils'
import { BookingIndexClient } from '@/app/(public)/[handle]/book/BookingIndexClient'
import { BookingPageClient } from '@/app/(public)/[handle]/book/[serviceId]/BookingPageClient'
import { BookingSuccessClient } from '@/app/(public)/[handle]/book/success/BookingSuccessClient'
import { getBookingConfirmationEmail } from '@/lib/booking/public-booking'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/components/booking', () => ({
  BookingWidget: ({
    onComplete,
  }: {
    onComplete?: (
      booking: {
        customerEmail: string
      },
      confirmation: { id: string; confirmationNumber: string; status: string }
    ) => void
  }) => (
    <button
      type="button"
      onClick={() =>
        onComplete?.(
          { customerEmail: 'ada@example.com' },
          { id: 'booking-1', confirmationNumber: 'AB12CD34', status: 'CONFIRMED' }
        )
      }
    >
      Complete test booking
    </button>
  ),
}))

const business = {
  id: 'business-1',
  name: 'Heavenly Pamper Palace',
  slug: 'heavenly-pamper-palace',
  timezone: 'Europe/London',
  address: '18 Willow Court',
  phone: '01353 555 018',
  email: 'hello@heavenlypamper.example',
}

const bookingResponse = {
  id: 'booking-1',
  confirmationNumber: 'AB12CD34',
  status: 'CONFIRMED',
  startTime: '2026-07-22T09:00:00.000Z',
  endTime: '2026-07-22T10:00:00.000Z',
  duration: 60,
  service: {
    name: 'Serenity Massage',
    price: 70,
    duration: 60,
  },
  customer: {
    name: 'Ada Okoro',
    email: 'ada@example.com',
  },
  business: {
    name: business.name,
    timezone: business.timezone,
    address: business.address,
  },
  notes: null,
  createdAt: '2026-07-22T07:40:00.000Z',
}

describe('public booking confirmation handoff', () => {
  beforeEach(() => {
    mockPush.mockReset()
    window.sessionStorage.clear()
    jest.restoreAllMocks()
    delete (global as { fetch?: typeof fetch }).fetch
  })

  it.each([
    {
      name: 'general booking route',
      component: (
        <BookingIndexClient
          businessId={business.id}
          businessHandle={business.slug}
          businessName={business.name}
          businessTimezone={business.timezone}
        />
      ),
    },
    {
      name: 'preselected service route',
      component: (
        <BookingPageClient
          business={{ ...business, handle: business.slug, logoUrl: null }}
          service={{
            id: 'service-1',
            name: 'Serenity Massage',
            description: null,
            price: 70,
            duration: 60,
          }}
        />
      ),
    },
  ])('retains the lookup email before redirecting from the $name', async ({ component }) => {
    const user = userEvent.setup()
    render(component)

    await user.click(screen.getByRole('button', { name: 'Complete test booking' }))

    expect(getBookingConfirmationEmail('AB12CD34')).toBe('ada@example.com')
    expect(mockPush).toHaveBeenCalledWith(
      '/heavenly-pamper-palace/book/success?confirmation=AB12CD34'
    )
  })

  it('uses the retained email to load the newly created booking', async () => {
    window.sessionStorage.setItem(
      'onprez:booking-confirmation-email:AB12CD34',
      'ada@example.com'
    )
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: bookingResponse }),
    })
    global.fetch = fetchMock as typeof fetch

    render(<BookingSuccessClient business={business} confirmationNumber="AB12CD34" />)

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/bookings?confirmationNumber=AB12CD34&customerEmail=ada%40example.com'
      )
    )
    expect(await screen.findByRole('heading', { name: 'Booking Confirmed!' })).toBeInTheDocument()
    expect(screen.getByText('Serenity Massage')).toBeInTheDocument()
  })

  it('does not make an unverified confirmation lookup without the retained email', async () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock as typeof fetch

    render(<BookingSuccessClient business={business} confirmationNumber="AB12CD34" />)

    expect(
      await screen.findByRole('heading', {
        name: 'Booking details are no longer available in this tab',
      })
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
